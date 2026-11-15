#!/usr/bin/env bash
# Pipeline completo do Streamed SOG da exposição, a partir do projeto SuperSplat (sem novo treino).
#
# Uso (Git Bash no Windows, ou qualquer shell POSIX):
#   SSPROJ="D:/TCC Gaussian/Output 60k/output60k.ssproj" WORK="D:/TCC Gaussian/lod-work" \
#     bash scripts/lod/build-streamed-sog.sh
#
# Os intermediários (PLYs de centenas de MB) ficam em $WORK, fora do Git. Só o resultado final vai
# para public/models/museu_streamed/<hash>/ (via finalize-streamed-sog.mjs).
#
# Etapas:
#  1. Extrai o PLY editado do .ssproj e confere se há splats apagados no projeto.
#  2. LOD 0: aplica a rotação de -90° em X que leva o PLY do projeto ao espaço do SOG publicado
#     (verificado splat a splat com compare-sources.py; ver docs/lod-streaming.md).
#  3. LOD 1–3: decimação uniforme (-d) a 50 %, 25 % e 10 %. A adaptativa foi comparada e perdeu
#     1–2,5 dB de PSNR nesta cena (docs/lod-streaming.md).
#  4. Empacota em Streamed SOG com nós espaciais de ~64 mil gaussianas e arquivos de ~256 mil.
#  5. Valida, versiona por hash e publica o manifesto.
set -euo pipefail

: "${SSPROJ:?defina SSPROJ com o caminho do .ssproj}"
: "${WORK:?defina WORK com uma pasta de trabalho fora do repositório}"
ST_VERSION="${ST_VERSION:-3.11.2}"
ST="npx --yes @playcanvas/splat-transform@${ST_VERSION}"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"

CHUNK_COUNT=64          # nós (decisão de LOD) com ~64 mil gaussianas no LOD 0
CHUNK_EXTENT=1          # inteiro, em unidades do arquivo (1 unidade = SCENE_SCALE = 5,4 m)
CHUNK_MIN=8
FILE_COUNT="256,256,256,512"  # mil gaussianas por arquivo, do LOD 0 ao 3
# O SplatTransform 3.x grava SOG v3 por padrão, mas o PlayCanvas 2.23 (no supersplat-viewer 1.42)
# só lê a v2: com v3 o carregamento trava em `loadTextures`. A v2 é a opção oficial para viewers
# anteriores e só descarta o que esta cena não usa (opacidade acima de 1, dados extras, 4ª banda SH).
SOG_VERSION=2

mkdir -p "$WORK/src" "$WORK/lods/uniform" "$WORK/out"

echo "== 1. Extração do projeto"
node "$REPO/scripts/lod/extract-ssproj.mjs" "$SSPROJ" "$WORK/src"

echo "== 2. LOD 0 (rotação -90° em X)"
$ST -w "$WORK/src/resource_0.ply" -r -90,0,0 "$WORK/lods/lod0.ply"

echo "== 3. LOD 1–3 (decimação uniforme)"
for pair in "1:50%" "2:25%" "3:10%"; do
  $ST -w "$WORK/lods/lod0.ply" -d "${pair##*:}" "$WORK/lods/uniform/lod${pair%%:*}.ply"
done

echo "== 4. Streamed SOG"
rm -rf "$WORK/out"
$ST -w --lod-chunk-count "$CHUNK_COUNT" --lod-chunk-extent "$CHUNK_EXTENT" --lod-chunk-min "$CHUNK_MIN" \
  --lod-file-count "$FILE_COUNT" --sog-version "$SOG_VERSION" \
  "$WORK/lods/lod0.ply" -l 0 \
  "$WORK/lods/uniform/lod1.ply" -l 1 \
  "$WORK/lods/uniform/lod2.ply" -l 2 \
  "$WORK/lods/uniform/lod3.ply" -l 3 \
  "$WORK/out/lod-meta.json" --filter-nan

cat > "$WORK/params.json" <<EOF
{
  "source": "$(basename "$SSPROJ") → resource_0.ply, rotação -90° em X",
  "splatTransform": "$ST_VERSION",
  "decimation": "uniforme (-d): 50%, 25%, 10%",
  "lodChunkCount": $CHUNK_COUNT,
  "lodChunkExtent": $CHUNK_EXTENT,
  "lodChunkMin": $CHUNK_MIN,
  "lodFileCount": "$FILE_COUNT",
  "sogVersion": $SOG_VERSION
}
EOF

echo "== 5. Validação e publicação"
node "$REPO/scripts/lod/finalize-streamed-sog.mjs" "$WORK/out" "$WORK/params.json"
echo "Opcional: conferência splat a splat com o SOG publicado:"
echo "  $ST public/models/museu_web.sog \"$WORK/src/museu_web_decoded.ply\" && python scripts/lod/compare-sources.py \"$WORK/src/museu_web_decoded.ply\" \"$WORK/lods/lod0.ply\""
