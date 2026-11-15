#!/usr/bin/env node
/**
 * Publica um Streamed SOG gerado pelo SplatTransform no site:
 * 1. Valida o conjunto (`validate-streamed-sog.mjs`).
 * 2. Calcula um hash do conteúdo e copia tudo para `public/models/museu_streamed/<hash>/`. O caminho
 *    muda sempre que o conteúdo muda, então os arquivos podem ser servidos como imutáveis (cache de
 *    1 ano, ver `next.config.ts`) sem risco de um navegador misturar blocos de versões diferentes.
 * 3. Escreve `src/data/streamedSplat.json`, o manifesto que a aplicação importa (URL, contagens por
 *    nível, tamanhos e parâmetros de geração).
 *
 * Versões anteriores em `public/models/museu_streamed/` não são apagadas automaticamente: remova-as
 * à mão depois de confirmar a nova (o manifesto aponta só para uma).
 *
 * Uso: node scripts/lod/finalize-streamed-sog.mjs <pasta-gerada> <params.json>
 */
import { createHash } from "node:crypto";
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { validateStreamedSog } from "./validate-streamed-sog.mjs";

const [, , generated, paramsPath] = process.argv;
if (!generated) {
  console.error("Uso: node scripts/lod/finalize-streamed-sog.mjs <pasta-gerada> [params.json]");
  process.exit(2);
}
const root = fileURLToPath(new URL("../../", import.meta.url));

const result = validateStreamedSog(generated);
if (!result.ok) {
  console.error(result.errors.join("\n"));
  process.exit(1);
}

const listFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)],
  );
const files = listFiles(generated).sort();
const hash = createHash("sha256");
for (const file of files) {
  hash.update(relative(generated, file).replaceAll("\\", "/"));
  hash.update(readFileSync(file));
}
const version = hash.digest("hex").slice(0, 10);
const destRel = `public/models/museu_streamed/${version}`;
const dest = join(root, destRel);
if (!existsSync(dest)) cpSync(generated, dest, { recursive: true });

const meta = JSON.parse(readFileSync(join(generated, "lod-meta.json"), "utf8"));
const params = paramsPath ? JSON.parse(readFileSync(paramsPath, "utf8")) : {};
const largest = Math.max(
  ...meta.filenames.map((name) => {
    const dir = join(generated, name, "..");
    return readdirSync(dir).reduce((s, f) => s + statSync(join(dir, f)).size, 0);
  }),
);
const manifest = {
  $comment: "Gerado por scripts/lod/finalize-streamed-sog.mjs. Não editar à mão.",
  version,
  url: `/models/museu_streamed/${version}/lod-meta.json`,
  lodLevels: meta.lodLevels,
  lodCounts: meta.counts,
  files: result.summary.files,
  filesByLod: result.summary.filesByLod,
  leafNodes: result.summary.leaves,
  totalBytes: result.summary.bytes,
  bytesByLod: result.summary.bytesByLod,
  largestFileBytes: largest,
  generator: meta.asset?.generator ?? null,
  params,
};
writeFileSync(join(root, "src/data/streamedSplat.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
console.log(`Publicado em ${destRel}/`);
