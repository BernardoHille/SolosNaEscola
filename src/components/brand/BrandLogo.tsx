import Image from "next/image";

/** Proporção do arquivo original (950 × 504 px). */
const WIDTH = 950;
const HEIGHT = 504;

type BrandLogoProps = {
  className?: string;
  /** Carregar logo de saída (tela inicial). */
  preload?: boolean;
};

/**
 * Logo oficial do Programa Solo na Escola/UFPR, como no arquivo original: sem recriar a tipografia,
 * sem filtros nem distorção (a largura vem da classe e a altura acompanha a proporção). As letras
 * são grafite: usar sempre sobre fundo claro (`bg-paper`).
 *
 * Servida como WebP sem perda (`public/brand/`), sem passar pelo otimizador de imagens.
 */
export default function BrandLogo({ className = "", preload = false }: BrandLogoProps) {
  return (
    <Image
      src="/brand/logo-solo-na-escola.webp"
      alt="Programa Solo na Escola · UFPR"
      width={WIDTH}
      height={HEIGHT}
      unoptimized
      preload={preload}
      draggable={false}
      className={`h-auto select-none ${className}`}
    />
  );
}
