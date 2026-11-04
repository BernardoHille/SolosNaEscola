import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CameraCalibration from "@/components/dev/CameraCalibration";

export const metadata: Metadata = {
  title: "Calibração da entrada (dev)",
  robots: { index: false, follow: false },
};

/**
 * Ferramenta interna de calibração da câmera inicial.
 *
 * Disponível apenas em `npm run dev`: a extensão `.dev.tsx` só é registrada como
 * página pelo servidor de desenvolvimento (ver `next.config.ts`), então o build de
 * produção não contém esta rota. A verificação abaixo é uma segunda barreira.
 */
export default function CameraCalibrationPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <CameraCalibration />;
}
