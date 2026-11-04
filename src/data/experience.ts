/**
 * Configuração da exposição "Solos na Escola".
 *
 * Este arquivo concentra os parâmetros editáveis da experiência (modelo, câmera e
 * aparência), separados do componente de renderização. O formato segue o
 * "Experience Settings" v2 do SuperSplat Viewer:
 * https://github.com/playcanvas/supersplat-viewer/blob/main/docs/api.md#settings-schema
 */
import type { CameraPose, ExperienceSettings } from "@playcanvas/supersplat-viewer/settings";

/** Modelo 3D Gaussian Splatting publicado em `public/models/`. */
export const MODEL = {
  /** URL pública (relativa à origem do site) do arquivo SOG. */
  url: "/models/museu_web.sog",
  /** Nome do arquivo; o viewer escolhe o parser pela extensão. */
  filename: "museu_web.sog",
  /** Tamanho em bytes, usado apenas como referência na interface. */
  sizeBytes: 45_722_033,
  /** Quantidade de gaussianas, conforme `meta.json` do SOG. */
  splatCount: 2_994_965,
} as const;

/**
 * Câmera inicial, em coordenadas de mundo do viewer.
 *
 * Origem dos valores: a última vista salva no projeto SuperSplat
 * (`museu_final.ssproj` → `document.json` → `camera`), com
 * focalPoint [0.0983, 0.1247, 1.4729], azim 172.5°, elev −10.3° e fov 85°.
 * A posição foi obtida recuando a câmera ao longo dessa mesma direção de visada
 * (`distance`), para enquadrar a exposição a partir do interior da sala.
 *
 * O modelo NÃO recebe nenhuma transformação adicional: o viewer aplica a mesma
 * rotação padrão do editor SuperSplat (180° em Z), portanto a cena aparece com a
 * orientação definida pelo autor.
 */
export const INITIAL_CAMERA_SOURCE = {
  focalPoint: [0.09831475982549864, 0.12474596255048798, 1.4729403411399717] as [number, number, number],
  azimuthDeg: 172.5,
  elevationDeg: -10.3,
  /** Distância (em unidades da cena) entre a câmera e o ponto focal. */
  distance: 1.6,
  fov: 85,
};

/**
 * Converte azimute/elevação (convenção do SuperSplat) em posição e alvo.
 * O vetor calculado aponta do ponto focal para a câmera.
 */
function poseFromOrbit({
  focalPoint,
  azimuthDeg,
  elevationDeg,
  distance,
  fov,
}: typeof INITIAL_CAMERA_SOURCE): CameraPose {
  const ex = (-elevationDeg * Math.PI) / 180;
  const ey = (-azimuthDeg * Math.PI) / 180;
  const back = [-Math.cos(ex) * Math.sin(ey), Math.sin(ex), Math.cos(ex) * Math.cos(ey)];
  const round = (n: number) => Math.round(n * 1e4) / 1e4;
  return {
    position: [
      round(focalPoint[0] + back[0] * distance),
      round(focalPoint[1] + back[1] * distance),
      round(focalPoint[2] + back[2] * distance),
    ],
    target: [round(focalPoint[0]), round(focalPoint[1]), round(focalPoint[2])],
    fov,
  };
}

export const INITIAL_CAMERA: CameraPose = poseFromOrbit(INITIAL_CAMERA_SOURCE);

/** Experience Settings v2 entregue ao viewer. */
export const EXPERIENCE_SETTINGS: ExperienceSettings = {
  version: 2,
  // "linear" é o tonemapping salvo no projeto SuperSplat.
  tonemapping: "linear",
  highPrecisionRendering: false,
  background: {
    color: [0, 0, 0],
  },
  postEffectSettings: {
    sharpness: { enabled: false, amount: 0 },
    bloom: { enabled: false, intensity: 0.1, blurLevel: 2 },
    grading: { enabled: false, brightness: 1, contrast: 1, saturation: 1, tint: [1, 1, 1] },
    vignette: { enabled: false, intensity: 0.5, inner: 0.3, outer: 0.75, curvature: 1 },
    fringing: { enabled: false, intensity: 0.5 },
  },
  animTracks: [],
  cameras: [{ initial: INITIAL_CAMERA }],
  // Hotspots/anotações serão adicionados em etapas futuras.
  annotations: [],
  startMode: "default",
};
