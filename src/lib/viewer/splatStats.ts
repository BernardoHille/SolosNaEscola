/**
 * Leituras de diagnóstico do Gaussian (painel `?diag=1`). Só leitura; nada aqui altera o motor.
 *
 * Origem de cada número:
 * - `renderedSplats`: `app.stats.frame.gsplats`, estatística do próprio motor (a mesma que o viewer
 *   usa para detectar o início do streaming).
 * - Arquivos e gaussianas residentes: `resource.octree` (campos públicos da classe GSplatOctree:
 *   `files`, `fileResources`, `nodes`, `lodLevels`).
 * - Nível em uso por bloco: estado interno do gerenciador (`GSplatOctreeInstance.nodeInfos`), lido
 *   pelo mesmo caminho que o viewer 1.42 usa (`gsplatDirector.camerasMap`). Interno ao motor: se
 *   uma versão mudar a estrutura, o painel mostra "—" e nada quebra.
 * - Rede: `PerformanceResourceTiming` dos arquivos em `/models/`. `transferSize` é 0 quando veio do
 *   cache do navegador (contado à parte).
 * - Memória: `performance.memory` (só Chromium) é o heap de JavaScript, não a memória de vídeo.
 */
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

type OctreeLike = {
  lodLevels: number;
  files: { url: string; lodLevel: number }[];
  fileResources: Map<number, { numSplats?: number }>;
  nodes: unknown[];
};

type NodeInfoLike = { currentLod: number; optimalLod: number };

export type SplatSnapshot = {
  renderedSplats: number | null;
  streamed: boolean;
  lodLevels: number;
  filesTotal: number;
  filesResident: number;
  residentByLod: number[];
  residentSplats: number | null;
  nodes: number;
  /** Blocos por nível em uso (−1 = nenhum). Null se o estado interno não estiver acessível. */
  nodesByLod: number[] | null;
  nodesBelowOptimal: number | null;
};

function findOctree(viewer: ViewerHandle): OctreeLike | null {
  const entity = viewer.app.root?.findByName("gsplat") as unknown as {
    gsplat?: { resource?: { octree?: OctreeLike | null } | null };
  } | null;
  return entity?.gsplat?.resource?.octree ?? null;
}

function nodeInfos(viewer: ViewerHandle): NodeInfoLike[] | null {
  try {
    const director = (viewer.app.renderer as unknown as {
      gsplatDirector?: { camerasMap: Map<unknown, { layersMap: Map<unknown, { gsplatManager?: unknown }> }> };
    }).gsplatDirector;
    if (!director) return null;
    const out: NodeInfoLike[] = [];
    for (const camera of director.camerasMap.values()) {
      for (const layer of camera.layersMap.values()) {
        const world = (layer.gsplatManager as { world?: { _octreeInstances?: Map<unknown, { nodeInfos: NodeInfoLike[] }> } })
          ?.world;
        for (const instance of world?._octreeInstances?.values() ?? []) out.push(...instance.nodeInfos);
      }
    }
    return out.length ? out : null;
  } catch {
    return null;
  }
}

export function readSplatSnapshot(viewer: ViewerHandle): SplatSnapshot {
  const stats = (viewer.app.stats as unknown as { frame?: { gsplats?: number } }).frame;
  const renderedSplats = typeof stats?.gsplats === "number" ? stats.gsplats : null;
  const octree = findOctree(viewer);
  if (!octree) {
    return {
      renderedSplats,
      streamed: false,
      lodLevels: 1,
      filesTotal: 1,
      filesResident: 1,
      residentByLod: [1],
      residentSplats: null,
      nodes: 0,
      nodesByLod: null,
      nodesBelowOptimal: null,
    };
  }
  const residentByLod = Array.from({ length: octree.lodLevels }, () => 0);
  let residentSplats = 0;
  for (const [index, resource] of octree.fileResources) {
    const lod = octree.files[index]?.lodLevel ?? -1;
    if (lod >= 0) residentByLod[lod]++;
    residentSplats += resource?.numSplats ?? 0;
  }
  const infos = nodeInfos(viewer);
  let nodesByLod: number[] | null = null;
  let nodesBelowOptimal: number | null = null;
  if (infos) {
    nodesByLod = Array.from({ length: octree.lodLevels + 1 }, () => 0);
    nodesBelowOptimal = 0;
    for (const info of infos) {
      nodesByLod[info.currentLod < 0 ? octree.lodLevels : info.currentLod]++;
      if (info.optimalLod >= 0 && info.currentLod > info.optimalLod) nodesBelowOptimal++;
    }
  }
  return {
    renderedSplats,
    streamed: true,
    lodLevels: octree.lodLevels,
    filesTotal: octree.files.length,
    filesResident: octree.fileResources.size,
    residentByLod,
    residentSplats,
    nodes: octree.nodes.length,
    nodesByLod,
    nodesBelowOptimal,
  };
}

export type NetworkSnapshot = { requests: number; transferredBytes: number; cachedRequests: number; failed: number };

/** Requisições a `/models/` desde a abertura da página. */
export function readNetworkSnapshot(prefix = "/models/"): NetworkSnapshot {
  const out: NetworkSnapshot = { requests: 0, transferredBytes: 0, cachedRequests: 0, failed: 0 };
  if (typeof performance === "undefined" || !performance.getEntriesByType) return out;
  for (const entry of performance.getEntriesByType("resource") as PerformanceResourceTiming[]) {
    let path = "";
    try {
      path = new URL(entry.name).pathname;
    } catch {
      continue;
    }
    if (!path.startsWith(prefix)) continue;
    out.requests++;
    out.transferredBytes += entry.transferSize ?? 0;
    if ((entry.transferSize ?? 0) === 0 && (entry.decodedBodySize ?? 0) > 0) out.cachedRequests++;
    const status = (entry as PerformanceResourceTiming & { responseStatus?: number }).responseStatus;
    if (status && status >= 400) out.failed++;
  }
  return out;
}

/** Heap de JavaScript (só Chromium); null onde não existe. */
export function readJsHeapBytes(): number | null {
  const memory = (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory;
  return typeof memory?.usedJSHeapSize === "number" ? memory.usedJSHeapSize : null;
}
