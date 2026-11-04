#!/usr/bin/env node
/**
 * Gera os dados de colisão por voxels da exposição a partir do SOG publicado.
 *
 * Uso:   npm run collision
 * Requer: Node.js >= 20 e uma GPU com WebGPU (Dawn) — o SplatTransform voxeliza na GPU.
 *
 * Entrada:  public/models/museu_web.sog          (não é modificado)
 * Saída:    public/models/museu_web.voxel.json   (metadados, formato v1.1+)
 *           public/models/museu_web.voxel.bin    (octree esparsa)
 *
 * Os parâmetros vêm de src/data/collision.json, o mesmo arquivo lido pela aplicação,
 * para que escala e ponto de partida (seed) sejam idênticos na geração e no runtime.
 *
 * Pipeline (https://developer.playcanvas.com/user-manual/splat-transform/collision/):
 *   1. -s <escala>         escala uniforme para metros (a mesma aplicada ao splat em runtime);
 *   2. --filter-cluster    mantém apenas o agrupamento conectado ao seed;
 *   3. .voxel.json         voxelização (tamanho e opacidade mínimos configuráveis);
 *   4. --voxel-external-fill  dilata sólidos para fechar aberturas (janelas, porta) e
 *                          preenche o exterior a partir da caixa envolvente;
 *   5. --voxel-carve       inunda o espaço navegável com uma cápsula a partir do seed.
 *   6. deslocamento vertical (`verticalOffset`), ver scripts/offset-collision.mjs.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { applyVerticalOffset } from "./offset-collision.mjs";

const SPLAT_TRANSFORM = "@playcanvas/splat-transform@3.10.3";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(readFileSync(resolve(root, "src/data/collision.json"), "utf8"));
const g = config.generation;

const input = resolve(root, "public", config.modelFile);
const output = resolve(root, "public", config.voxelFile);

const args = [
  "--yes",
  SPLAT_TRANSFORM,
  "-w",
  input,
  "-s",
  String(config.sceneScale),
  "--seed-pos",
  g.seedPosition.join(","),
  "--filter-cluster",
  output,
  "--voxel-size",
  String(g.voxelSize),
  "--voxel-opacity",
  String(g.voxelOpacity),
  "--voxel-external-fill",
  String(g.externalFill),
  "--voxel-carve",
  `${g.carveCapsule.height},${g.carveCapsule.radius}`,
];

// No Windows o npx é um .cmd e precisa de shell; caminhos com espaço vão entre aspas.
const isWindows = process.platform === "win32";
const finalArgs = isWindows ? args.map((a) => (a.includes(" ") ? `"${a}"` : a)) : args;

console.log(`npx ${finalArgs.join(" ")}\n`);
const result = spawnSync("npx", finalArgs, { stdio: "inherit", shell: isWindows });
if (result.status === 0) applyVerticalOffset();
process.exit(result.status ?? 1);
