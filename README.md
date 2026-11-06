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
> lado da porta, as três caixas e a maquete da **Formação do Solo** (módulo 01) e as 20 rochas do
> **Material de Origem** (módulo 02, nas três prateleiras de baixo), as cinco caixas dos
> **Horizontes do Solo** (módulo 03, na mesa em frente à estante), o experimento animado da
> **Atração do Solo pelo Ímã** (módulo 04, na mesa ao lado) e a placa, os copos e o banner da
> **Textura do Solo** (módulo 05, na mesa em frente à janela), o experimento animado da
> **Porosidade do Solo** (módulo 06, na mesa em frente ao painel do campo verde) e o torrão na água e
> as duas plantas do **Ar no Solo** (módulo 07, nas duas mesas ao lado) podem ser
> inspecionados em 3D (ver [Inspeção de objetos](#inspeção-de-objetos-etapa-3)), com textos educativos
> e narração automática. As demais estantes serão desenvolvidas nas próximas etapas.

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
| Roda do mouse (zoom/deslocamento), botão direito/meio | não chegam ao viewer: bloqueados na fase de captura sobre o contêiner (a aplicação usa o botão direito para o zoom de detalhes) |

Continua disponível: arrastar para olhar ao redor (mouse ou um dedo) e, no computador com o
cursor livre, clicar no piso para caminhar até o ponto — comportamentos do próprio Walk Mode, que
permanecem no modo de caminhada.

### Controles

| Ação | Computador | Tela de toque |
| --- | --- | --- |
| Andar | **W A S D** ou setas | joystick no canto inferior esquerdo |
| Andar mais rápido | segurar **Shift** | inclinar o joystick até a borda |
| Olhar ao redor | ao começar a andar, o cursor some e o mouse gira a câmera; com o cursor livre, clicar e arrastar | arrastar um dedo na tela (a câmera segue o dedo) |
| Ver detalhes (zoom) | segurar o **botão direito**; ao soltar, volta | — |
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

**Zoom de detalhes (estilo “mirar” de jogo em primeira pessoa).** Enquanto o botão direito fica
pressionado sobre a cena, [`detailZoom.ts`](src/lib/viewer/detailZoom.ts) amplia a imagem 2,5 vezes
(FOV de 90° para 43,6°, em cerca de 0,2 s), e ao soltar ela volta; o fator e a suavização ficam em
`DETAIL_ZOOM` ([`visit.ts`](src/data/visit.ts)). Dá para andar durante o zoom, e o olhar fica mais
lento na mesma proporção do FOV, pois o viewer já multiplica a velocidade por `fov / 120`. Com o
cursor livre, o botão também captura o mouse, para olhar em volta com o zoom ligado, e devolve o
cursor ao soltar, a menos que o visitante tenha começado a andar. Abrir a ajuda, o menu de qualidade
ou uma inspeção encerra o zoom. Como a API do viewer não expõe o FOV e o WalkController o regrava a
cada quadro, o zoom é aplicado no evento `update` do PlayCanvas, logo depois do viewer.

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
| Mostrar / ocultar a descrição | **I**, botão do livro ou **X** do painel | **Ler** / **Recolher** |
| Pausar / retomar a narração (começa sozinha na primeira vez) | **N** ou botão ❚❚ / ▶ na barra do painel | botão ❚❚ / ▶ |
| Voltar um nível (menus do módulo 02) | **Esc** ou botão **‹** | botão **‹** |
| Fechar | **Esc** (fora dos menus) ou **X** | **X** |

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
A + B + C + R), posicionados a partir dos nós do próprio GLB.

**Descrição.** Um painel no estilo das caixas de texto de jogos (fundo escuro translúcido, filete
âmbar, cantos de moldura) traz o roteiro da equipe, dividido em duas abas: **Introdução** (o
texto geral do conjunto, que abre a sequência) e **Etapa N** (o texto da peça atual). Os
parágrafos entram em sequência, como falas; as frases curtas de pergunta ou exclamação (“Percebeu
a diferença?”) aparecem em destaque amarelo; e um botão no fim continua a história (“Ir para a
etapa 1”, “Próxima etapa”). Ao trocar de peça, o painel passa ao texto dela. Na maquete, os quatro
estágios aparecem como uma lista com os mesmos rótulos amarelos do modelo, entre a introdução e o
fechamento.

O painel **começa oculto em todas as telas e em todos os módulos**: o modelo fica com o espaço todo
e a narração toca com a legenda. Ele só aparece pelo botão (livro ou **Ler**) ou pela tecla **I**, e
abre já no trecho que está sendo falado. Uma vez aberto, fica aberto ao trocar de peça ou de menu; ao
fechar e reabrir a inspeção, começa oculto de novo. Com o painel oculto na tela deitada, a narração só
pausa pela tecla **N**, porque o botão ❚❚ / ▶ fica na barra do painel. No menu, a grade de cartões
reserva espaço acima dos controles para a legenda não cobrir os nomes da última fileira.

O painel se adapta à tela:

- **tela deitada** (computador, tablet ou celular na horizontal, ≥ 640 px de largura): encaixado à
  direita, do tamanho do texto (rola se faltar altura). O modelo e os controles, que são o foco,
  **continuam centralizados** quando sobram ao menos 600 px entre o painel e a sua imagem
  espelhada à esquerda (ex.: monitor 1920×1080, notebook 1440 px); em telas mais estreitas
  (1280 px, celular deitado) eles passam para o espaço à esquerda do painel, para não ficarem por
  baixo dele. A partir de 1280 px o painel e as letras crescem (até 32 rem de largura). Fecha no
  **X** do painel ou com **I**, e volta pelo botão do livro;
- **tela em pé** (celular, tablet na vertical): gaveta logo acima dos controles, com altura máxima
  de 32 % da tela. Começa **recolhida**, só com a barra das abas e um ponto amarelo pulsante avisando
  que há texto novo; **Ler** abre e **Recolher** fecha;
- **tela baixa** (≤ 500 px de altura, celular deitado): os controles ficam compactos (miniaturas
  menores, sem legenda) para sobrar altura para o modelo.

A linha de instruções que ficava acima dos botões (“Arraste para girar · Roda do mouse…”) foi
retirada: os comandos estão na ajuda da visita e na tabela acima, e o espaço ficou para a legenda da
narração. Continua só a dica da caixa (“Clique na caixa ou na rocha…”), que some depois do uso.

Em todos os casos o modelo é enquadrado no espaço que sobra: a área do canvas desconta a largura do
painel lateral ou a altura da gaveta. Com movimento reduzido no sistema, os parágrafos aparecem sem
animação.

**Narração.** A gravação da equipe diz exatamente os textos do painel, então fica no mesmo lugar:
um botão redondo e discreto (❚❚ / ▶) na barra das abas, com um anel amarelo que mostra o progresso.
A narração **começa sozinha** a cada texto novo: ao abrir a inspeção, ao trocar de aba ou de peça
(“Ir para a etapa 1”, “Próxima etapa”, setas, miniaturas) e, no módulo 02, ao entrar em cada menu.
**Só na primeira vez:** voltando a um texto cuja narração já tocou (ir e voltar nos menus, rever
uma rocha, reabrir a inspeção), ela não recomeça sozinha e fica no ▶. A lista do que já foi
ouvido vale até a página ser recarregada.
A inspeção é aberta por um clique, toque ou tecla do visitante, então os navegadores liberam o som;
se algum recusar, o botão ▶ fica à disposição. O botão (ou **N**) pausa e retoma; a pausa vale só
para o texto atual. Enquanto toca:

- o parágrafo falado fica destacado (fundo e contorno âmbar suaves) e o painel rola para mantê-lo à
  vista;
- na maquete, ao falar de um estágio, o item da lista e o **rótulo sobre o modelo** (R, A + R…)
  acendem juntos;
- com o painel **recolhido** (gaveta fechada ou painel lateral oculto), a frase falada aparece como
  **legenda discreta** acima dos controles (letra pequena, fundo preto translúcido, uma frase por
  vez). O tempo de cada frase dentro do parágrafo é estimado pelo número de caracteres entre os
  `cues`; com o painel aberto a legenda some, pois o próprio texto está destacado.

Os áudios ficam em `public/audio/inspection/formacao-do-solo/` (5 arquivos M4A, ≈ 810 KB no
total — o mesmo tamanho do original). Foram cortados da gravação única
(`Narracoess/etapa1.aac`, AAC mono 24 kHz, 120,5 s, não alterada) nos silêncios entre as seções,
**sem recodificar** (cópia dos quadros AAC para MP4, com `+faststart`):

| Arquivo | Trecho da gravação | Duração |
|---|---|---|
| `00-introducao.m4a` | 0 – 18,69 s | 18,7 s |
| `01-caixa-01.m4a` | 18,69 – 34,21 s | 15,5 s |
| `02-caixa-02.m4a` | 34,21 – 48,30 s | 14,1 s |
| `03-caixa-03.m4a` | 48,30 – 69,42 s | 21,2 s |
| `04-maquete-01.m4a` | 69,42 s – fim | 51,2 s |

Os cortes caem 0,15 s antes da primeira palavra de cada seção, dentro de silêncios de 0,4–0,8 s
(`ffmpeg -af silencedetect=noise=-35dB:d=0.35`). Os `cues` (início de cada parágrafo) vêm de uma
transcrição local com marcação de palavras (faster-whisper `small`, português), que coincidiu
palavra por palavra com o roteiro; nada foi enviado a serviços externos. Para refazer com uma nova
gravação: transcrever, localizar a primeira palavra de cada seção e de cada parágrafo, e cortar com
`ffmpeg -ss <início> -to <fim> -i gravacao.aac -c copy -movflags +faststart trecho.m4a`.

### Módulo 02 · Material de Origem

As três prateleiras abaixo da Formação do Solo guardam 20 bandejas de rochas: **ígneas** (em cima,
7), **metamórficas** (no meio, 8) e **sedimentares** (embaixo, 5). Cada prateleira tem um volume de
interação (`material-igneas`, `material-metamorficas`, `material-sedimentares`, faixas de
≈ 95 × 16 × 30 cm sobre as bandejas, medidas no splat: tampos das prateleiras em y ≈ 1,20 / 0,90 /
0,60 m) e todas abrem o mesmo acervo, em três níveis:

1. **Menu dos grupos** — três cartões grandes (Rochas ígneas, sedimentares e metamórficas), cada um
   com um mosaico das miniaturas das suas rochas e a contagem; o painel de descrição traz a
   explicação geral e a narração dela começa sozinha.
2. **Menu do grupo** — os cartões das rochas daquele grupo (miniatura e nome), com o texto e a
   narração do grupo. Passar o cursor num cartão já pré-carrega o modelo.
3. **Rocha** — o modelo 3D com a narração da rocha (aba **Rocha N**); setas e miniaturas percorrem
   as rochas do grupo. Clicar na bandeja ou na rocha esconde a bandeja e a etiqueta (mesmo recurso
   das caixas do módulo 01).

**‹** (ou **Esc**) volta um nível; no menu dos grupos, **Esc** fecha. O cabeçalho mostra onde o
visitante está (“Material de Origem · Rochas ígneas”). No celular, os cartões dos grupos ficam em
lista e as miniaturas das rochas perdem o nome (são 7–8 por grupo).

**Dados.** [`src/data/materialDeOrigem.ts`](src/data/materialDeOrigem.ts) é gerado por um script
(`modulo02_dados.py`, guardado com o material do processo, fora do repositório) a partir do roteiro
da equipe e do catálogo do acervo (`catalogo_web.json`: nós da bandeja, da etiqueta e das rochas).
Os textos são o roteiro sem alteração (as “Referências complementares” do documento ficam de fora),
exceto a abertura “Você já parou para pensar...” da explicação geral, retirada do texto e da
narração a pedido da equipe (a mesma frase já abre a Formação do Solo).
O texto do grupo das ígneas cita cinco exemplos, e o grupo tem sete rochas no acervo; mantido como
foi entregue. O acervo é um `InspectionCatalog` registrado em
[`inspectionCatalogs.ts`](src/data/inspectionCatalogs.ts); o `setId` dos volumes é o id dele.

**Modelos.** Os GLBs originais (6,7–12,7 MB cada, 212 MB no total; mapas de normal e rugosidade em PNG) foram
convertidos para versões web: mesma geometria, materiais, nós e nomes, cor-base e etiqueta (JPEG)
byte a byte iguais; só os PNG viraram JPEG de até 1024 px, qualidade 90 e **sem subamostragem de
cor** (4:4:4, para não estragar os mapas de normal). Resultado: 1,7–5,0 MB por rocha, 68 MB no
total, em `public/models/inspection/rochas/` (mesmos nomes de arquivo do acervo). Os originais não
foram alterados.

**Miniaturas.** Recortadas das imagens de apresentação do acervo (`*_preview.png`, render do
Blender 1600 × 1200): quadrado em torno da bandeja inteira, com o fundo cinza estendido nas bordas,
reduzidas a 320 px em WebP (≈ 5–10 KB), em `public/models/inspection/thumbs/rocha-*.webp`.

**Narração.** Duas gravações da equipe (“explicações gerais” e “cada rocha”, AAC) foram cortadas
**sem recodificar** em 24 arquivos M4A (4,9 MB) em `public/audio/inspection/material-de-origem/`:
`00-geral`, `grupo-igneas`, `grupo-sedimentares`, `grupo-metamorficas` e um por rocha (nome da
pasta do acervo). As gravações leem o documento inteiro, então **ficaram de fora**: a introdução
falada sobre o trabalho, os títulos (“1. Explicação geral”, “Rocha 02 01 carvão”), as
“Referências complementares” e as observações finais. Cada trecho vai da primeira palavra do
primeiro parágrafo à última palavra do último, localizado pela transcrição local (faster-whisper
`small`; os nomes saem com grafias variadas, então a busca é aproximada) e ajustado às pausas reais
(`silencedetect`); em três inícios (geral, arenito e ardósia) o ponto foi medido no envelope de
energia, porque a transcrição adiantava a primeira palavra e o corte levava o fim do título. Todos
os 24 cortes foram conferidos transcrevendo os 3 s iniciais e finais de cada arquivo.

### Módulo 03 · Horizontes do Solo

Na mesa em frente à estante ficam cinco caixas, na ordem do perfil: **Horizonte O, A, B, C e Camada
R**. Um volume único (`horizontes`, ≈ 106 × 14 × 22 cm, centro em (2,23; 0,86; −3,49)) cobre a
fileira: medido no splat, as caixas ocupam x = 1,72–2,74 m e z = −3,59 a −3,39 m, sobre o tampo da
mesa em y ≈ 0,80 m, com as etiquetas voltadas para +z (para o visitante), como a estante.

É um acervo de **grupo único**: abre direto no menu das cinco amostras (“Escolha uma amostra”), com
o texto geral e a sua narração; cada cartão abre a amostra em 3D com a narração própria (aba
**Amostra N**), e setas e miniaturas percorrem as cinco. **‹** ou **Esc** volta ao menu; no menu,
**Esc** fecha (não há menu acima dele). Qualquer `InspectionCatalog` com um grupo só funciona
assim.

**Caixa.** Só a Camada R (pedras) sai da caixa ao clicar (paredes, base e etiqueta). Os horizontes
O, A, B e C são material solto e ficam na caixa, pela mesma regra da Caixa 3 do módulo 01.

**Modelos e miniaturas.** Os cinco GLBs do acervo (3,5–6,1 MB, 23,4 MB no total; normal e cor já
em JPEG) foram copiados **sem alteração** para `public/models/inspection/horizontes/`. Miniaturas
pelo mesmo método do módulo 02 (recorte da imagem de apresentação, 320 px WebP). Observação: no
splat, cada caixa mede ≈ 20 × 20 × 11 cm, menor que a hipótese de 30 cm de largura do acervo; na
inspeção o modelo é enquadrado pelo próprio tamanho, então isso não aparece.

**Textos e narração.** Não houve roteiro escrito para a narração deste módulo: os textos do painel
são a fala da gravação da equipe (`horizontes.aac`, 190,5 s), transcrita localmente e revisada só
na pontuação e na divisão em parágrafos, sem trocar palavras; o conteúdo segue o roteiro de 2026
(págs. 15–18). A gravação tem só o roteiro (sem introdução nem títulos falados) e foi cortada sem
recodificar em seis M4A (1,3 MB) em `public/audio/inspection/horizontes-do-solo/`: `00-geral` e um
por caixa. O fechamento (“E agora que conhecemos todos os horizontes…”) vem depois da Camada R e
fica como `closing` dela.

**Correção dos cues do módulo 02.** A busca de cada parágrafo na transcrição aceitava a primeira
posição com semelhança ≥ 0,8, que às vezes ficava uma palavra antes (“a ele é formado” ainda passa
de 0,8 contra “ele é formado por”); agora fica com a melhor entre essa e as duas seguintes.
Recalculados, os áudios do módulo 02 saíram idênticos byte a byte, e 9 `cues` em 7 arquivos
(ex.: Granito, Calcário, grupo das metamórficas) foram corrigidos (estavam 0,6–1,4 s adiantados).

### Módulo 04 · Atração do Solo pelo Ímã

Na mesa ao lado da dos horizontes ficam as duas bandejas do experimento (solo sem e com magnetita,
cada uma com o pote e a placa verde) e, à frente, a caixinha com a magnetita. Um volume
(`atracao-ima`, ≈ 43 × 13 × 48 cm, centro em (2,98; 0,86; −3,49)) cobre as bandejas, os potes e
a caixinha: medido no splat, as bandejas ocupam x = 2,73–3,18 m e z = −3,72 a −3,38 m, com as tampas
dos potes em y ≈ 0,90 m; a caixinha vai até z ≈ −3,26 m. O volume começa em x = 2,76 m para não
sobrepor o dos horizontes (que termina em 2,758 m).

É um **conjunto de um item só**: abre direto no experimento (aba **Experimento**), sem contador,
setas nem faixa de miniaturas, e **Esc** fecha. O texto do painel é o roteiro da narração enviado
pela equipe (sem alteração; só o negrito de “Percebeu a diferença???” não foi mantido), e a gravação
(`magnetita.aac`, 65,3 s, sem introdução nem títulos) foi só trocada de contêiner, sem recodificar
(`00-atracao-do-ima.m4a`, 0,43 MB); os `cues` vêm da transcrição com marcação de palavras.

**GLB animado, copiado sem alteração** (`public/models/inspection/ima/`, 6,2 MB, um clipe
`atracao_ima` de 16 s a 24 q/s, só TRS): despejo do solo sem magnetita de 0 a 7 s, do solo com
magnetita de 7 a 14 s e quadro final parado com os dois resultados lado a lado (disco de magnetita
preso na placa com ímã; solo sem magnetita espalhado no fundo da outra bandeja).

**Animação conduzida pela narração** (`animation.sync` do item, pares [s da narração, s do clipe]):
o visualizador não toca o clipe sozinho; a cada quadro lê o tempo do áudio do painel e leva o clipe
ao instante correspondente (`AnimEvaluator` + `AnimClip` do PlayCanvas, avaliados à mão).

| Narração | Clipe |
|---|---|
| até 24,7 s (“Você já imaginou…” a “Agora, vamos comparar…”) | parado no primeiro quadro |
| 24,7 s, “Na primeira, temos um solo sem magnetita…” | 0 s: começa o despejo sem magnetita (o solo escorre em “Quando aproximamos o ímã…”) |
| 31,42 s, “Mas observe o que acontece com a segunda amostra!” | 7 s: começa o despejo com magnetita (o disco se forma em “Percebeu a diferença???”) |
| 40,38 s em diante | 15,96 s: último quadro, parado até o fim e depois da narração |

Pausar a narração pausa a animação. Com a narração já ouvida (reabrir a inspeção, sem tocar de
novo), o modelo aparece direto no último quadro, para comparar as duas placas; o ▶ recomeça a
narração e a animação do início. O enquadramento considera tudo o que o clipe percorre (amostras a
cada 0,5 s; malhas escondidas com escala 0 não entram), e `view.fitScale` = 0,8 aproxima a vista
inicial, porque a cena é larga e baixa. A função de sincronia fica em
[`animationSync.ts`](src/lib/inspection/animationSync.ts), testada.

### Módulo 05 · Textura do Solo

Na mesa em frente à janela ficam a caixa de madeira com a **placa de granulometria** e as três
bandejas com os **copos de solo arenoso, siltoso e argiloso**; o **banner** “Você conhece os grãos
que formam o solo?” fica no canto ao lado. Um volume (`textura`, ≈ 110 × 22 × 55 cm, centro em
(4,01; 0,89; −2,15), girado −90° em Y para a frente ficar voltada para a sala, −X) cobre a placa e
as bandejas: medido no splat, a mesa ocupa x = 3,73–4,27 m e z = −2,70 a −1,60 m, com o tampo em
y ≈ 0,78 m e os baldes até y ≈ 0,90 m.

Acervo de **grupo único** (como o módulo 03): abre direto no menu dos cinco itens (“Escolha um
item”), com o texto geral e a narração; cada item tem a narração própria (aba **Item N**). O texto
do painel é o roteiro enviado pela equipe, e a gravação (`texturas.aac`) foi cortada sem recodificar
em seis M4A (1,3 MB) em `public/audio/inspection/textura-do-solo/` (`00-geral` e um por item), com
os `cues` da transcrição com marcação de palavras.

**Modelos.** Placa e copos: GLBs do acervo copiados **sem alteração** para
`public/models/inspection/textura/` (2,3–3,7 MB). A placa está deitada no arquivo (amostras para +Y,
título para −Z): `rotationDeg` [90, 0, 0] a deixa em pé, de frente, com o cascalho em cima e a
argila embaixo. Placa e banner usam `fitScale` 0,9.

**Banner (modelo derivado).** Não há modelo 3D do banner no acervo. O GLB
(`banner_05_05_textura.glb`, 0,27 MB) é um plano de 0,976 × 1,354 m (tamanho medido no splat,
bastões incluídos), frente com a textura e verso cinza, material sem iluminação
(`KHR_materials_unlit`, a foto já traz a luz da sala). A textura (1024 × 1421, JPEG) vem de **duas
fotos da equipe**: a que mostra o banner inteiro (topo do título cortado) e a que mostra o topo,
registradas por SIFT + homografia e retificadas pelos quatro cantos. Uma primeira versão, retificada
de capturas do próprio splat, ficou só como registro do processo (legível no título, borrada nas
letras pequenas).

### Módulo 06 · Porosidade do Solo

Na mesa em frente ao painel do campo verde ficam a bandeja (pedra, esponja e torrão), a pisseta, os
dois vasos e o pote branco. Um volume (`porosidade`, ≈ 52 × 28 × 54 cm, centro em (2,08; 0,92; −0,81),
girado 180° em Y para a frente ficar voltada para −Z, de onde o visitante olha o painel) cobre a mesa:
medido no splat, o tampo ocupa x = 1,82–2,34 m e z = −1,08 a −0,54 m, em y ≈ 0,78 m, e o pote branco
vai até y ≈ 1,05 m.

É um **conjunto de um item só**, como o módulo 04: abre direto no experimento (aba **Experimento**),
sem contador, setas nem faixa. A gravação (`porosidade.aac`, 84,5 s, sem introdução nem títulos) foi
só trocada de contêiner, sem recodificar (`00-porosidade.m4a`, 0,57 MB). **A equipe enviou só o
áudio:** o texto do painel vem da transcrição com marcação de palavras, e não de um roteiro escrito.

**GLB animado, derivado do acervo** (`public/models/inspection/porosidade/`, 12,7 MB, um clipe
`porosidade_solo` de 23 s a 24 q/s, só TRS). O bloco binário (geometria, texturas e animação) é
idêntico ao do acervo; mudam só cor e opacidade de seis materiais:

- **Água** (gotas, gotículas, filetes e poças): no acervo é quase branca e tem alfa de 0,20 a 0,50,
  feita para o Cycles. Em WebGL, sem refração e sobre a bandeja branca, ficava quase invisível. Ganhou
  azul claro e alfa de 0,38 a 0,82. É uma escolha didática, para a água ser vista.
- **Esponja**: saía creme (textura clara e realces comprimidos pelo ACES 2), longe do laranja da foto.
  A cor agora multiplica a textura, e a mancha molhada escurece para ficar mais escura que a parte seca.

**Animação conduzida pela narração** (`animation.sync`), medida nos tempos reais do clipe:

| Narração | Clipe |
|---|---|
| até 17,16 s (“Você já imaginou…” a “…torrão de solo.”) | parado no primeiro quadro |
| 17,16 s, “Começamos pela pedra.” | 0–1,6 s: o frasco sobe e inclina |
| 18,82 s, “Observe…” até “…pela superfície.” | 1,6–5,8 s: gotas, filetes e poça (0,64×) |
| 25,38 s, “Isso acontece porque…” | 5,8 s: parado |
| 31,82 s, “Agora, vamos observar a esponja.” | 5,8–7,25 s: o frasco vai para a esponja |
| 33,44 s até “…ser absorvida” | 7,25–11,96 s: as gotas ficam paradas no topo (≈ 1×) |
| 38 s até “…material poroso.” | 11,96–14 s: a mancha cresce devagar (0,34×) |
| 44 s, “Mas agora vem…” | 14 s: parado |
| 46,74 s, “Vamos observar o torrão de solo.” | 14–14,87 s: o frasco vai para o torrão |
| 48,6 s, “Assim como a esponja…” | 14,87 s: parado, antes de a gota se formar |
| 52,06 s até “Isso mostra…” | 14,87–19 s: velocidade normal; a mancha começa em “Quando a água entra no torrão…” (53,02 s) |
| 56,3 s a 60,3 s | 19–23 s: o frasco volta; último quadro, parado até o fim |

A absorção da esponja fica mais lenta e o torrão corre em velocidade normal, o que preserva o contraste
do roteiro (esponja lenta, torrão rápido). O script `narracao_modulo06.py` (fora do repositório)
recusa qualquer pausa com gota no ar ou respingo visível, lendo a escala de cada gota no próprio GLB.

**Primeiro quadro das cenas animadas (correção).** `animatedFrame` chamava `root.syncHierarchy()` com
os pais ainda pendentes; o modelo guardava a transformação antiga e o primeiro desenho saía sem a
rotação inicial do pivô (de lado, com a bandeja parecendo vazia). Com o clipe parado não há segundo
desenho, então o erro durava até a animação começar: 17 s neste módulo e 24,7 s no módulo 04, que tinha
o mesmo problema. `root.getWorldTransform()` antes do laço resolve os dois.

**Limites:** os tempos da água são ilustrativos, não medidos (ver o README do acervo). O GLB é o maior
da exposição (12,7 MB, contra 6,2 MB do módulo 04) e não foi otimizado. A narração não fala em
“absorção lenta” como o roteiro; o contraste fica na animação.

### Módulo 07 · Ar no Solo

Nas duas mesas em frente aos painéis do campo ficam os frascos pequenos, o pote branco, o pote “SOLO SEM
OXIGÊNIO” e o vaso “SOLO COM OXIGÊNIO”. Um volume (`ar-no-solo`, ≈ 112 × 50 × 62 cm, centro em
(0,89; 1,05; −0,78), girado 180° em Y como o da porosidade) cobre as duas mesas e foi conferido com
`?debugInteractions=1`.

É um **acervo de grupo único**, como o módulo 05: abre direto no menu, com os três itens na ordem do
roteiro (“Torrão de solo dentro da água”, “Planta no solo com oxigênio”, “Planta no solo sem
oxigênio”), com faixa de miniaturas e setas para ir de um ao outro. **O roteiro não tem texto geral:**
`overview` passou a ser opcional em `InspectionCatalog`; sem ele, o menu não tem painel de descrição
nem narração, e **I** e **N** não fazem nada.

A gravação (`arplantas.aac`, 112,2 s) foi cortada nos três itens, sem recodificar (cópia AAC → M4A),
deixando de fora os títulos lidos: 36,25 s, 29,93 s e 32,79 s, cada um com menos de 250 kB. O texto do
painel vem do roteiro enviado.

**Modelos.** As plantas são cópias sem alteração do acervo (2,4 e 2,2 MB), vistas de cima e giradas
15° para as etiquetas ficarem legíveis. O do torrão é um **derivado** (`public/models/inspection/ar/`,
9,2 MB, um clipe de 14 s a 24 q/s): geometria e animação são idênticas às do acervo, e mudam só a cor e
a opacidade dos materiais transparentes, feitos para o render sobre fundo escuro. Em WebGL, sobre o
museu escurecido e sem refração, o frasco quase sumia e o torrão parecia solto no ar.

- **Vidro, bolhas e turvação:** o alfa vem da textura e o fator do glTF não passa de 1, então os PNGs
  foram regravados com o alfa multiplicado por 2,2 a 3,0.
- **Água:** ganhou azul claro e opacidade de 0,13. É uma escolha didática, como no módulo 06.
- **Turvação:** puxa para o marrom; só com a textura ela saía bege e escondia o monte de terra.

**Materiais transparentes não fazem mais sombra (vale para todos os módulos).** O mapa de sombras não
considera o alfa: vidro, água e bolhas escureciam tudo dentro do frasco como se fossem opacos, e o
torrão ficava quase preto. `show` em `inspectionViewer.ts` desliga `castShadow` nas malhas com
`blendType` diferente de `BLEND_NONE`. Só os GLBs dos módulos 04, 05 (copos), 06 e 07 têm material
transparente; nos módulos 01, 02 e 03 nada muda. As caixas com transparência controlada pelo visitante
não são atingidas, porque voltam a ser opacas antes de cada `show` (`clearCurrent`). Conferido no pote
do módulo 04, no copo “Arenoso” do módulo 05 e na bandeja do módulo 06.

**Animação conduzida pela narração** (`animation.sync`, só no torrão), medida nos tempos reais do clipe:

| Narração | Clipe |
|---|---|
| até 4,83 s (“Você acha…”) | parado no primeiro quadro, torrão acima do frasco |
| 4,83 s, “Agora, observe…” até logo antes de “água” (8,02 s) | 0–0,75 s: parado (nada se move antes de 0,75 s) |
| 8,02 a 8,13 s | 0,75–0,86 s: queda, entrando na água na palavra “água” |
| 8,13 s até “…em forma de bolhas” (24,27 s) | 0,86–11,7 s: bolhas e desmanche, sem pausa (0,67×) |
| 24,27 a 26,57 s | 11,7–14 s: turvação em velocidade real; último quadro, parado até o fim |

Há bolhas no ar de 0,96 s a 11,75 s do clipe; por isso nenhum trecho desse intervalo fica parado. Ao
voltar a um item já ouvido, o modelo mostra o último quadro e a narração só toca de novo pelo ▶ ou **N**.

**Rótulos de navegação (correção).** Os botões diziam sempre “Próxima…” e “Ir para a…”, o que nos
módulos 04, 05, 06 e 07 dava “Próxima item” e “Ir para a experimento”. `stepLabels.ts` concorda com o
nome do passo. **Títulos no menu (correção):** o cartão cortava o título em uma linha, e no celular as
duas plantas ficavam “Planta no solo com oxi…”; agora usa até duas linhas.

**Limites:** os tempos e a aparência das bolhas e da turvação são ilustrativos, não medidos. O azul da
água e o reforço do alfa são escolhas para o WebGL e não vêm do acervo. As bolhas correm a 0,67× da
velocidade do clipe para acompanhar a fala.

**Limite do módulo 04:** o modelo não traz a amostra de magnetita da caixinha (“Primeiro, observe a
magnetita…”); nesse trecho o experimento fica parado no primeiro quadro. Escala das bandejas: o
acervo partiu da tampa de 73 mm (hipótese, 24,8 × 40,9 cm por bandeja); no splat cada bandeja mede
≈ 21 × 34 cm. Na inspeção o modelo é enquadrado pelo próprio tamanho, então isso não aparece.

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
- **Textos:** `overview` no conjunto (aba Introdução) e `description` em cada item (aba da
  etapa); parágrafos separados por uma linha em branco. Frases de até 64 caracteres terminadas em
  “?”, “!” ou “...” ficam em destaque. Na maquete, cada estágio tem sua frase em
  `markers[].description` (lista exibida depois de `description`) e o fechamento fica em
  `closing`. Os textos atuais são o roteiro da equipe (2026), sem alteração.
- **Narração:** `overviewNarration` no conjunto e `narration` em cada item, com
  `{ audioUrl, cues }`. `cues` = início (s) de cada bloco do texto na ordem do painel (parágrafos de
  `description`, estágios de `markers`, parágrafos de `closing`); o teste confere que há um por
  bloco. Sem `narration`, o botão não aparece. Áudios estáticos em `public/audio/…` (sem serviços
  pagos de voz).
- **Rótulos da maquete:** `markers` (`node` = nome do nó no GLB, `label` = texto,
  `description` = frase do estágio no painel).
- **Caixa que some ao clicar:** `container: { node }` (nome do nó do recipiente no GLB). Use em
  todo item cujo conteúdo é uma peça sólida (rochas, fragmentos); não use com material solto
  (terra, solo, areia) nem em peças sem caixa (ex.: a maquete).
- **Miniatura:** `thumbnail`. Para gerar de novo, abra a inspeção em desenvolvimento, vá à etapa e
  rode no console `__SOLOS_INSPECTION__.snapshot()` (PNG do quadro atual, fundo transparente);
  recorte, deixe quadrada, reduza para 192 px e salve em WebP.
- **Rótulo do indicador:** `label` do volume em `interactions.json`.
- **Acervos com menu (módulo 02):** `InspectionCatalog` (`overview`, `overviewNarration`,
  `stepNoun` e `groups`, cada grupo com `overview`, `overviewNarration` e `items`). O recipiente
  pode ter vários nós: `container: { nodes: [...] }` (bandeja de cinco peças + etiqueta).

### Adicionar uma nova estante

1. Copie os GLBs para `public/models/inspection/` (nomes em minúsculas, sem espaços).
2. Crie um `InspectionSet` (id, título e itens; tipos em `inspection.ts`) num arquivo de
   `src/data/` e inclua-o em `INSPECTION_SETS` (`inspectionSets.ts`); para um acervo com grupos e
   menu, crie um `InspectionCatalog` e inclua-o em `INSPECTION_CATALOGS`. GLB com animação: dê ao
   item `animation.sync` para o clipe seguir a narração.
3. Gere as miniaturas (acima) em `public/models/inspection/thumbs/`.
4. Em `interactions.json`, acrescente um volume por objeto com `setId` igual ao id do conjunto e
   `order` na sequência; calibre com `?debugInteractions=1`. Se outro móvel puder ser visto
   através de uma lateral, acrescente um bloqueador em `occluders`.
5. Rode `npm test` (ids, ordem, arquivos, tamanhos, caixas e miniaturas) e confira no navegador.

Os testes de dados conferem o conjunto `formacao-do-solo` (ordens 1–4) e o acervo
`material-de-origem` (três faixas da estante, 7 + 5 + 8 rochas); ajuste-os ao acrescentar outros.

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
│   ├── inspection/*.glb           # módulo 01: caixas 1–3 e maquete
│   ├── inspection/rochas/*.glb    # módulo 02: 20 rochas (versões web)
│   ├── inspection/horizontes/*.glb # módulo 03: horizontes O, A, B, C e camada R
│   ├── inspection/ima/*.glb       # módulo 04: experimento do ímã (animado)
│   ├── inspection/textura/*.glb   # módulo 05: placa, três copos e banner (derivado das fotos)
│   ├── inspection/porosidade/*.glb # módulo 06: experimento da porosidade (animado, derivado do acervo)
│   ├── inspection/ar/*.glb        # módulo 07: torrão na água (animado, derivado) e duas plantas
│   └── inspection/thumbs/*.webp   # miniaturas
├── public/audio/inspection/       # narrações (M4A) por módulo
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
│   │   │   ├── InspectionOverlay.tsx     # sobreposição, cabeçalho, navegação, legenda e atalhos
│   │   │   ├── InspectionDescription.tsx # painel de texto e narração
│   │   │   ├── InspectionMenuGrid.tsx    # cartões dos grupos e das peças (módulo 02)
│   │   │   └── useInspection.ts          # estado: sequência ou menus do acervo
│   │   ├── dev/CameraCalibration.tsx
│   │   └── ui/                    # carregamento, erro, ajuda, joystick, controles
│   ├── data/
│   │   ├── collision.json         # escala e parâmetros de colisão (script + app)
│   │   ├── visit.ts               # entrada, velocidades, convenções
│   │   ├── quality.ts             # modos de qualidade (escala de resolução)
│   │   ├── experience.ts          # modelo e Experience Settings v2
│   │   ├── interactions.json      # volumes de interação (calibrados)
│   │   ├── interactions.ts        # tipos e serialização dos volumes
│   │   ├── inspection.ts          # tipos; módulo 01 (Formação do Solo)
│   │   ├── atracaoDoIma.ts        # módulo 04 (gerado a partir do texto, da gravação e do acervo)
│   │   ├── porosidadeDoSolo.ts    # módulo 06 (gerado a partir da gravação e do acervo)
│   │   ├── inspectionSets.ts      # conjuntos sem menu (módulos 01, 04 e 06)
│   │   ├── materialDeOrigem.ts    # módulo 02 (gerado a partir do roteiro e do acervo)
│   │   ├── horizontesDoSolo.ts    # módulo 03 (gerado a partir da gravação e do acervo)
│   │   ├── texturaDoSolo.ts       # módulo 05 (gerado a partir do roteiro e do acervo)
│   │   ├── arNoSolo.ts            # módulo 07 (gerado a partir do roteiro, da gravação e do acervo)
│   │   └── inspectionCatalogs.ts  # acervos com menu
│   ├── lib/interaction/
│   │   ├── geometry.ts            # raio × caixa, frente, projeção e contorno (testado)
│   │   └── interactionManager.ts  # alvo, distância, destaque SVG e modo de calibração
│   ├── lib/inspection/
│   │   ├── inspectionViewer.ts    # visualizador PlayCanvas do objeto
│   │   ├── animationSync.ts       # narração → instante do clipe (testado)
│   │   └── stepLabels.ts          # “Próximo item”, “Próxima etapa”: concordância dos rótulos (testado)
│   └── lib/viewer/
│       ├── sceneScale.ts          # escala uniforme em runtime
│       ├── walkLock.ts            # bloqueio de modos, atalhos e gestos
│       ├── detailZoom.ts          # zoom de detalhes no botão direito do mouse
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
`geometry.ts` diretamente): **19 de 19 passaram** em 5/11/2026. Cobrem raio × volume (acerto, erro,
mais próximo, de dentro), bloqueador na frente e atrás do volume, rotação dos eixos, frente e cone
de 70°, distância, contorno projetado (e volume atrás da câmera), casco convexo, consistência entre
`interactions.json` e `inspection.ts`, existência, tamanho e cabeçalho glTF dos quatro GLBs, nós
das caixas presentes nos GLBs (com conteúdo fora delas; só as caixas de rocha), miniaturas WebP
textos (introdução, as quatro etapas e os quatro estágios da maquete preenchidos) e narração
(cinco arquivos MP4 presentes, um `cue` por bloco do texto, em ordem crescente) e, no módulo 02,
os três grupos (7/5/8 rochas, 20 ids únicos), cada GLB web (existe, tamanho cadastrado, glTF,
< 6 MB), nós da bandeja e da etiqueta presentes com a rocha fora deles, miniaturas WebP e as 24
narrações (MP4, um `cue` por parágrafo) e as três faixas da estante em ordem de altura; no
módulo 03, grupo único, as cinco amostras na ordem do perfil, GLBs, miniaturas, seis narrações,
o volume da mesa à frente da estante e a caixa só na Camada R (com as pedras fora dela); no
módulo 04, um item só, GLB com um clipe e sem extensões, nós das placas, do disco e dos potes,
narração com um `cue` por parágrafo, sincronia começando em “Na primeira…” (0 s) e “Mas observe…”
(7 s) e terminando no último quadro do clipe, o volume à direita da mesa dos horizontes e a função
de sincronia (parada antes, interpolada, parada no último quadro, narração já ouvida); no
módulo 05, grupo único, os cinco itens em ordem, sem recipiente, GLBs, miniaturas, seis narrações,
o banner com uma imagem e `KHR_materials_unlit` e o volume da mesa da janela voltado para −X. `tsc`,
`lint` e `build` sem erros.

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
| 18 | Descrição no computador (janela ≈ 980×850) | ✔ painel à direita abre na Introdução; “Ir para a etapa 1” troca de aba; miniatura 4 leva à maquete com a lista dos estágios (rola); **I** fecha e o modelo volta ao centro, **I** reabre |
| 19 | Descrição no celular em pé (emulação 375×812) | ✔ abre recolhida, com o ponto amarelo; **Ler** expande (o modelo continua visível acima); sem rolagem horizontal |
| 20 | Descrição no celular deitado (emulação 812×375) e tablet (768×1024) | ✔ deitado: painel à direita e controles compactos, modelo visível; tablet: gaveta aberta acima dos controles |
| 21 | Descrição em monitor 16:9 (emulação 1920×1080) e 1280×800 | ✔ 1920: modelo e controles no centro, painel maior à direita sem cobri-los; 1280: o modelo passa para a esquerda do painel |
| 22 | Narração | ✔ ▶ na Introdução toca e destaca o parágrafo falado (aos 5 s, “Tudo começa…”); “Ir para a etapa 1” continua narrando a Caixa 1; na maquete, o estágio A + R acende na lista e sobre o modelo; **N** pausa; no celular (emulação), o botão cabe na barra da gaveta |

Módulo 02 e narração automática, no mesmo painel (800×727 e emulação 375×812), em 5/11/2026:

| # | Teste | Resultado |
| --- | --- | --- |
| 23 | Volumes das três prateleiras (`?debugInteractions=1`) | ✔ cada faixa cobre a sua fileira de bandejas (ígneas, metamórficas, sedimentares) |
| 24 | Clique na fileira abre o menu dos grupos | ✔ três cartões com mosaico (+2 / +3 nas ígneas e metamórficas; nas sedimentares, 5 ladrilhos sem vazio); narração geral tocando sozinha, primeiro parágrafo destacado |
| 25 | Grupo → rochas → rocha | ✔ Rochas ígneas: 7 cartões, narração do grupo sozinha; Granito: modelo 3D, aba “Rocha 1”, “01 / 07”, “Próxima rocha”, 7 miniaturas, narração da rocha sozinha |
| 26 | Bandeja some | ✔ clique na bandeja esconde as cinco peças e a etiqueta, rocha reenquadrada |
| 27 | Legenda | ✔ com o painel oculto, a frase falada aparece acima dos controles (“Repare nos pequenos minerais de cores diferentes!”); também nos menus |
| 28 | Voltar | ✔ **Esc** na rocha volta às rochas do grupo, de novo volta aos grupos |
| 29 | Celular (emulação 375×812) | ✔ botão **Inspecionar** na fileira; grupos em lista; 8 metamórficas em grade de 2 colunas; Gnaisse com 8 miniaturas sem nome, gaveta recolhida e legenda acima dela |
| 31 | Narração só na primeira vez | ✔ grupos (toca) → ígneas (toca) → Esc: grupos parados no ▶, nenhum parágrafo destacado; ígneas de novo: parado; Basalto amigdaloide (toca) → Esc → de novo: parado; ▶ toca normalmente |
| 32 | Volume da mesa (`?debugInteractions=1`) | ✔ a caixa ciano cobre as cinco caixas O–R sobre a mesa |
| 33 | Clique na mesa abre o menu das amostras | ✔ “Escolha uma amostra · Horizontes do Solo”, cinco cartões, sem botão de voltar; narração geral tocando sozinha |
| 34 | Amostras | ✔ Camada R: “Amostra 5”, “05 / 05”, fechamento depois do texto, caixa e etiqueta somem ao clicar; Horizonte A pela miniatura: sem a dica da caixa, “Ele é formado…” destacado no tempo certo |
| 35 | Voltar e fechar | ✔ **Esc** na amostra volta ao menu (narração geral já ouvida fica no ▶); **Esc** no menu fecha |
| 36 | Volume da mesa do ímã | ✔ o contorno cobre bandejas, potes e a caixinha da magnetita; “Inspecionar · Atração do solo pelo ímã” |
| 37 | Abertura | ✔ “Atração do Solo pelo Ímã · Solo sem e com magnetita”, aba “Experimento”, sem contador, setas nem faixa; narração tocando sozinha |
| 38 | Animação com a narração | ✔ narração tocando: clipe em 13,8 s quando a fala chegava a “Isso acontece porque…” e em 15,96 s logo depois, parado (disco na placa com ímã, solo no fundo da outra bandeja). Forçando o relógio da narração: 5 s → primeiro quadro (potes fechados), 28,2 s → solo sem magnetita escorrendo pela placa, 35,3 s → disco se formando na placa com ímã |
| 39 | Reabrir | ✔ sem tocar sozinha (▶) e direto no último quadro; ▶ volta o clipe a 0 s |
| 40 | Volume da mesa da janela (`?debugInteractions=1`) | ✔ o volume cobre a caixa da placa e as três bandejas; ao mirar, o contorno amarelo envolve a mesa |
| 41 | Abertura | ✔ “Escolha um item · Textura do Solo”, cinco cartões (placa, arenoso, siltoso, argiloso, banner), narração geral tocando sozinha |
| 42 | Itens | ✔ placa em pé, cascalho em cima e argila embaixo, etiquetas legíveis; copo arenoso de três quartos com a etiqueta à frente; banner de frente, legível; cada um com a narração e o destaque do parágrafo |
| 43 | Voltar e fechar | ✔ **Esc** no item volta ao menu; **Esc** no menu fecha; sem erros no console |
| 44 | Volume da mesa da porosidade (`?debugInteractions=1`) | ✔ a caixa cobre o tampo, a bandeja, a pisseta, os vasos e o pote branco, em frente ao painel do campo verde; ao mirar, “Inspecionar · Porosidade do solo” |
| 45 | Abertura | ✔ “Porosidade do Solo · Pedra, esponja e torrão”, aba “Experimento”, sem contador, setas nem faixa; narração tocando sozinha; vista de três quartos já no primeiro desenho (corrigido; o módulo 04 também) |
| 46 | Animação com a narração | ✔ narração tocando: 36,25 s → clipe em 10,153 s; 40,27 s → 12,729 s; 51,25 s → 14,87 s (parado sobre o torrão); 53,26 s → 16,056 s; 65,25 s → 23 s, parado (valores iguais aos calculados por `sync`). Forçando o relógio: gotas em queda, filetes e poça visíveis na pedra, gotas paradas e depois mancha na esponja, torrão escurecendo |
| 47 | Reabrir | ✔ sem tocar sozinha (▶) e direto no último quadro, com os três resultados; 0 erros no console ao abrir e fechar normalmente |
| 48 | Celular (emulação 375 × 812) | ✔ o toque em “Inspecionar” abre o experimento; legenda e botão “Ler” no lugar do painel; a bandeja fica menor, com a água ainda visível |
| 49 | Descrição oculta ao abrir | ✔ sem painel na abertura, com narração e legenda; o botão do livro abre o painel no trecho falado, e o **X** ou **I** fecha; aberto, continua aberto ao trocar de item e ao voltar ao menu; ao reabrir a inspeção, oculto de novo; no menu, a legenda não cobre os cartões; em 375 × 812, a gaveta começa recolhida e abre pelo **Ler** no trecho falado |
| 50 | Zoom de detalhes (eventos simulados; botão direito real só em clique rápido) | ✔ FOV de 90° para 43,6° em cerca de 0,2 s e de volta ao soltar; olhar cai de 11,2° para 5,4° com o mesmo movimento; sem menu de contexto; funciona com o botão esquerdo já pressionado; encerra ao perder o foco ou se o botão for solto fora da janela; não dispara com toque nem sobre os botões da interface; a ajuda encerra e impede o zoom; captura simulada: entra ao apertar e sai ao soltar, e fica se o visitante andou ou se já estava capturado |
| 51 | Volume e menu do Ar no Solo | ✔ a caixa cobre as duas mesas; ao mirar, “Inspecionar · Ar no solo”; o menu abre com os três cartões na ordem do roteiro, sem painel nem narração, e **I** e **N** não fazem nada |
| 52 | Torrão com a narração | ✔ narração tocando: 5,98 s → clipe em 0,268 s; 9,97 s → 2,088 s; 20,01 s → 8,833 s; 24,00 s → 11,512 s; 28,02 s → 14 s, parado (valores iguais aos calculados por `sync`). Forçando o relógio: impacto em 8,13 s, afundando com bolhas em 11,5 s, fragmentos em 20 s, água turva no fim |
| 53 | Voltar ao item ouvido | ✔ sem tocar sozinho e no último quadro (14 s); **N** toca de novo do primeiro quadro, com o torrão inteiro acima do frasco, sem cobrir o título |
| 54 | Plantas | ✔ as etiquetas “SOLO COM OXIGÊNIO” e “SOLO SEM OXIGÊNIO” ficam legíveis; a descrição abre pelo livro ou por **I**, com o trecho falado destacado |
| 55 | Celular (emulação 375 × 812) | ✔ menu em duas colunas, com o título em duas linhas (corrigido); torrão e planta enquadrados, sem cobrir o título; gaveta recolhida que abre pelo **Ler** no trecho falado |
| 56 | Sombra sem materiais transparentes, em outros módulos | ✔ pote do módulo 04, copo “Arenoso” do módulo 05 e bandeja do módulo 06 sem escurecer; caixa do Horizonte B com todas as sombras (GLB sem transparência); botão “Próximo item” com o rótulo certo |
| 30 | Módulo 01 depois da mudança | ✔ abre na Introdução com a narração tocando sozinha; sem a linha “Arraste para girar…”; sem erros no console |

Não verificado na inspeção: o som da narração (não foi ouvido durante os testes; a reprodução
foi confirmada pelo andamento do tempo, do anel de progresso, dos destaques e da legenda), o
início automático num celular real (iOS pode exigir o toque no ▶), todas as 20 rochas uma a uma
no navegador (foram abertas Granito e Gnaisse; as demais, conferidas pelo teste automático),
os módulos 03, 04 e 05 no celular (os componentes são os mesmos do módulo 02, testado em emulação;
o clipe do módulo 04 desenha 1 800 grãos durante o despejo, sem medida de desempenho em aparelho
fraco), os módulos 06 e 07 num celular real (GLBs de 12,7 MB e 9,2 MB, sem medida de tempo de carga nem de memória),
fechar a inspeção enquanto o GLB ainda carrega (a visita continua normal, mas o motor registra um
erro por imagem no console, porque o app foi destruído; não corrigido),
aparência num celular real
(sombras e IBL dependem da GPU),
**E** com o mouse realmente capturado (o painel de testes recusa o
pointer lock; a mira central foi validada com o cursor livre e no toque), toque real com pinça
(apenas emulação, sem gestos multitoque), preferência de movimento reduzido, Safari/iOS e
desempenho em aparelhos de entrada.

### Visita (etapa 2)

Não verificado: captura real do mouse em um navegador comum, inclusive olhar em volta durante o zoom de detalhes (o painel de testes não permite pointer lock; o fluxo foi validado com a API simulada), aparelho físico com toque real (apenas emulação), Safari/iOS, desempenho em
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
- Inspeção: os destaques da narração seguem o início de cada parágrafo (não palavra por palavra);
  a troca de frase na legenda é estimada pelo tamanho das frases e pode adiantar ou atrasar um
  pouco.
- Módulo 02: as 20 rochas somam 68 MB; cada uma só é baixada ao ser aberta (ou ao passar o cursor
  no cartão), mas a primeira abertura de cada rocha depende da conexão.

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

- Demais estantes da exposição como novos conjuntos de inspeção.
- Percursos guiados.
- Imagem de pôster durante o carregamento (`posterUrl`).
- Testes em aparelhos reais e medição de desempenho de referência.

---

## Créditos

Visualização baseada no [SuperSplat Viewer](https://github.com/playcanvas/supersplat-viewer) e no
[PlayCanvas Engine](https://github.com/playcanvas/engine), ambos sob licença MIT. Colisão gerada
com o [SplatTransform](https://github.com/playcanvas/splat-transform) (MIT).
