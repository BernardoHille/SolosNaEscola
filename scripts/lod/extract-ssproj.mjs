#!/usr/bin/env node
/**
 * Extrai do projeto SuperSplat (.ssproj, um ZIP) o PLY editado e o estado de cada splat, e
 * confere se o projeto tem splats apagados ou ocultos que o PLY ainda contém.
 *
 * Uso: node scripts/lod/extract-ssproj.mjs <projeto.ssproj> <pasta-de-saída>
 *
 * Saída: resource_0.ply, document.json e um relatório (ssproj-report.json).
 *
 * O .ssproj guarda as entradas sem compressão (método 0, "stored"), então basta ler o diretório
 * central do ZIP. Entradas comprimidas são recusadas com uma mensagem clara.
 *
 * Estado por splat (`instances_0.bin`, formato "SSIL" v1 observado no SuperSplat atual): após o
 * cabeçalho, um índice u32 por splat, um u32 por splat e, por fim, um byte de estado por splat com
 * os bits do editor (1 = selecionado, 2 = travado, 4 = apagado). O relatório conta cada bit; apagado
 * diferente de zero significa que o PLY não representa o projeto e o pipeline para.
 */
import { createReadStream, createWriteStream, mkdirSync, openSync, readSync, closeSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";

const [, , projectPath, outDir] = process.argv;
if (!projectPath || !outDir) {
  console.error("Uso: node scripts/lod/extract-ssproj.mjs <projeto.ssproj> <pasta-de-saída>");
  process.exit(2);
}

const fd = openSync(projectPath, "r");
const size = statSync(projectPath).size;
const read = (offset, length) => {
  const buf = Buffer.alloc(length);
  readSync(fd, buf, 0, length, offset);
  return buf;
};

// Fim do diretório central (EOCD): assinatura 0x06054b50 nos últimos 64 KB.
const tailLen = Math.min(size, 65_557);
const tail = read(size - tailLen, tailLen);
const eocd = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
if (eocd < 0) throw new Error("Não é um ZIP (EOCD ausente).");
const entries = tail.readUInt16LE(eocd + 10);
const cdOffset = tail.readUInt32LE(eocd + 16);
const cdSize = tail.readUInt32LE(eocd + 12);
const cd = read(cdOffset, cdSize);

const files = new Map();
for (let p = 0, i = 0; i < entries; i++) {
  if (cd.readUInt32LE(p) !== 0x02014b50) throw new Error("Diretório central inválido.");
  const method = cd.readUInt16LE(p + 10);
  const compSize = cd.readUInt32LE(p + 20);
  const uncompSize = cd.readUInt32LE(p + 24);
  const nameLen = cd.readUInt16LE(p + 28);
  const extraLen = cd.readUInt16LE(p + 30);
  const commentLen = cd.readUInt16LE(p + 32);
  const localOffset = cd.readUInt32LE(p + 42);
  const name = cd.toString("utf8", p + 46, p + 46 + nameLen);
  files.set(name, { method, compSize, uncompSize, localOffset });
  p += 46 + nameLen + extraLen + commentLen;
}

const dataOffset = (entry) => {
  const local = read(entry.localOffset, 30);
  return entry.localOffset + 30 + local.readUInt16LE(26) + local.readUInt16LE(28);
};

const extract = async (name, dest) => {
  const entry = files.get(name);
  if (!entry) throw new Error(`Entrada ausente no projeto: ${name}`);
  if (entry.method !== 0) throw new Error(`${name} está comprimido (método ${entry.method}); extraia com uma ferramenta de ZIP.`);
  const start = dataOffset(entry);
  await pipeline(createReadStream(projectPath, { start, end: start + entry.compSize - 1 }), createWriteStream(dest));
  return entry.uncompSize;
};

mkdirSync(outDir, { recursive: true });
const docEntry = files.get("document.json");
const doc = JSON.parse(read(dataOffset(docEntry), docEntry.compSize).toString("utf8"));
if (doc.splats?.length !== 1) throw new Error(`O projeto tem ${doc.splats?.length ?? 0} splats; o pipeline espera 1.`);
const splat = doc.splats[0];
const resource = doc.resources[splat.resource];

const report = {
  project: projectPath,
  splatName: splat.name,
  resource: resource.filename,
  numRows: resource.numRows,
  transform: { position: splat.position, rotation: splat.rotation, scale: splat.scale },
  state: null,
};

// Estado por splat.
if (splat.instances && files.has(splat.instances)) {
  const entry = files.get(splat.instances);
  const buf = read(dataOffset(entry), entry.compSize);
  const magic = buf.toString("ascii", 0, 4);
  const count = buf.readUInt32LE(8);
  if (magic === "SSIL" && count === resource.numRows) {
    // Bytes de estado: o último bloco de `count` bytes antes do final.
    const stateStart = 20 + 4 * count + 4 * count;
    const state = buf.subarray(stateStart, stateStart + count);
    const bits = { selected: 0, locked: 0, deleted: 0 };
    for (const v of state) {
      if (v & 1) bits.selected++;
      if (v & 2) bits.locked++;
      if (v & 4) bits.deleted++;
    }
    report.state = { format: "SSIL", count, ...bits };
  } else {
    report.state = { format: magic, count, note: "formato não reconhecido; conferir no SuperSplat" };
  }
}

const bytes = await extract(resource.filename, join(outDir, "resource_0.ply"));
writeFileSync(join(outDir, "document.json"), JSON.stringify(doc, null, 2));
report.resourceBytes = bytes;
writeFileSync(join(outDir, "ssproj-report.json"), JSON.stringify(report, null, 2));
closeSync(fd);
console.log(JSON.stringify(report, null, 2));
if (report.state?.deleted) {
  console.error(`O projeto tem ${report.state.deleted} splats apagados: exporte o PLY pelo SuperSplat (File > Export > PLY) e use-o como fonte.`);
  process.exit(1);
}
