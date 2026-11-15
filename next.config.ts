import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const baseConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        // O SOG é um arquivo estático grande (~45 MB) servido de `public/`.
        // Cache de 1 dia no navegador/CDN, revalidado em segundo plano por até
        // 7 dias. Ao substituir o modelo, prefira um novo nome de arquivo.
        source: "/models/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        // Streamed SOG: cada versão fica numa pasta com o hash do conteúdo
        // (`museu_streamed/<hash>/`, ver scripts/lod/finalize-streamed-sog.mjs). Um caminho nunca
        // recebe conteúdo novo, então os blocos podem ficar em cache por 1 ano sem revalidar, e
        // um navegador nunca mistura blocos de duas versões. Declarado depois da regra geral:
        // para a mesma chave, a última regra que casa prevalece.
        source: "/models/museu_streamed/:version/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

/**
 * Rotas internas de desenvolvimento usam a extensão `.dev.tsx` (ex.: a calibração em
 * `src/app/dev/camera/page.dev.tsx`). Essa extensão só é reconhecida pelo servidor de
 * desenvolvimento: no build de produção a rota não existe (404) e seu código não é
 * incluído em nenhum pacote enviado ao navegador.
 */
export default function nextConfig(phase: string): NextConfig {
  const pageExtensions = ["tsx", "ts", "jsx", "js"];
  if (phase === PHASE_DEVELOPMENT_SERVER) pageExtensions.unshift("dev.tsx");
  return { ...baseConfig, pageExtensions };
}
