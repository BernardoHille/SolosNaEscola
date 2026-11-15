"use client";

/**
 * Painel técnico de desempenho do Gaussian (comparação A/B e benchmark). Não faz parte da interface
 * pública: só aparece com `?diag=1` fora da produção (desenvolvimento e previews), e a tecla P o
 * mostra e esconde. Os números e suas origens estão em `src/lib/viewer/splatStats.ts`; o roteiro
 * de medição está em `docs/lod-streaming.md`.
 */
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

import type { SplatSource } from "@/data/splatSources";
import { type AdaptiveSnapshot, frameStats, type WindowStats } from "@/lib/viewer/adaptiveQuality";
import { monitorFrames } from "@/lib/viewer/frameMonitor";
import {
  readJsHeapBytes,
  readNetworkSnapshot,
  readSplatSnapshot,
  type NetworkSnapshot,
  type SplatSnapshot,
} from "@/lib/viewer/splatStats";

const WINDOW_MS = 5000;
const GAP_MS = 250;

export type LoadTimings = { readyMs: number | null; navigableMs: number | null };

type Props = {
  viewer: ViewerHandle;
  source: SplatSource;
  qualityLevel: string;
  applied: { budget: number; scale: number };
  auto: AdaptiveSnapshot | null;
  timings: RefObject<LoadTimings>;
  chunkFailures: number;
};

type Sample = { t: number; dt: number; cpu: number };

const fmtM = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n >= 1e6 ? `${(n / 1e6).toFixed(2)} M` : `${(n / 1e3).toFixed(0)} K`;
const fmtMB = (n: number | null) => (n === null ? "—" : `${(n / 1e6).toFixed(1)} MB`);
const fmtS = (ms: number | null) => (ms === null ? "—" : `${(ms / 1000).toFixed(1)} s`);

export default function SplatDiagnostics({ viewer, source, qualityLevel, applied, auto, timings, chunkFailures }: Props) {
  const samples = useRef<Sample[]>([]);
  const [stats, setStats] = useState<WindowStats | null>(null);
  const [instant, setInstant] = useState<number | null>(null);
  const [splats, setSplats] = useState<SplatSnapshot | null>(null);
  const [net, setNet] = useState<NetworkSnapshot | null>(null);
  const [heap, setHeap] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(0);
  const [loadTimes, setLoadTimes] = useState<LoadTimings>({ readyMs: null, navigableMs: null });
  const renderer = (viewer.app.graphicsDevice as unknown as { isWebGPU?: boolean }).isWebGPU ? "WebGPU" : "WebGL 2";

  useEffect(() => {
    let last: number | null = null;
    const stop = monitorFrames(viewer, (frame) => {
      if (!frame.rendered) return;
      const prev = last;
      last = frame.t;
      if (prev === null) return;
      const dt = frame.t - prev;
      if (dt > GAP_MS) return;
      samples.current.push({ t: frame.t, dt, cpu: frame.cpuMs });
    });
    const id = window.setInterval(() => {
      const now = performance.now();
      const list = samples.current;
      while (list.length && list[0].t < now - WINDOW_MS) list.shift();
      const recent = list.filter((s) => s.t >= now - 1000);
      setInstant(recent.length > 1 ? (recent.length * 1000) / recent.reduce((a, s) => a + s.dt, 0) : null);
      setStats(list.length > 1 ? frameStats(list.map((s) => s.dt), list.map((s) => s.cpu)) : null);
      setSplats(readSplatSnapshot(viewer));
      setNet(readNetworkSnapshot());
      setHeap(readJsHeapBytes());
      setNow(now);
      setLoadTimes({ ...timings.current });
    }, 500);
    return () => {
      window.clearInterval(id);
      stop();
    };
  }, [viewer, timings]);

  const record = useCallback(
    () => ({
      at: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}@${window.devicePixelRatio}`,
      renderer,
      source: source.id,
      quality: qualityLevel,
      applied,
      window: stats,
      splats,
      network: net,
      jsHeapBytes: heap,
      timings: loadTimes,
      chunkFailures,
      auto: auto && {
        state: auto.state,
        targetFps: auto.targetFps,
        refreshHz: auto.refreshHz,
        bottleneck: auto.bottleneck,
        lastReason: auto.lastReason,
        changes: auto.changes,
        level: auto.level,
      },
    }),
    [renderer, source.id, qualityLevel, applied, stats, splats, net, heap, loadTimes, chunkFailures, auto],
  );

  const copy = useCallback(async () => {
    const text = JSON.stringify(record(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      console.info("[diagnóstico]", text);
    }
  }, [record]);

  const since = auto?.lastChangeAt != null && now ? Math.max(0, now - auto.lastChangeAt) : null;

  return (
    <div className="pointer-events-auto absolute left-3 top-16 z-30 w-[min(20rem,calc(100vw-1.5rem))] select-text rounded-lg bg-earth/80 p-2.5 font-mono text-[10px] leading-snug text-stone-200 shadow-lg">
      <p className="mb-1 font-semibold text-highlight">
        Diagnóstico · {source.id} · {renderer}
      </p>
      <Row k="FPS agora / janela 5 s" v={`${instant?.toFixed(0) ?? "—"} / ${stats ? stats.fps.toFixed(1) : "—"}`} />
      <Row
        k="quadro média · p50/p95/p99"
        v={stats ? `${stats.meanMs.toFixed(1)} · ${stats.p50Ms.toFixed(1)}/${stats.p95Ms.toFixed(1)}/${stats.p99Ms.toFixed(1)} ms` : "—"}
      />
      <Row k="CPU do tick (média)" v={stats?.cpuMeanMs != null ? `${stats.cpuMeanMs.toFixed(1)} ms` : "—"} />
      <Row k="gaussianas desenhadas (motor)" v={fmtM(splats?.renderedSplats)} />
      <hr className="my-1 border-white/10" />
      <Row k="qualidade" v={qualityLevel} />
      <Row k="orçamento · resolução" v={`${source.streamed ? fmtM(applied.budget) : "sem efeito"} · ${Math.round(applied.scale * 100)}%`} />
      {auto && (
        <>
          <Row k="automático" v={`${auto.state} · meta ${auto.targetFps.toFixed(0)} FPS`} />
          <Row k="tela · gargalo" v={`${auto.refreshHz ?? "—"} Hz · ${auto.bottleneck}`} />
          <Row k="última mudança" v={auto.lastReason ? `${fmtS(since)} atrás` : "nenhuma"} />
          {auto.lastReason && <p className="text-stone-400">{auto.lastReason}</p>}
        </>
      )}
      {splats?.streamed && (
        <>
          <hr className="my-1 border-white/10" />
          <Row k="arquivos residentes" v={`${splats.filesResident}/${splats.filesTotal} · por LOD ${splats.residentByLod.join("/")}`} />
          <Row k="gaussianas residentes" v={fmtM(splats.residentSplats)} />
          <Row
            k={`blocos por LOD (0..${splats.lodLevels - 1}, nenhum)`}
            v={splats.nodesByLod ? splats.nodesByLod.join("/") : "—"}
          />
          <Row k="blocos abaixo do ideal" v={splats.nodesBelowOptimal ?? "—"} />
          <Row k="blocos perdidos" v={chunkFailures} />
        </>
      )}
      <hr className="my-1 border-white/10" />
      <Row
        k="rede /models (req · bytes)"
        v={net ? `${net.requests} · ${fmtMB(net.transferredBytes)}${net.cachedRequests ? ` · ${net.cachedRequests} do cache` : ""}` : "—"}
      />
      <Row k="heap JS (não é GPU)" v={fmtMB(heap)} />
      <Row k="cena pronta · navegável" v={`${fmtS(loadTimes.readyMs)} · ${fmtS(loadTimes.navigableMs)}`} />
      <div className="mt-1.5 flex gap-1.5">
        <button type="button" onClick={copy} className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20">
          {copied ? "Copiado" : "Copiar medição"}
        </button>
        <button
          type="button"
          onClick={() => {
            samples.current = [];
          }}
          className="rounded bg-white/10 px-2 py-0.5 hover:bg-white/20"
        >
          Zerar janela
        </button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <p className="flex justify-between gap-2">
      <span className="text-stone-400">{k}</span>
      <span className="text-right tabular-nums">{v}</span>
    </p>
  );
}
