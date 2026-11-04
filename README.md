# Solos na Escola

Experiência digital interativa de uma exposição educativa sobre solos, desenvolvida a partir de
reconstrução tridimensional.

Projeto de Trabalho de Conclusão de Curso (TCC) — Universidade Federal do Paraná (UFPR).

O objetivo é transformar uma exposição museológica, reconstruída por meio de
**3D Gaussian Splatting (3DGS)**, em uma experiência web navegável diretamente no navegador, em
computadores e dispositivos móveis.

> **Estado atual (etapa 2 — visita em primeira pessoa):** o visitante começa na entrada da
> exposição e caminha pelo espaço em primeira pessoa (Walk Mode oficial do SuperSplat Viewer),
> com colisão, altura humana fixa e controles para teclado/mouse e telas de toque. Hotspots,
> textos das peças e percursos guiados serão desenvolvidos nas próximas etapas.

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
| Geração da colisão | [`@playcanvas/splat-transform`](https://github.com/playcanvas/splat-transform) (via `npx`, versão fixada) | 3.10.3 |
| Gerenciador de pacotes | npm | 10+ |
| Hospedagem prevista | [Vercel](https://vercel.com/) | — |

Não há banco de dados, autenticação, backend próprio nem variáveis de ambiente.

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
reconversão, recompressão ou transformações adicionais** — inclusive nesta etapa: a escala e a
colisão são aplicadas fora do arquivo (ver abaixo). Os arquivos-fonte de alta resolução (`.ply`,
`.ssproj`) e os datasets de captura **não fazem parte do repositório** (ver `.gitignore`).

**Orientação:** o viewer aplica ao splat a mesma rotação padrão do editor SuperSplat (180° no
eixo Z, convenção de dados 3DGS). Nenhuma rotação compensatória é aplicada pela aplicação.

---

## Visita em primeira pessoa (etapa 2)

### Por que o Walk Mode oficial

O SuperSplat Viewer 1.42 já possui um modo de caminhada (*Walk Mode*) com gravidade, cápsula de
colisão, subida de pequenos degraus e altura dos olhos constante em relação ao piso. A aplicação
usa esse modo diretamente — não há controlador de câmera próprio nem um modo *Fly* apresentado
como caminhada. A aplicação apenas:

1. fornece a geometria de colisão (`collisionUrl`);
2. coloca a câmera inicial na entrada da exposição;
3. trava o viewer no Walk Mode e remove os outros modos e atalhos;
4. oferece seus próprios controles de movimento (teclado e joystick) através da API pública
   `setMoveInput(x, z)`.

### Convenções de coordenadas e unidades

Espaço de mundo do viewer, já com a escala da cena aplicada:

| Item | Convenção |
| --- | --- |
| Unidade | metro (após `sceneScale`, ver abaixo) |
| Eixo vertical | +Y para cima; piso da sala em y ≈ 0 a 0,1 |
| Entrada | lado −Z; o interior da exposição se estende para +Z |
| Yaw | graus em torno de Y: 0° olha para −Z, 90° para −X, 180° para +Z |
| Pitch | graus; positivo olha para cima |

O espaço do viewer corresponde ao espaço de dados do SOG rotacionado 180° em Z, isto é,
`(x, y, z)_viewer = (−x, −y, z)_SOG`. As renderizações do SplatTransform usadas na calibração
já são feitas nesse espaço.

### Escala da cena (`sceneScale = 5,4`)

O SOG exportado **não está em metros**: a distância piso→teto é ≈ 0,68 unidade. Como o Walk
Mode usa medidas fixas em metros (olhos a 1,5 m do piso, cápsula de 0,2 m de raio), a cena
precisa estar em escala métrica para que o visitante tenha proporções humanas.

- **Estimativa:** o vão da porta de entrada mede ≈ 0,388 unidade de altura no próprio SOG
  (medido em renderizações frontais da porta). Assumindo a altura padrão de porta de **2,10 m**,
  o fator é 2,10 / 0,388 ≈ **5,4**.
- **Aplicação:** a escala é uniforme e aplicada **em tempo de execução** na entidade do splat
  ([`sceneScale.ts`](src/lib/viewer/sceneScale.ts)), de forma síncrona quando a entidade é
  inserida na cena — antes de o viewer calcular limites e câmeras. O arquivo SOG não é alterado.
- **A mesma escala** é usada na geração da colisão (`-s 5.4`), de modo que o modelo visual e a
  colisão coincidem sem nenhuma transformação adicional em nenhum dos dois.
- **Limitação:** é uma estimativa a partir de uma medida padrão, não uma medição em campo. Se a
  altura real da porta for conhecida, basta atualizar `sceneScale` em
  [`src/data/collision.json`](src/data/collision.json) e regenerar a colisão.

### Colisão

A colisão é um conjunto de **voxels** gerado a partir do próprio SOG com o SplatTransform:

| Arquivo | Tamanho | Conteúdo |
| --- | --- | --- |
| `public/models/museu_web.voxel.json` | 666 B | metadados (formato 1.1, limites, resolução) |
| `public/models/museu_web.voxel.bin` | 133.844 B | octree esparsa de voxels sólidos |

Parâmetros (em [`src/data/collision.json`](src/data/collision.json), compartilhado pelo script e
pela aplicação):

| Parâmetro | Valor | Função |
| --- | --- | --- |
| `sceneScale` | 5,4 | mesma escala do modelo visual |
| `voxelSize` | 0,05 m | resolução da grade |
| `voxelOpacity` | 0,1 | opacidade mínima para um voxel ser considerado sólido |
| `seedPosition` | (−0,27; 0,9; −4,1) | ponto no interior da sala usado para filtrar fragmentos soltos e para o preenchimento externo |
| `externalFill` | 1,6 m | fecha o espaço exterior alcançável a partir da semente (impede sair pela porta) |
| `carveCapsule` | 1,6 m × 0,2 m | escava o espaço livre por onde uma cápsula humana pode passar |

Para regenerar (requer Node.js e acesso à internet para o `npx` baixar o SplatTransform):

```bash
npm run collision
```

O script [`scripts/generate-collision.mjs`](scripts/generate-collision.mjs) executa:

```bash
npx @playcanvas/splat-transform@3.10.3 -w public/models/museu_web.sog -s 5.4 \
  --seed-pos -0.27,0.9,-4.1 --filter-cluster \
  public/models/museu_web.voxel.json \
  --voxel-size 0.05 --voxel-opacity 0.1 \
  --voxel-external-fill 1.6 --voxel-carve 1.6,0.2
```

Arquivos necessários para reproduzir: `public/models/museu_web.sog`,
`src/data/collision.json` e `scripts/generate-collision.mjs`. O SOG apenas é lido; seu SHA-256
permanece o mesmo.

**Verificação da área caminhável:** decodificando a octree e simulando a cápsula a partir da
entrada, a área alcançável é de ≈ 52 m², contorna as duas ilhas de mesas expositivas e não
escapa pela porta. A sobreposição de voxels pode ser inspecionada na rota de calibração
(“Mostrar colisão”, requer WebGPU).

### Ponto de partida

Definido em [`src/data/visit.ts`](src/data/visit.ts):

```ts
export const ENTRANCE_SPAWN: SpawnPose = {
  position: [-0.27, 1.5, -4.1],
  yawDeg: 180,   // olhando para o interior (+Z)
  pitchDeg: -5,
  fov: 90,
};
```

O ponto fica sobre o tapete cinza, no lado interno da porta, entre os armários brancos (objetos
à esquerda, amostras de rochas à direita). Os valores foram **medidos em renderizações do próprio
SOG** (vista superior e vista frontal da porta), não estimados à mão; o ajuste fino deve ser
feito com a ferramenta de calibração.

O botão **Voltar à entrada** chama `viewer.resetCamera()`: no Walk Mode, isso restaura a pose
registrada ao entrar no modo — que é sempre a entrada, pois o visitante nunca sai do Walk Mode.
Não recarrega o SOG nem a colisão.

### Parâmetros físicos

| Item | Valor | Origem |
| --- | --- | --- |
| Altura dos olhos | ≈ 1,5 m acima do piso (acompanha o piso) | fixo no WalkController 1.42 (`eyeHeight` 1,3 m + flutuação 0,2 m); não configurável pela API pública |
| Cápsula | 1,5 m de altura × 0,2 m de raio | WalkController |
| Campo de visão | 90° | fixo no WalkController durante a caminhada |
| Inclinação vertical | ±90° | fixa no viewer; não pode ser limitada pela API pública |
| Velocidade de caminhada | ≈ 1,15 m/s (`MOVEMENT.walk = 0,45`) | medida no navegador |
| Velocidade com Shift | ≈ 1,9 m/s (`MOVEMENT.run = 0,75`) | medida no navegador |

A especificação previa olhos a ~1,6–1,8 m; o valor real é o do viewer (1,5 m), mantido para não
modificar código de terceiros.

### O que foi bloqueado

O visitante não pode sair do Walk Mode nem usar recursos que quebrem a sensação de visita:

| Recurso | Como é bloqueado |
| --- | --- |
| Orbit, Fly, Frame, animação, troca de modo | `ui: false` (sem barra do viewer) e `noanim: true`; o viewer é colocado em `walk` e qualquer mudança de `cameraMode` é revertida |
| Atalhos 1/2/3, F, R, G, V, H, Espaço (pulo), Esc | `state.inputEnabled = false` desativa os atalhos e a entrada de teclado do próprio viewer; o movimento por teclado é da aplicação |
| Controles de jogo (pulo por toque) | `state.gamingControls = false`, reimposto se alterado |
| Roda do mouse (zoom/deslocamento), botão direito/meio | bloqueados na fase de captura sobre o contêiner |

Continua disponível: arrastar para olhar ao redor (mouse ou um dedo) e clicar/tocar no piso para
caminhar até o ponto — comportamentos do próprio Walk Mode, que permanecem no modo de caminhada.

### Controles

| Ação | Computador | Tela de toque |
| --- | --- | --- |
| Andar | **W A S D** ou setas | joystick no canto inferior esquerdo |
| Andar mais rápido | segurar **Shift** | inclinar o joystick até a borda |
| Olhar ao redor | clicar e arrastar | arrastar um dedo na tela |
| Ir até um ponto | clicar no piso | tocar no piso |
| Voltar ao início | botão **Voltar à entrada** | idem |

Teclado e joystick são combinados em [`moveInput.ts`](src/lib/viewer/moveInput.ts) e enviados
por `setMoveInput`. O movimento é liberado ao soltar a tecla/dedo, ao perder o foco da janela e
ao ocultar a aba — nunca fica “preso”. A interface mínima tem identificação do projeto, ajuda
(aberta automaticamente na primeira visita), tela cheia e o botão de retorno.

---

## Calibração da entrada (somente desenvolvimento)

Rota: **`/dev/camera`** (apenas com `npm run dev`).

O painel mostra, em tempo real: modo da câmera, `walkAllowed`, posição X/Y/Z, yaw/pitch, FOV e
altura sobre o piso de referência. Ações:

- **Copiar configuração** — copia o trecho `ENTRANCE_SPAWN` pronto para colar em
  `src/data/visit.ts`;
- **Aplicar como entrada** — salva a pose atual como entrada de teste (apenas neste navegador,
  `localStorage`) e reinicia o viewer já no Walk Mode a partir dela; a página inicial em
  desenvolvimento também passa a usá-la;
- **Testar Walk aqui / Sair do Walk** — alterna entre caminhada e Fly para posicionar a câmera;
- **Restaurar padrão** — descarta a entrada de teste;
- **Mostrar colisão** — sobrepõe os voxels de colisão (WebGPU).

Procedimento: use Fly (tecla 2) para ir ao tapete da entrada, aponte para o interior, clique em
**Aplicar como entrada**, confira caminhando e, se estiver bom, **Copiar configuração** e cole em
`src/data/visit.ts`. A pose de teste nunca é usada em produção.

**Indisponível em produção:** o arquivo da rota é `src/app/dev/camera/page.dev.tsx`, e a extensão
`.dev.tsx` só é registrada como página pelo servidor de desenvolvimento
([`next.config.ts`](next.config.ts)). No build de produção a rota não existe (HTTP 404) e o código
da ferramenta não é incluído em nenhum pacote enviado ao navegador. A página ainda chama
`notFound()` em produção como segunda barreira.

---

## Estrutura

```
SolosNaEscola/
├── public/models/
│   ├── museu_web.sog              # modelo 3DGS (servido estaticamente, não modificado)
│   ├── museu_web.voxel.json       # colisão: metadados
│   └── museu_web.voxel.bin        # colisão: octree de voxels
├── scripts/
│   └── generate-collision.mjs     # npm run collision
├── src/
│   ├── app/
│   │   ├── page.tsx               # rota "/" → exposição
│   │   └── dev/camera/page.dev.tsx  # calibração (somente dev)
│   ├── components/
│   │   ├── viewer/
│   │   │   ├── GaussianViewer.tsx # integração React do SuperSplat Viewer (+ escala e colisão)
│   │   │   ├── Exhibition.tsx     # tela principal da visita
│   │   │   └── useWalkVisit.ts    # trava no Walk, teclado, joystick, retorno à entrada
│   │   ├── dev/CameraCalibration.tsx
│   │   └── ui/                    # carregamento, erro, ajuda, joystick, controles
│   ├── data/
│   │   ├── collision.json         # escala e parâmetros de colisão (script + app)
│   │   ├── visit.ts               # entrada, velocidades, convenções
│   │   └── experience.ts          # modelo e Experience Settings v2
│   └── lib/viewer/
│       ├── sceneScale.ts          # escala uniforme em runtime
│       ├── walkLock.ts            # bloqueio de modos, atalhos e gestos
│       ├── moveInput.ts           # combinação teclado + joystick → setMoveInput
│       ├── keyboardMovement.ts    # WASD/setas/Shift
│       ├── cameraPose.ts          # leitura da pose da câmera (calibração)
│       └── spawnOverride.ts       # entrada de teste (somente dev)
├── next.config.ts                 # cache dos modelos; rotas .dev.tsx só em dev
└── package.json
```

---

## Como a integração funciona

O componente [`GaussianViewer`](src/components/viewer/GaussianViewer.tsx) usa a API de
integração nativa do pacote oficial
([documentação](https://developer.playcanvas.com/user-manual/supersplat/viewer/embedding/),
[referência da API](https://github.com/playcanvas/supersplat-viewer/blob/main/docs/api.md)):

```ts
const viewer = await createViewer({
  container, settings, contentUrl, contentFilename, contents,
  collisionUrl, ui: false, noanim: true,
});
```

- **Somente no cliente.** O módulo do viewer é importado dinamicamente dentro de `useEffect`.
- **Uma instância por vez.** A criação é adiada um *tick* (StrictMode) e cada nova instância
  aguarda a destruição da anterior; ao desmontar, o download é cancelado e `viewer.destroy()`
  libera recursos.
- **Download direto da URL estática** com progresso real (`progress:changed`).
- **Erros.** Falhas de rede, HTTP, motor ou **colisão** (arquivo ausente ou Walk Mode não liberado
  em 45 s) levam a uma tela amigável com **Tentar novamente**. Sem colisão não há visita, então a
  falha não é silenciosa.
- **Ordem de inicialização.** Carregamento do SOG → cena pronta (`loaded`) → colisão anexada
  (`walkAllowed`) → entrada no Walk Mode. A interface da visita só aparece depois disso
  (“Preparando a área de visita…”).

---

## Testes realizados

Executados localmente (Chrome/WebGPU, servidor de desenvolvimento e build de produção), em
3/11/2026:

| # | Teste | Resultado |
| --- | --- | --- |
| A | Início na entrada, olhando para o interior, já em Walk | ✔ posição (−0,27; 1,6; −4,1), direção (0; −0,09; 1,0), `cameraMode = walk` |
| B | Caminhada, altura e colisão | ✔ W/A/S/D corretos; olhos entre 1,59 e 1,74 m durante o percurso; para ao encontrar as mesas (z ≈ −1,15); para atrás antes da porta (z ≈ −4,45) — não sai da sala |
| C | Bloqueios | ✔ teclas 1, 2, 3, F, R, G, V, Espaço, E, Q, Esc, roda do mouse e botão direito não mudam o modo nem movem a câmera; arrastar só gira |
| D | Voltar à entrada | ✔ retorna exatamente à pose inicial, continua em Walk, nenhuma nova requisição do SOG ou da colisão |
| E | Móvel (emulação 375×812 retrato; 812×375 paisagem) | ✔ joystick aparece em modo toque, anda para frente e para ao soltar; sem rolagem/overflow; ajuda adaptada ao toque |
| F | Produção | ✔ `typecheck`, `lint` e `build` sem erros; `/` 200; `/dev/camera` 404; voxels 200; sem erros no console |

Não verificado: aparelho físico com toque real (apenas emulação), Safari/iOS, desempenho em
celulares de entrada e o deploy na Vercel.

## Limitações conhecidas

- A escala (5,4) é estimada a partir da altura padrão de porta (2,10 m).
- A pose de entrada foi medida em renderizações do SOG; recomenda-se confirmar com a rota
  `/dev/camera`.
- Altura dos olhos (1,5 m), FOV (90°) e limite de inclinação são fixos no viewer 1.42.
- A colisão por voxels tem resolução de 5 cm; superfícies muito finas ou com baixa opacidade no
  splat podem não bloquear (ou bloquear um pouco antes) o visitante.
- Clicar/tocar no piso leva o visitante até o ponto (recurso do Walk Mode), inclusive até áreas
  livres distantes.

---

## Execução local

Requisitos: **Node.js ≥ 20.9** e npm.

```bash
npm install
npm run dev          # http://localhost:3000  (calibração: /dev/camera)
```

Outros scripts:

```bash
npm run typecheck    # gera os tipos de rotas e roda o TypeScript
npm run lint         # ESLint
npm run build        # build de produção
npm run start        # serve o build de produção
npm run collision    # regenera os voxels de colisão a partir do SOG
```

> WebGPU só está disponível em contexto seguro (HTTPS ou `localhost`). Acessando o servidor de
> desenvolvimento pelo IP da rede local, o viewer usa WebGL 2 automaticamente.

---

## Deploy na Vercel

O projeto usa a configuração padrão de Next.js e não exige variáveis de ambiente.

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório
   `BernardoHille/SolosNaEscola` (GitHub).
2. *Framework Preset*: **Next.js** (detectado automaticamente). Mantenha os comandos padrão.
3. Clique em **Deploy**. Cada *push* na `main` gera um novo deploy de produção.

Observações:

- SOG e voxels são servidos como arquivos estáticos de `public/models/`, com
  `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` (ver `next.config.ts`).
  Ao substituir o modelo, prefira um novo nome de arquivo.
- O SOG tem ~45,7 MB, abaixo do limite de 100 MB por arquivo do GitHub (sem Git LFS). Verifique,
  após o deploy, se o arquivo é entregue com status 200 e `Content-Length`.
- A transferência do modelo conta para a cota de banda do plano da Vercel.

---

## Próximas etapas

- Hotspots/anotações das peças (o Experience Settings já suporta `annotations`).
- Textos educativos e percursos guiados.
- Imagem de pôster durante o carregamento (`posterUrl`).
- Testes em aparelhos reais e medição de desempenho de referência.

---

## Créditos

Visualização baseada no [SuperSplat Viewer](https://github.com/playcanvas/supersplat-viewer) e no
[PlayCanvas Engine](https://github.com/playcanvas/engine), ambos sob licença MIT. Colisão gerada
com o [SplatTransform](https://github.com/playcanvas/splat-transform) (MIT).
