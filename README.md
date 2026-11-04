# Solos na Escola

Experiência digital interativa de uma exposição educativa sobre solos, desenvolvida a partir de
reconstrução tridimensional.

Projeto de Trabalho de Conclusão de Curso (TCC) — Universidade Federal do Paraná (UFPR).

O objetivo é transformar uma exposição museológica, reconstruída por meio de
**3D Gaussian Splatting (3DGS)**, em uma experiência web navegável diretamente no navegador, em
computadores e dispositivos móveis.

> **Estado atual (etapa 1 — fundação):** visualizador funcional com o modelo real da exposição
> (~3 milhões de gaussianas), carregamento com progresso real, tratamento de erros e controles
> de navegação oficiais do SuperSplat Viewer. Hotspots, textos das peças e percursos guiados
> serão desenvolvidos nas próximas etapas.

---

## Tecnologias

| Camada | Tecnologia | Versão |
| --- | --- | --- |
| Framework web | [Next.js](https://nextjs.org/) (App Router, Turbopack) | 16.4.5 |
| UI | [React](https://react.dev/) | 19.3.0 |
| Linguagem | [TypeScript](https://www.typescriptlang.org/) | 5.9 |
| Estilos | [Tailwind CSS](https://tailwindcss.com/) | 4.3 |
| Visualizador 3DGS | [`@playcanvas/supersplat-viewer`](https://github.com/playcanvas/supersplat-viewer) | 1.42.0 |
| Motor gráfico | [PlayCanvas Engine](https://playcanvas.com/) (WebGPU com fallback WebGL 2) | 2.23.3 |
| Gerenciador de pacotes | npm | 10+ |
| Hospedagem prevista | [Vercel](https://vercel.com/) | — |

Não há banco de dados, autenticação, backend próprio nem variáveis de ambiente nesta etapa.

---

## O modelo 3D

| Item | Valor |
| --- | --- |
| Arquivo publicado | `public/models/museu_web.sog` |
| URL pública | `/models/museu_web.sog` |
| Tamanho | 45.722.033 bytes (~45,7 MB) |
| SHA-256 | `4730d055b164988c265b20bebbf3fac84db364a9cbaf582efc0c18fb64a436dd` |
| Gaussianas | 2.994.965 |
| Formato | SOG v2 (*Spatially Ordered Gaussians*): pacote ZIP com atributos quantizados em WebP |

O SOG é a versão comprimida e otimizada exportada pelo SuperSplat. Ele é usado **sem
reconversão, recompressão ou transformações adicionais**. Os arquivos-fonte de alta resolução
(`.ply`, `.ssproj`) e os datasets de captura **não fazem parte do repositório** (ver
`.gitignore`).

**Orientação:** o viewer aplica ao splat a mesma rotação padrão do editor SuperSplat (180° no
eixo Z, convenção de dados 3DGS). Nenhuma rotação compensatória é aplicada pela aplicação; a
cena aparece como no editor.

---

## Estrutura

```
SolosNaEscola/
├── public/
│   ├── models/
│   │   └── museu_web.sog          # modelo 3DGS (servido estaticamente)
│   └── images/                    # imagens futuras (pôster, ícones)
├── src/
│   ├── app/
│   │   ├── layout.tsx             # metadados, viewport, fonte
│   │   ├── page.tsx               # rota "/" → exposição
│   │   └── globals.css
│   ├── components/
│   │   ├── viewer/
│   │   │   ├── GaussianViewer.tsx # integração React do SuperSplat Viewer
│   │   │   └── Exhibition.tsx     # tela principal: viewer + sobreposições
│   │   └── ui/
│   │       ├── LoadingOverlay.tsx # progresso real do download
│   │       ├── ErrorState.tsx     # erro amigável + "Tentar novamente"
│   │       └── ProjectBadge.tsx   # identificação discreta do projeto
│   ├── data/
│   │   └── experience.ts          # modelo, câmera inicial e Experience Settings v2
│   └── lib/
│       └── viewer/
│           ├── capabilities.ts    # detecção de WebGL 2 / WebGPU
│           └── loadStatus.ts      # fases de carregamento
├── next.config.ts                 # cabeçalhos de cache do modelo
└── package.json
```

---

## Como a integração funciona

O componente [`GaussianViewer`](src/components/viewer/GaussianViewer.tsx) usa a API de
integração nativa do pacote oficial
([documentação](https://developer.playcanvas.com/user-manual/supersplat/viewer/embedding/),
[referência da API](https://github.com/playcanvas/supersplat-viewer/blob/main/docs/api.md)):

```ts
import { createViewer } from "@playcanvas/supersplat-viewer/viewer";
import "@playcanvas/supersplat-viewer/viewer.css";

const viewer = await createViewer({ container, settings, contentUrl, contentFilename, contents });
```

Decisões principais:

- **Somente no cliente.** O módulo do viewer é importado dinamicamente dentro de `useEffect`;
  nada do motor executa durante o SSR/prerender, evitando erros de hidratação.
- **Uma instância por vez.** A criação é adiada um *tick* (o React StrictMode monta, desmonta e
  monta novamente em desenvolvimento) e cada nova instância aguarda a destruição da anterior.
- **Limpeza.** Ao desmontar, o download é cancelado (`AbortController`) e `viewer.destroy()`
  libera a aplicação PlayCanvas, o contexto gráfico e os listeners.
- **Download direto da URL estática.** A aplicação faz o `fetch` de `/models/museu_web.sog` e
  entrega o `Response` ao viewer (`contents`). O motor lê o corpo em *streaming*. Não há Base64
  nem função serverless intermediária.
- **Progresso real.** O percentual vem do evento `progress:changed` do viewer (bytes recebidos /
  `Content-Length`). A interface distingue:
  1. *Preparando o visualizador* (módulo e dispositivo gráfico);
  2. *Baixando a exposição* (0–99%);
  3. *Download concluído · preparando a cena* (decodificação e envio à GPU);
  4. *Pronto* — `loaded:changed`, primeiro quadro completo renderizado.
- **Erros.** Falhas de rede, respostas HTTP de erro e falhas do motor (eventos `error` do
  registro de assets) levam a uma tela amigável com **Tentar novamente**, que recria o viewer do
  zero. Navegadores sem WebGL 2/WebGPU recebem uma mensagem de dispositivo incompatível.
- **Redimensionamento e orientação.** O contêiner ocupa `100dvh × 100%`; o viewer acompanha o
  tamanho com um `ResizeObserver` interno.

### Configuração da experiência

[`src/data/experience.ts`](src/data/experience.ts) concentra os parâmetros editáveis, separados
do componente de renderização:

- `MODEL` — URL, nome, tamanho e número de gaussianas do SOG;
- `INITIAL_CAMERA_SOURCE` — câmera inicial derivada da última vista salva no projeto SuperSplat
  (`focalPoint`, azimute 172,5°, elevação −10,3°, FOV 85°), recuada `distance = 1,6` unidades ao
  longo da mesma direção de visada;
- `EXPERIENCE_SETTINGS` — *Experience Settings* v2 (tonemapping, fundo, pós-processamento,
  câmeras, anotações).

---

## Navegação

Os controles são os do SuperSplat Viewer (barra inferior direita; ajuda pelo ícone de teclado).

| Recurso | Disponível | Observação |
| --- | --- | --- |
| Orbit | Sim | arrastar com o mouse / um dedo |
| Pan | Sim | gesto indicado no painel de ajuda / dois dedos |
| Zoom | Sim | roda do mouse / pinça |
| Fly | Sim | WASD + mouse; Shift/Ctrl para correr/andar devagar; joystick do viewer em telas de toque |
| Definir foco / voar até ponto | Sim | gestos de clique indicados no painel de ajuda |
| Enquadrar cena | Sim | tecla **F** |
| Reset (câmera inicial) | Sim | tecla **R** |
| Animação de câmera | Sim | ao abrir, o viewer reproduz um movimento suave automático (comportamento padrão quando não há trilha de animação); qualquer interação ou o botão de pausa o interrompe |
| Tela cheia | Sim | botão na barra inferior |
| **Walk** | **Não** | depende de dados de colisão (malha `.glb` ou voxels) ainda inexistentes; o viewer oculta o modo automaticamente (`walkAllowed = false`). Quando houver colisão, basta informar `collisionUrl` ao `createViewer` |

O desempenho varia conforme o dispositivo. Em celulares e tablets o viewer inicia no nível de
qualidade *performance* (orçamento de splats menor e meia resolução); o usuário pode ajustar em
⚙️ → Quality.

---

## Execução local

Requisitos: **Node.js ≥ 20.9** e npm.

```bash
npm install
npm run dev          # http://localhost:3000
```

Outros scripts:

```bash
npm run typecheck    # gera os tipos de rotas e roda o TypeScript
npm run lint         # ESLint
npm run build        # build de produção
npm run start        # serve o build de produção
```

> WebGPU só está disponível em contexto seguro (HTTPS ou `localhost`). Acessando o servidor de
> desenvolvimento pelo IP da rede local (ex.: `http://192.168.x.x:3000`), o viewer usa WebGL 2
> automaticamente.

---

## Deploy na Vercel

O projeto usa a configuração padrão de Next.js e não exige variáveis de ambiente.

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório
   `BernardoHille/SolosNaEscola` (GitHub).
2. *Framework Preset*: **Next.js** (detectado automaticamente). Mantenha os comandos padrão
   (`npm install`, `next build`) e o diretório raiz do repositório.
3. Clique em **Deploy**. Cada *push* na `main` gera um novo deploy de produção.

Observações:

- O SOG é servido como arquivo estático da CDN da Vercel a partir de `public/models/`, com
  `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` (ver `next.config.ts`).
  Ao substituir o modelo, prefira um novo nome de arquivo para evitar versões antigas em cache.
- O arquivo tem ~45,7 MB, abaixo do limite de 100 MB por arquivo do GitHub (por isso não foi
  usado Git LFS). Verifique, após o primeiro deploy, se o arquivo é entregue com status 200 e o
  cabeçalho `Content-Length`, necessário para o percentual de progresso.
- A transferência do modelo conta para a cota de banda do plano da Vercel (~45,7 MB por visitante
  sem cache).

---

## Próximas etapas (fora do escopo desta versão)

- Hotspots/anotações das peças (o Experience Settings já suporta `annotations`).
- Textos educativos e percursos guiados.
- Geometria de colisão para o modo Walk.
- Imagem de pôster durante o carregamento (`posterUrl`).
- Medição de desempenho de referência em diferentes dispositivos antes de avaliar LOD ou nova
  compressão.

---

## Créditos

Visualização baseada no [SuperSplat Viewer](https://github.com/playcanvas/supersplat-viewer) e no
[PlayCanvas Engine](https://github.com/playcanvas/engine), ambos sob licença MIT.
