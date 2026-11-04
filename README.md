# Solos na Escola

Experiência digital interativa de uma exposição educativa sobre solos, desenvolvida a partir de
reconstrução tridimensional.

Projeto de Trabalho de Conclusão de Curso (TCC) — Universidade Federal do Paraná (UFPR).

O objetivo é transformar uma exposição museológica, reconstruída por meio de
**3D Gaussian Splatting (3DGS)**, em uma experiência web navegável diretamente no navegador, em
computadores e dispositivos móveis.

> **Estado atual (etapa 3 — primeira interação 3D):** o visitante começa na entrada da
> exposição e caminha pelo espaço em primeira pessoa (Walk Mode oficial do SuperSplat Viewer),
> com colisão, altura humana fixa e controles para teclado/mouse e telas de toque. Na estante ao
> lado da porta, as três caixas e a maquete da **Formação do Solo** podem ser inspecionadas em 3D
> (ver [Inspeção de objetos](#inspeção-de-objetos-etapa-3)). Textos educativos, narração e as
> demais estantes serão desenvolvidos nas próximas etapas.

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
| `public/models/museu_web.voxel.json` | 669 B | metadados (formato 1.1, limites, resolução) |
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
| `verticalOffset` | −0,10 m | desloca a colisão gerada para alinhar o piso da colisão ao piso visível (ver abaixo) |

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

e, em seguida, [`scripts/offset-collision.mjs`](scripts/offset-collision.mjs) (também executável
sozinho com `node scripts/offset-collision.mjs`).

**Deslocamento vertical (`verticalOffset = −0,10 m`).** A voxelização marca como sólida toda
célula de 5 cm com densidade de splats, e os splats do piso se espalham alguns centímetros acima
da superfície: o topo do piso da colisão ficava em y ≈ 0,10 m, enquanto o piso visível — medido
decodificando as posições dos splats do SOG em quatro pontos da sala — fica em y ≈ 0,00 m
(entre −0,015 e +0,005). Como o Walk Mode põe os olhos 1,5 m acima do piso da **colisão**, os
olhos ficavam ≈ 1,6–1,7 m acima do piso visível. O script desloca a grade inteira 0,10 m (dois
voxels) para baixo alterando só `gridBounds` no `.voxel.json` — o viewer posiciona a grade por
esse campo; o `.voxel.bin` não muda. O valor aplicado fica registrado em `solosVerticalOffset`, de
modo que rodar o script de novo não acumula deslocamentos. O modelo visual e o SOG não mudam.

**Cache da colisão.** `/models/*` é servido com cache de 1 dia. Para que uma colisão regenerada
ou deslocada chegue a quem já visitou o site, a URL leva `?v=<versão>`, derivada dos próprios
metadados (contagens da octree e deslocamento) em [`src/data/visit.ts`](src/data/visit.ts); o
viewer deriva a URL do `.voxel.bin` trocando a extensão, então o parâmetro vale para os dois.

Arquivos necessários para reproduzir: `public/models/museu_web.sog`,
`src/data/collision.json`, `scripts/generate-collision.mjs` e `scripts/offset-collision.mjs`. O SOG apenas é lido; seu SHA-256
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
| Altura dos olhos | ≈ 1,55 m acima do piso visível (1,50 m na entrada; 1,45–1,61 m andando) | WalkController 1.42: 1,5 m acima do piso da colisão (`eyeHeight` 1,3 m + flutuação 0,2 m), não configurável pela API pública; ajustada com o deslocamento vertical da colisão (`verticalOffset`) |
| Cápsula | 1,5 m de altura × 0,2 m de raio | WalkController |
| Campo de visão | 90° | fixo no WalkController durante a caminhada |
| Inclinação vertical | ±90° | fixa no viewer; não pode ser limitada pela API pública |
| Velocidade de caminhada | ≈ 1,15 m/s (`MOVEMENT.walk = 0,45`) | medida no navegador |
| Velocidade com Shift | ≈ 1,9 m/s (`MOVEMENT.run = 0,75`) | medida no navegador |

A altura do WalkController não é alterada (código de terceiros); a altura percebida foi ajustada
para ≈ 1,55 m alinhando o piso da colisão ao piso visível (ver “Deslocamento vertical”).

### O que foi bloqueado

O visitante não pode sair do Walk Mode nem usar recursos que quebrem a sensação de visita:

| Recurso | Como é bloqueado |
| --- | --- |
| Orbit, Fly, Frame, animação, troca de modo | `ui: false` (sem barra do viewer) e `noanim: true`; o viewer é colocado em `walk` e qualquer mudança de `cameraMode` é revertida |
| Atalhos 1/2/3, F, R, G, V, H, Espaço (pulo), Esc | `state.inputEnabled = false` desativa os atalhos e a entrada de teclado do próprio viewer; o movimento por teclado é da aplicação |
| Pulo por toque rápido (modo de jogo em telas de toque) | toques no canvas que não chegam a arrastar são retidos e nunca chegam ao viewer ([`touchTapFilter.ts`](src/lib/viewer/touchTapFilter.ts)) |
| Roda do mouse (zoom/deslocamento), botão direito/meio | bloqueados na fase de captura sobre o contêiner |

Continua disponível: arrastar para olhar ao redor (mouse ou um dedo) e, no computador com o
cursor livre, clicar no piso para caminhar até o ponto — comportamentos do próprio Walk Mode, que
permanecem no modo de caminhada.

### Controles

| Ação | Computador | Tela de toque |
| --- | --- | --- |
| Andar | **W A S D** ou setas | joystick no canto inferior esquerdo |
| Andar mais rápido | segurar **Shift** | inclinar o joystick até a borda |
| Olhar ao redor | ao começar a andar, o cursor some e o mouse gira a câmera; com o cursor livre, clicar e arrastar | arrastar um dedo na tela (a câmera segue o dedo) |
| Liberar o cursor | **Esc** | — |
| Ir até um ponto | clicar no piso (cursor livre) | — |
| Voltar ao início | botão **Voltar à entrada** | idem |
| Qualidade | botão ao lado da tela cheia: Alto, Médio, Baixo, Muito baixo | idem |
| Inspecionar objeto destacado | **E** ou clique no objeto | botão **Inspecionar** |

**Captura do mouse (estilo jogo em primeira pessoa).** No computador, a primeira tecla de
movimento liga o modo de jogo do próprio viewer (`state.gamingControls = true`), que usa a
Pointer Lock API: o cursor desaparece e o movimento do mouse — sem precisar segurar botão —
gira a câmera. **Esc** devolve o cursor (o navegador encerra a captura e o viewer desliga o
modo de jogo); a próxima tecla de movimento captura de novo. Enquanto o mouse está capturado, um
aviso discreto no topo indica “Esc libera o cursor” por 2 segundos e some (reaparece a cada nova captura). O painel de ajuda libera o cursor ao abrir
e impede a captura enquanto estiver aberto.
Com o cursor capturado, cliques não levam até um ponto (comportamento do modo de jogo do viewer).

**Olhar no toque (estilo jogo para celular).** Fora do modo de jogo, o viewer trata o arrasto de
um dedo como “arrastar o cenário”: a câmera gira no sentido oposto ao do dedo, o que parece
resistir ao gesto. Em telas de toque a visita mantém o modo de jogo sempre ligado, em que a
câmera segue o dedo (arrastar para a direita olha para a direita, ≈ 0,34° por pixel, mesma
suavização do mouse), e o segundo dedo não move o visitante. Nesse modo o viewer trata um toque
rápido como pulo; para evitar isso, [`touchTapFilter.ts`](src/lib/viewer/touchTapFilter.ts) retém
o início de cada toque no canvas e só o entrega ao viewer quando o dedo se afasta 16 px — acima do
limiar de 15 px com que o viewer separa toque de arrasto —, então toques sem arrasto nunca chegam
a ele. O joystick é um elemento separado e não passa pelo filtro.

Teclado e joystick são combinados em [`moveInput.ts`](src/lib/viewer/moveInput.ts) e enviados
por `setMoveInput`. O movimento é liberado ao soltar a tecla/dedo, ao perder o foco da janela e
ao ocultar a aba — nunca fica “preso”. A interface mínima tem identificação do projeto, ajuda
(aberta automaticamente na primeira visita), qualidade, tela cheia e o botão de retorno.

**Recálculo das cores ao andar.** Os splats do SOG têm cor dependente do ângulo de visão
(harmônicos esféricos, 3 bandas). O motor recalcula essas cores quando a câmera se desloca mais
que `tan(colorUpdateAngle) × max(1, distância até a cena)`; girar no lugar não dispara o
recálculo. O viewer usa 0,2°: com a câmera dentro da sala o limite fica em ≈ 3,5 mm e, ao andar,
as cores dos ≈ 3,0 milhões de splats eram recalculadas em todo quadro — por isso o FPS caía ao
caminhar em notebooks e celulares, mas não ao só olhar em volta. A visita fixa o ângulo em 1°
(o valor que o próprio viewer usa no nível `performance`), em
[`colorRefresh.ts`](src/lib/viewer/colorRefresh.ts). Medido com o tempo de GPU do WebGPU no painel
de testes, andando: quadros com recálculo de 100% → 4%, GPU média de ≈ 8,0 ms → ≈ 5,2 ms (o mesmo
de só girar a câmera). Esse custo depende do número de splats, não da resolução; os modos de
qualidade não o reduzem.

**Contador de FPS.** Abaixo da identificação do projeto, um contador discreto mostra os quadros
por segundo que o viewer realmente renderizou no último segundo (evento `postrender` do motor, que só dispara quando há render,
[`FpsCounter.tsx`](src/components/ui/FpsCounter.tsx)). O viewer renderiza sob demanda: com a
câmera parada e nada mudando, não desenha quadros novos, e o contador mostra “—” em vez de um
número baixo que pareceria lentidão.

### Qualidade

O botão ao lado da tela cheia abre quatro modos, em degraus iguais de **resolução de
renderização** (fração da resolução máxima do viewer, em cada eixo):

| Modo | Escala | Pixels desenhados |
| --- | --- | --- |
| Alto | 100% | 100% |
| Médio | 75% | ≈ 56% |
| Baixo | 50% | 25% |
| Muito baixo | 25% | ≈ 6% |

Por que resolução: os níveis nativos de qualidade do viewer (`state.quality`) mudam o orçamento
de splats, que só age em cenas com níveis de detalhe (LOD). O SOG da exposição é um arquivo único
de ≈ 3,0 milhões de splats e é sempre desenhado inteiro, então ali os níveis nativos só
diferem na resolução do mais baixo. Como o SOG não deve ser reconvertido, a resolução é o ajuste
que realmente muda o custo (o desenho dos splats cresce com o número de pixels).

Implementação ([`renderScale.ts`](src/lib/viewer/renderScale.ts)): o viewer dimensiona o
backbuffer pelo tamanho CSS do canvas; o canvas passa a ocupar `escala × 100%` do contêiner e é
ampliado de volta com `transform: scale(1/escala)`, sem alterar o código do viewer. O olhar
usa deslocamentos e a escolha de um ponto no piso usa `offsetX / clientWidth`, ambos no espaço
local do canvas, então continuam corretos. O nível nativo do viewer é mantido fora de
`performance` (que já corta a resolução pela metade nos celulares), para não somar as duas
reduções. Padrão sem escolha salva: **Alto** no computador e **Baixo** em telas de toque —
o mesmo que o viewer fazia antes. A escolha fica salva no navegador (`localStorage`).

---

## Inspeção de objetos (etapa 3)

Primeira interação 3D: inspeção de objetos no estilo de jogos de aventura. A estante cinza ao
lado da porta de entrada guarda, no nível superior, as caixas 1, 2 e 3 e a maquete da formação do
solo. Ao se aproximar e olhar para uma delas, o objeto recebe um contorno amarelo (`#FFD54A`) e
aparece o indicador **[E] Inspecionar** (no toque, o botão **Inspecionar**). **E** ou um clique no
objeto abre a sequência **Formação do Solo**, sempre a partir da Caixa 1 — as quatro peças só
fazem sentido juntas, então a sequência começa no início qualquer que seja a peça escolhida:

| # | Objeto | Modelo |
| --- | --- | --- |
| 1 | Caixa 1 · Rocha não alterada | `public/models/inspection/caixa_01_rocha_nao_alterada.glb` (2,4 MB) |
| 2 | Caixa 2 · Rocha alterada | `public/models/inspection/caixa_02_rocha_alterada.glb` (2,6 MB) |
| 3 | Caixa 3 · Solo formado | `public/models/inspection/caixa_03_solo_formado.glb` (3,2 MB) |
| 4 | Maquete · Formação do solo | `public/models/inspection/maquete_01_formacao_do_solo.glb` (3,5 MB) |

Os GLBs foram copiados sem alteração da pasta de origem *Inspecionar objetos* (já eram glTF
binário, em metros, Y para cima e frente em +Z); **não houve conversão nem recompressão**. O GLB
do conjunto (11,6 MB) não é usado: cada objeto é carregado sozinho, e o próximo da sequência é
pré-carregado. As miniaturas da faixa de navegação ficam em `public/models/inspection/thumbs/`
(WebP 192 px, ≈ 5 KB cada).

**Durante a inspeção** o museu continua renderizado por trás, escurecido (opacidade 0,70), e o
objeto aparece num visualizador próprio, enquadrado no espaço acima dos controles. A interface
da visita (identificação, ajuda, qualidade, tela cheia, “Voltar à entrada”) sai de cena. Comandos:

| Ação | Computador | Toque |
| --- | --- | --- |
| Girar | arrastar | arrastar um dedo |
| Zoom | roda do mouse, **+** / **−**, botões | pinça |
| Deslocar | arrastar com botão direito ou com **Shift** | arrastar com dois dedos |
| Restaurar a vista | **R**, duplo clique ou botão | botão |
| Tirar da caixa / devolver | clique na caixa ou na rocha, **C** ou botão da caixa | toque na caixa ou na rocha, ou botão |
| Anterior / próximo | **←** / **→** ou botões | botões |
| Ir direto a uma etapa | miniaturas abaixo dos botões | miniaturas |
| Fechar | **Esc** ou **X** | **X** |

**Tirar da caixa.** É o padrão para toda peça sólida guardada numa caixa: nas caixas 1 e 2, um
clique na caixa ou na rocha (ou nos fragmentos) esmaece a caixa de madeira em 0,28 s e reenquadra
só a rocha, para girá-la e examiná-la por baixo; com a caixa fora, um clique na rocha (ou **C**, ou o botão) a devolve. O
cursor vira “mão” sobre a caixa e a rocha. A caixa é o nó do GLB indicado em `container` (`Caixa_Madeira…`); nada é alterado nos
arquivos. Material solto, como o solo da caixa 3, não sai da caixa: esse item não tem `container`,
e o botão e a dica não aparecem.

**Faixa de etapas.** Abaixo dos botões, as quatro peças do conjunto aparecem como miniaturas
numeradas, com o título curto; a atual fica destacada em amarelo, e um clique leva direto a
qualquer uma.

Na maquete, o botão de camadas mostra ou esconde os rótulos dos estágios (R, A + R, A + C + R,
A + B + C + R), posicionados a partir dos nós do próprio GLB. A inspeção não tem narração nem
texto explicativo nesta etapa (decisão do projeto); os campos já existem nos dados (abaixo).

**Walk Mode suspenso, não recriado.** Abrir a inspeção não recarrega o SOG, não muda a câmera
nem o viewer do museu: o teclado de movimento ignora as teclas, o movimento acumulado é zerado, a
captura do mouse é liberada e o joystick some. Ao fechar, o visitante está exatamente onde estava
e continua em Walk.

### Como o destaque funciona sobre o Gaussian Splat

O splat é uma nuvem de gaussianas sem objetos separados, então não há malha para pintar de
amarelo. Cada objeto tem um **volume invisível** (caixa orientada) em
[`src/data/interactions.json`](src/data/interactions.json). A cada quadro renderizado pelo viewer
(evento `postrender`), a [camada de interação](src/lib/interaction/interactionManager.ts):

1. lança um raio pelo centro da tela (cursor capturado ou toque) ou pelo cursor (cursor livre);
2. testa o raio contra os volumes (*slab test* em caixa orientada) e fica com o mais próximo;
3. exige distância até a câmera menor que `maxDistance` (2,5 m) e que a câmera esteja **na frente**
   do volume, num cone de 70° em torno da sua frente (+Z local);
3. descarta o alvo se um **bloqueador** (`occluders` em `interactions.json`, caixas invisíveis no
   lugar das laterais da estante) for atingido antes dele — é a oclusão possível sem geometria por
   objeto: da porta de entrada, olhando a lateral da estante, a maquete não acende através dela;
5. projeta as arestas do volume na tela (com recorte no plano da câmera) e desenha o casco
   convexo como contorno amarelo num SVG sobreposto ao canvas, com brilho e transição de 220 ms.

**Posição dos volumes.** Medida no próprio SOG (vistas de cima, de frente e de lado do nível
superior da estante, a partir das posições das gaussianas): a frente da estante fica em
z ≈ −4,27 m; a face frontal das caixas, em z ≈ −4,31 m (caixas de ≈ 19,5 cm, centros em
x = 0,84 / 1,04 / 1,24 m); e a maquete está **girada ≈ 26°** no fundo do nível (ajuste de reta
pelas divisórias brancas: z = 0,491·x − 5,297, resíduo 7 mm), com o lado direito mais à frente. Os
volumes da primeira versão estavam ≈ 14 cm à frente das caixas e a maquete sem rotação, por isso o
contorno “saía” da estante.

A geometria é pura ([`geometry.ts`](src/lib/interaction/geometry.ts)) e coberta por testes. Com o
cursor livre, um clique no objeto abre a inspeção em vez de levar o visitante até o ponto; um
arrasto a partir do objeto continua girando a câmera.

### Visualizador de inspeção

[`inspectionViewer.ts`](src/lib/inspection/inspectionViewer.ts) cria um segundo `Application` do
PlayCanvas (o mesmo motor do viewer, carregado sob demanda) num canvas transparente sobre o museu.
Renderiza só quando algo muda. A iluminação imita um estúdio fotográfico, sem arquivos extras:

- **ambiente procedural (IBL):** um panorama gerado em código (teto claro, horizonte médio, chão
  escuro e uma janela de luz grande e suave no alto) vira o atlas de iluminação do motor
  (`EnvLighting`), que dá luz difusa com direção e reflexos suaves aos materiais PBR dos GLBs;
- **luz principal com sombras suaves** (PCF 5×5, mapa de 2048 px, distância de sombra ajustada ao
  objeto), vinda do alto, da esquerda e da frente: a rocha sombreia o fundo e as paredes da caixa;
  o viés de sombra é baixo (0,008) porque os objetos têm ≈ 30 cm — com o padrão a sombra sumia;
- **contraluz fria** para separar o contorno do fundo escuro;
- *tone mapping* **ACES 2**: comprime os brancos (divisórias e etiqueta da maquete) e dá contraste
  de foto sem a saturação do ACES clássico. Escolhido comparando capturas do próprio canvas com
  linear, neutro e ACES.

As luzes ficam paradas e o objeto gira, como numa mesa giratória. O modelo é centralizado pela caixa envolvente e enquadrado
pela esfera envolvente; a rotação usa quatérnios nos eixos da tela, com amortecimento e limites de
zoom e deslocamento. Ao fechar, a aplicação é destruída e o contexto WebGL é liberado
(`WEBGL_lose_context`), pois o motor não o libera sozinho: 12 aberturas seguidas liberaram 12
contextos, sem afetar o canvas do museu.

### Calibração dos volumes (`?debugInteractions=1`)

Abra a visita com **`?debugInteractions=1`** (ex.: `http://localhost:3000/?debugInteractions=1`).
Os volumes aparecem em ciano, com eixos locais (X vermelho, Y verde, Z azul = frente) e
coordenadas, e um painel permite ajustar posição, rotação, tamanho e distância máxima, trazer o
volume para a mira (1,2 m à frente da câmera) e mover todos juntos em passos de 5 cm. **Copiar
JSON** copia o arquivo completo: cole em `src/data/interactions.json`. As alterações do painel
valem só na aba aberta. O parâmetro também funciona no site publicado (só desenha e copia; não
grava nada). Os bloqueadores aparecem em vermelho e são editados direto no JSON (`occluders`).

### Editar textos, narração e sequência

- **Títulos, ordem e modelos:** [`src/data/inspection.ts`](src/data/inspection.ts), conjunto
  `FORMACAO_DO_SOLO`. Cada item tem `title` (cabeçalho), `shortTitle`, `model.url`,
  `model.sizeBytes` (o teste confere com o arquivo) e `view` (orientação inicial: `yawDeg`,
  `pitchDeg` e `rotationDeg` para corrigir a orientação do GLB).
- **Texto e narração (futuro):** os campos opcionais `description` e
  `narration: { audioUrl?, text? }` já estão no tipo `InspectionItem`, mas ainda não são exibidos.
  Os áudios devem ir para `public/audio/…` (arquivos estáticos; sem serviços pagos de voz).
- **Rótulos da maquete:** `markers` (`node` = nome do nó no GLB, `label` = texto).
- **Caixa que some ao clicar:** `container: { node }` (nome do nó do recipiente no GLB). Use em
  todo item cujo conteúdo é uma peça sólida (rochas, fragmentos); não use com material solto
  (terra, solo, areia) nem em peças sem caixa (ex.: a maquete).
- **Miniatura:** `thumbnail`. Para gerar de novo, abra a inspeção em desenvolvimento, vá à etapa e
  rode no console `__SOLOS_INSPECTION__.snapshot()` (PNG do quadro atual, fundo transparente);
  recorte, deixe quadrada, reduza para 192 px e salve em WebP.
- **Rótulo do indicador:** `label` do volume em `interactions.json`.

### Adicionar uma nova estante

1. Copie os GLBs para `public/models/inspection/` (nomes em minúsculas, sem espaços).
2. Em `inspection.ts`, crie um `InspectionSet` (id, título e itens) e inclua-o em
   `INSPECTION_SETS`.
3. Gere as miniaturas (acima) em `public/models/inspection/thumbs/`.
4. Em `interactions.json`, acrescente um volume por objeto com `setId` igual ao id do conjunto e
   `order` na sequência; calibre com `?debugInteractions=1`. Se outro móvel puder ser visto
   através de uma lateral, acrescente um bloqueador em `occluders`.
5. Rode `npm test` (ids, ordem, arquivos, tamanhos, caixas e miniaturas) e confira no navegador.

Os testes de dados atuais esperam o conjunto `formacao-do-solo` com ordens 1–4; ajuste-os ao
acrescentar outros conjuntos.

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
│   ├── museu_web.voxel.bin        # colisão: octree de voxels
│   └── inspection/*.glb           # objetos inspecionáveis (caixas 1–3 e maquete)
├── scripts/
│   ├── generate-collision.mjs     # npm run collision
│   └── offset-collision.mjs       # alinha o piso da colisão ao piso visível
├── src/
│   ├── app/
│   │   ├── page.tsx               # rota "/" → exposição
│   │   └── dev/camera/page.dev.tsx  # calibração (somente dev)
│   ├── components/
│   │   ├── viewer/
│   │   │   ├── GaussianViewer.tsx # integração React do SuperSplat Viewer (+ escala e colisão)
│   │   │   ├── Exhibition.tsx     # tela principal da visita
│   │   │   ├── useWalkVisit.ts    # trava no Walk, teclado, joystick, retorno à entrada
│   │   │   └── useRenderQuality.ts # modo de qualidade escolhido e aplicado
│   │   ├── interaction/
│   │   │   ├── InteractionLayer.tsx      # contorno, mira, indicador [E] e cliques/toques
│   │   │   └── InteractionCalibrator.tsx # painel de ?debugInteractions=1
│   │   ├── inspection/
│   │   │   ├── InspectionOverlay.tsx     # sobreposição, cabeçalho, navegação e atalhos
│   │   │   └── useInspection.ts          # estado da sequência (sempre começa no item 1)
│   │   ├── dev/CameraCalibration.tsx
│   │   └── ui/                    # carregamento, erro, ajuda, joystick, controles
│   ├── data/
│   │   ├── collision.json         # escala e parâmetros de colisão (script + app)
│   │   ├── visit.ts               # entrada, velocidades, convenções
│   │   ├── quality.ts             # modos de qualidade (escala de resolução)
│   │   ├── experience.ts          # modelo e Experience Settings v2
│   │   ├── interactions.json      # volumes de interação (calibrados)
│   │   ├── interactions.ts        # tipos e serialização dos volumes
│   │   └── inspection.ts          # conjuntos, itens, títulos, modelos e vistas
│   ├── lib/interaction/
│   │   ├── geometry.ts            # raio × caixa, frente, projeção e contorno (testado)
│   │   └── interactionManager.ts  # alvo, distância, destaque SVG e modo de calibração
│   ├── lib/inspection/
│   │   └── inspectionViewer.ts    # visualizador PlayCanvas do objeto
│   └── lib/viewer/
│       ├── sceneScale.ts          # escala uniforme em runtime
│       ├── walkLock.ts            # bloqueio de modos, atalhos e gestos
│       ├── touchTapFilter.ts      # toque rápido não vira pulo (olhar no celular)
│       ├── renderScale.ts         # resolução de renderização dos modos de qualidade
│       ├── colorRefresh.ts        # cores dependentes do ângulo: recálculo a cada 1°
│       ├── moveInput.ts           # combinação teclado + joystick → setMoveInput
│       ├── keyboardMovement.ts    # WASD/setas/Shift
│       ├── cameraPose.ts          # leitura da pose da câmera (calibração)
│       └── spawnOverride.ts       # entrada de teste (somente dev)
├── tests/interactions.test.mjs    # npm test
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
| B | Caminhada, altura e colisão | ✔ W/A/S/D corretos; olhos entre 1,59 e 1,74 m durante o percurso (antes do deslocamento vertical; ver teste L); para ao encontrar as mesas (z ≈ −1,15); para atrás antes da porta (z ≈ −4,45) — não sai da sala |
| C | Bloqueios | ✔ teclas 1, 2, 3, F, R, G, V, Espaço, E, Q, Esc, roda do mouse e botão direito não mudam o modo nem movem a câmera; arrastar só gira |
| D | Voltar à entrada | ✔ retorna exatamente à pose inicial, continua em Walk, nenhuma nova requisição do SOG ou da colisão |
| E | Móvel (emulação 375×812 retrato; 812×375 paisagem) | ✔ joystick aparece em modo toque, anda para frente e para ao soltar; sem rolagem/overflow; ajuda adaptada ao toque |
| H | Olhar no toque (eventos de toque simulados) | ✔ modo de jogo ligado em `inputMode = touch`; arrastar 120 px para a direita gira ≈ 40° para a direita; toque rápido e arrasto de 10 px não movem a câmera nem fazem pular (altura dos olhos constante); joystick continua andando; ao usar o mouse o modo de jogo desliga e volta ao tocar |
| I | Qualidade | ✔ os quatro modos mudam o backbuffer para 100/75/50/25% (771×846 → 579×635 → 386×423 → 193×212 no computador) mantendo a imagem na tela inteira; nível nativo do viewer fica em `default`; clique no piso com 50% chega ao canvas na posição relativa certa (0,749; 0,8 para um clique em 75%; 80%); escolha salva e restaurada; celular (emulação) começa em Baixo, com a mesma resolução de antes; menu fecha ao tocar fora; olhar por toque inalterado |
| J | Aviso do mouse e FPS | ✔ aviso visível 0,7 s após a captura e oculto aos 2,6 s; some com Esc; reaparece numa nova captura (pointer lock simulado); contador mostra “— fps” com a cena parada, ≈ 100 fps andando no painel de testes (sobe de 78 para 100 no primeiro segundo) e volta a “—” ao parar |
| K | Recálculo das cores ao andar (GPU, WebGPU) | ✔ `colorUpdateAngle` = 1 após o carregamento e após troca do nível nativo do viewer; andando, recálculo em 7 de 199 quadros (antes: 100%), GPU média 5,21 ms (antes ≈ 8,0 ms), pior quadro 8,26 ms; imagem normal após andar. Não medido no notebook nem no Galaxy S25 |
| L | Altura dos olhos (deslocamento −0,10 m) | ✔ colisão carregada com `?v=17775-15686--0.1` (JSON e BIN); olhos a 1,50 m na entrada e após “Voltar à entrada”; andando, 1,45–1,61 m (mediana 1,551 m), antes 1,57–1,71 m (mediana 1,66 m); piso visível em y ≈ 0,00 m; para nas mesas (z ≈ −1,20) e antes da porta (z ≈ −3,95), como antes do ajuste; continua em Walk |
| F | Produção | ✔ `typecheck`, `lint` e `build` sem erros; `/` 200; `/dev/camera` 404; voxels 200; sem erros no console |
| G | Captura do mouse | ✔ W/D chamam `requestPointerLock` e ligam o modo de jogo; com a captura ativa (API de pointer lock simulada, pois o painel de navegador embutido usado nos testes recusa o pointer lock), mover o mouse sem botão gira a câmera e o aviso aparece; Esc desliga o modo de jogo, o aviso some e o visitante continua em Walk; com a ajuda aberta não há captura. Recusa real do navegador: o viewer reverte o modo de jogo e continua em Walk |

### Inspeção de objetos (etapa 3)

Automatizados — `npm test` (executor `node:test`; o Node ≥ 22.18 executa o TypeScript de
`geometry.ts` diretamente): **12 de 12 passaram** em 4/11/2026. Cobrem raio × volume (acerto, erro,
mais próximo, de dentro), bloqueador na frente e atrás do volume, rotação dos eixos, frente e cone
de 70°, distância, contorno projetado (e volume atrás da câmera), casco convexo, consistência entre
`interactions.json` e `inspection.ts`, existência, tamanho e cabeçalho glTF dos quatro GLBs, nós
das caixas presentes nos GLBs (com conteúdo fora delas; só as caixas de rocha) e miniaturas WebP. `typecheck`, `lint` e
`build` sem erros.

Manuais, no painel de navegador embutido (Chrome, servidor de desenvolvimento, 1280×760 e
emulação de celular 375×812), em 4/11/2026:

| # | Teste | Resultado |
| --- | --- | --- |
| 1 | Volumes alinhados aos objetos (`?debugInteractions=1`) | ✔ caixas 1–3 e maquete sobre o nível superior da estante |
| 2 | Destaque e indicador ao olhar de frente | ✔ contorno amarelo e “[E] Inspecionar · Caixa 1 · Rocha não alterada” |
| 3 | Sem destaque de lado/de longe | ✔ da entrada, olhando a lateral da estante (≈ 82° da frente): sem contorno nem indicador |
| 4 | **E** abre na Caixa 1 | ✔ |
| 5 | Clique em outro objeto (maquete) abre na Caixa 1, sem andar até o ponto | ✔ |
| 6 | Girar, zoom (roda) e **R** | ✔ |
| 7 | Sequência com **→**/**←** e botões | ✔ 4 itens, “01 / 04” … “04 / 04”, botões desativados nas pontas; não passa do último |
| 8 | Rótulos dos estágios da maquete | ✔ |
| 9 | **Esc** e **X** fecham com a câmera na mesma pose | ✔ posição e direção idênticas; um único canvas; continua em Walk |
| 10 | Walk suspenso | ✔ **W** durante a inspeção: 0 m; **S** depois de fechar: 0,69 m |
| 11 | 12 aberturas e fechamentos seguidos | ✔ 12 contextos WebGL liberados; canvas do museu nunca perdeu o contexto; câmera parada. Heap JS 47 → 68 MB (sem coleta de lixo forçada; não conclusivo) |
| 12 | Celular (emulação 375×812) | ✔ contorno na Caixa 2 e botão **Inspecionar**; abre na Caixa 1; controles cabem na largura (sem rolagem); **X** fecha e o visitante continua no lugar |
| 13 | Volumes corrigidos (frente e de baixo, como nas capturas da equipe) | ✔ contorno da Caixa 1 sobre a caixa e a rocha; contorno da maquete girado junto com ela, dentro da estante |
| 14 | Bloqueadores | ✔ da entrada (−0,27; 1,5; −4,1) nenhum volume é selecionado (sem os bloqueadores a maquete seria); de frente, os quatro continuam selecionáveis |
| 15 | Tirar da caixa | ✔ clique na caixa ou na rocha esmaece a caixa e reenquadra a rocha; clique na rocha devolve; caixa 3 (solo) e maquete sem o recurso; no celular (emulação), toque na rocha funciona |
| 16 | Miniaturas | ✔ quatro miniaturas abaixo dos botões; clique na 4 vai direto à maquete (e volta à 1); cabem em 375 px (82 px cada) |
| 17 | Iluminação | ✔ sombras da rocha dentro das caixas e da moldura na maquete; comparadas capturas do canvas (linear, neutro, ACES, ACES 2) antes da escolha |

Não verificado na inspeção: aparência num celular real (sombras e IBL dependem da GPU),
**E** com o mouse realmente capturado (o painel de testes recusa o
pointer lock; a mira central foi validada com o cursor livre e no toque), toque real com pinça
(apenas emulação, sem gestos multitoque), preferência de movimento reduzido, Safari/iOS e
desempenho em aparelhos de entrada.

### Visita (etapa 2)

Não verificado: captura real do mouse em um navegador comum (o painel de testes não permite pointer lock; o fluxo foi validado com a API simulada), aparelho físico com toque real (apenas emulação), Safari/iOS, desempenho em
celulares de entrada e o deploy na Vercel.

## Limitações conhecidas

- A escala (5,4) é estimada a partir da altura padrão de porta (2,10 m).
- A pose de entrada foi medida em renderizações do SOG; recomenda-se confirmar com a rota
  `/dev/camera`.
- Altura dos olhos (1,5 m acima do piso da colisão), FOV (90°) e limite de inclinação são fixos no viewer 1.42; a altura percebida depende do deslocamento vertical da colisão.
- A colisão por voxels tem resolução de 5 cm; superfícies muito finas ou com baixa opacidade no
  splat podem não bloquear (ou bloquear um pouco antes) o visitante.
- Clicar/tocar no piso leva o visitante até o ponto (recurso do Walk Mode), inclusive até áreas
  livres distantes.
- Inspeção: a oclusão é aproximada (distância e cone de 70° em frente ao volume). Um objeto pode
  ser destacado através de algo que esteja entre ele e o visitante dentro desse cone; na estante
  atual isso não ocorre, pois os objetos ficam no nível superior, na frente.
- Inspeção: os volumes foram medidos no splat; o contorno é a caixa do volume, não a silhueta
  exata do objeto.
- Inspeção: o clique que tira a rocha da caixa usa as caixas delimitadoras das malhas (não os
  triângulos); perto das bordas da rocha o clique pode valer um pouco fora dela.
- Inspeção: sem narração nem texto explicativo nesta etapa (por decisão do projeto).

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
npm test             # testes da interação e dos dados da inspeção (Node ≥ 22.18)
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

- Narração e textos educativos da inspeção (campos `narration` e `description`).
- Demais estantes da exposição como novos conjuntos de inspeção.
- Percursos guiados.
- Imagem de pôster durante o carregamento (`posterUrl`).
- Testes em aparelhos reais e medição de desempenho de referência.

---

## Créditos

Visualização baseada no [SuperSplat Viewer](https://github.com/playcanvas/supersplat-viewer) e no
[PlayCanvas Engine](https://github.com/playcanvas/engine), ambos sob licença MIT. Colisão gerada
com o [SplatTransform](https://github.com/playcanvas/splat-transform) (MIT).
