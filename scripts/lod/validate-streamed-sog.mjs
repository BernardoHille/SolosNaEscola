#!/usr/bin/env node
/**
 * Valida um Streamed SOG (`lod-meta.json` + pastas de blocos) antes de publicá-lo.
 *
 * Confere:
 * - Estrutura do índice: `lodLevels`, `counts` (um por nível), `filenames`, `tree`.
 * - Cada arquivo listado existe, é um SOG (`meta.json`) válido e todas as texturas que ele cita
 *   existem e não estão vazias.
 * - Cada folha da árvore aponta para arquivos válidos, com `offset + count` dentro do arquivo.
 * - A soma das folhas por nível é igual a `counts[nível]`.
 * - Limites (bounds) coerentes (mínimo ≤ máximo, números finitos).
 * - Caminhos relativos, sem `..` nem URLs absolutas (o conjunto precisa funcionar como arquivos
 *   estáticos em qualquer pasta).
 *
 * Uso: node scripts/lod/validate-streamed-sog.mjs <pasta-ou-lod-meta.json>
 * Também exporta `validateStreamedSog(dir)` para os testes.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function validateStreamedSog(target) {
  const metaPath = target.endsWith("lod-meta.json") ? target : join(target, "lod-meta.json");
  const dir = dirname(metaPath);
  const errors = [];
  const summary = { lodLevels: 0, counts: [], files: 0, leaves: 0, bytes: 0, bytesByLod: [], filesByLod: [] };
  if (!existsSync(metaPath)) return { ok: false, errors: [`ausente: ${metaPath}`], summary };
  summary.bytes += statSync(metaPath).size;
  let meta;
  try {
    meta = JSON.parse(readFileSync(metaPath, "utf8"));
  } catch (e) {
    return { ok: false, errors: [`lod-meta.json inválido: ${e.message}`], summary };
  }
  const { lodLevels, counts, filenames, tree } = meta;
  if (!Number.isInteger(lodLevels) || lodLevels < 1) errors.push("lodLevels ausente ou inválido");
  if (!Array.isArray(counts) || counts.length !== lodLevels) errors.push("counts deve ter um valor por nível");
  if (!Array.isArray(filenames) || !filenames.length) errors.push("filenames vazio");
  if (!tree) errors.push("tree ausente");
  if (errors.length) return { ok: false, errors, summary };
  summary.lodLevels = lodLevels;
  summary.counts = counts;
  summary.files = filenames.length;
  summary.bytesByLod = Array(lodLevels).fill(0);
  summary.filesByLod = Array(lodLevels).fill(0);

  const fileCounts = [];
  const fileLod = Array(filenames.length).fill(-1);
  filenames.forEach((name, index) => {
    if (/^[a-z]+:|^\/|(^|\/)\.\.(\/|$)/i.test(name)) errors.push(`caminho não relativo: ${name}`);
    const path = join(dir, name);
    if (!existsSync(path)) {
      errors.push(`arquivo ausente: ${name}`);
      fileCounts[index] = -1;
      return;
    }
    let sog;
    try {
      sog = JSON.parse(readFileSync(path, "utf8"));
    } catch (e) {
      errors.push(`meta inválido: ${name} (${e.message})`);
      fileCounts[index] = -1;
      return;
    }
    fileCounts[index] = sog.count;
    let bytes = statSync(path).size;
    const textures = [sog.means?.files, sog.scales?.files, sog.quats?.files, sog.sh0?.files, sog.shN?.files]
      .flat()
      .filter(Boolean);
    if (!textures.length) errors.push(`sem texturas: ${name}`);
    for (const tex of textures) {
      const texPath = join(dirname(path), tex);
      if (!existsSync(texPath)) errors.push(`textura ausente: ${name} → ${tex}`);
      else {
        const size = statSync(texPath).size;
        if (!size) errors.push(`textura vazia: ${name} → ${tex}`);
        bytes += size;
      }
    }
    fileCounts[index] = sog.count;
    fileLod[index] = bytes; // provisório: bytes, o nível é atribuído pelas folhas
    summary.bytes += bytes;
  });

  const fileBytes = fileLod.slice();
  const fileLevel = Array(filenames.length).fill(-1);
  const sums = Array(lodLevels).fill(0);
  const leaves = [];
  const walk = (node) => {
    if (node.children) node.children.forEach(walk);
    else leaves.push(node);
  };
  walk(tree);
  summary.leaves = leaves.length;
  for (const leaf of leaves) {
    const { min, max } = leaf.bound ?? {};
    if (!min || !max || min.some((v, i) => !Number.isFinite(v) || v > max[i])) errors.push("folha com limites inválidos");
    for (const [key, lod] of Object.entries(leaf.lods ?? {})) {
      const level = Number(key);
      if (!(level >= 0 && level < lodLevels)) {
        errors.push(`nível inválido na folha: ${key}`);
        continue;
      }
      if (!(lod.file >= 0 && lod.file < filenames.length)) {
        errors.push(`folha aponta para arquivo inexistente: ${lod.file}`);
        continue;
      }
      if (fileCounts[lod.file] >= 0 && lod.offset + lod.count > fileCounts[lod.file]) {
        errors.push(`folha fora do arquivo ${filenames[lod.file]}: ${lod.offset}+${lod.count} > ${fileCounts[lod.file]}`);
      }
      if (fileLevel[lod.file] !== -1 && fileLevel[lod.file] !== level) errors.push(`arquivo em dois níveis: ${filenames[lod.file]}`);
      fileLevel[lod.file] = level;
      sums[level] += lod.count;
    }
  }
  sums.forEach((sum, level) => {
    if (sum !== counts[level]) errors.push(`nível ${level}: folhas somam ${sum}, counts diz ${counts[level]}`);
  });
  fileLevel.forEach((level, index) => {
    if (level < 0) errors.push(`arquivo não usado por nenhuma folha: ${filenames[index]}`);
    else {
      summary.filesByLod[level]++;
      summary.bytesByLod[level] += fileBytes[index] > 0 ? fileBytes[index] : 0;
    }
  });
  return { ok: errors.length === 0, errors, summary };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  if (!target) {
    console.error("Uso: node scripts/lod/validate-streamed-sog.mjs <pasta-ou-lod-meta.json>");
    process.exit(2);
  }
  const result = validateStreamedSog(target);
  console.log(JSON.stringify(result.summary, null, 2));
  if (!result.ok) {
    console.error(result.errors.slice(0, 50).join("\n"));
    process.exit(1);
  }
  console.log("Streamed SOG válido.");
}
