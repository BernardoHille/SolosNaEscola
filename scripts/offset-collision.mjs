#!/usr/bin/env node
/**
 * Desloca verticalmente a colisão por voxels já gerada, para alinhar o piso da colisão ao piso
 * visível do splat.
 *
 * Uso:   node scripts/offset-collision.mjs      (também chamado ao final de `npm run collision`)
 *
 * Por quê: a voxelização marca como sólida toda célula de 5 cm com densidade de splats, e os
 * splats do piso se espalham alguns centímetros acima da superfície. O topo do piso da colisão
 * ficava ≈ 10 cm acima do piso visível (y ≈ 0), e o Walk Mode põe os olhos 1,5 m acima do piso
 * da colisão. Deslocar a colisão inteira para baixo baixa a câmera na mesma medida, sem mexer no
 * modelo visual nem no SOG.
 *
 * Só o metadado muda: o viewer posiciona a grade de voxels por `gridBounds` (o `.voxel.bin` não
 * guarda coordenadas). O deslocamento já aplicado fica registrado em `solosVerticalOffset`, então
 * rodar o script de novo não acumula deslocamentos: ele aplica apenas a diferença para o valor de
 * `verticalOffset` em src/data/collision.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function applyVerticalOffset() {
  const config = JSON.parse(readFileSync(resolve(root, "src/data/collision.json"), "utf8"));
  const target = Number(config.verticalOffset ?? 0);
  const file = resolve(root, "public", config.voxelFile);
  const meta = JSON.parse(readFileSync(file, "utf8"));

  const applied = Number(meta.solosVerticalOffset ?? 0);
  const delta = target - applied;
  if (Math.abs(delta) < 1e-9) {
    console.log(`Colisão já deslocada ${target} m na vertical; nada a fazer.`);
    return;
  }
  const round = (n) => Math.round(n * 1e9) / 1e9;
  for (const bounds of [meta.gridBounds, meta.sceneBounds]) {
    if (!bounds) continue;
    bounds.min[1] = round(bounds.min[1] + delta);
    bounds.max[1] = round(bounds.max[1] + delta);
  }
  meta.solosVerticalOffset = target;
  writeFileSync(file, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`Colisão deslocada ${delta > 0 ? "+" : ""}${round(delta)} m na vertical (total ${target} m).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  applyVerticalOffset();
}
