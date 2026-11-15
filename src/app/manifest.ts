import type { MetadataRoute } from "next";

/**
 * Manifesto do app. Além de nome e ícones, permite "Adicionar à Tela de Início": aberto por ali, o
 * site ocupa a tela inteira, sem a barra do navegador. É a alternativa à tela cheia no iPhone, onde
 * a página não pode pedir tela cheia.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Solos na Escola · Exposição Didática de Solos",
    short_name: "Solos na Escola",
    description:
      "Visita tridimensional e interativa à Exposição Didática de Solos da Universidade Federal do Paraná.",
    start_url: "/",
    display: "fullscreen",
    background_color: "#171411",
    theme_color: "#171411",
    lang: "pt-BR",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
