# LOD espacial e streaming progressivo do Gaussian (Streamed SOG)

Branch experimental `feature/gaussian-streamed-sog-lod`. A produção (`main`) continua com o SOG de
arquivo único `public/models/museu_web.sog`, que segue publicado e intacto.

Este documento separa **fatos medidos** (com o comando ou a ferramenta que os produziu) de
**estimativas e hipóteses**. Nada aqui é ganho de desempenho declarado sem medição.

---

## 1. Problema

A exposição usava um único SOG de 45,7 MB com 2.994.965 gaussianas. O visitante só podia entrar
depois do download inteiro, e o motor desenhava sempre todas as gaussianas, perto ou longe. Em
celulares e computadores fracos, o resultado era uma espera longa e uma taxa de quadros baixa.

O objetivo foi trocar esse arquivo por um **Streamed SOG**, formato oficial do PlayCanvas: a cena é
dividida em blocos espaciais, cada um em quatro níveis de detalhe (LOD). O motor baixa primeiro a
versão mais leve da sala inteira e depois refina os blocos mais próximos do visitante, dentro de um
**orçamento de gaussianas**.

## 2. Proveniência do LOD 0 (o nível mais fino)

O SOG publicado foi exportado do SuperSplat com correções manuais (seleções e ajustes), então não
dava para presumir que `Output60k.ply`, o PLY do treino, equivalesse a ele. Verificação feita:

| Fonte | Gaussianas | Observação |
|---|---:|---|
| `Output60k.ply` (= `splat.ply` do checkpoint 60k) | 2.995.006 | 41 a mais que o SOG publicado; outra orientação |
| `output60k.ssproj` → `resource_0.ply` | 2.994.965 | mesma contagem do SOG publicado |
| `museu_web.sog` (publicado) | 2.994.965 | referência |

- O `.ssproj` é um ZIP com `document.json`, `resource_0.ply` e `instances_0.bin`. O relatório de
  estado (`scripts/lod/extract-ssproj.mjs`) mostra 0 gaussianas apagadas e 0 travadas, além de
  43.664 selecionadas, o que não altera a exportação. O `document.json` registra rotação de 180° em
  Z e escala 1; o viewer aplica a mesma rotação aos dois formatos.
- Comparação gaussiana a gaussiana (`scripts/lod/compare-sources.py`): o `resource_0.ply` girado em
  −90° no eixo X e o `museu_web.sog` decodificado, numa amostra de 300 mil gaussianas, com vizinho
  mais próximo:
  - distância mediana de 0,09 mm, p99 de 0,2 mm e máxima de 2,7 mm, em unidades do arquivo
    convertidas para metros pela `SCENE_SCALE` 5,4;
  - 99,99 % das gaussianas a menos de 1 mm;
  - diferença mediana de cor DC de 0,0033, que corresponde ao erro de quantização do SOG.

**Conclusão (medida):** o LOD 0 é o `resource_0.ply` do projeto SuperSplat com rotação de −90° em
X. Ele preserva as correções do SuperSplat e o mesmo espaço de coordenadas do SOG publicado. Por
isso a escala da cena, a colisão, a entrada e os volumes de interação valem sem nenhum ajuste.

Arquivos para a dissertação: `processo/lod-streaming/04_fidelidade_lod0_x_sog_publicado.json` e
`05_relatorio_ssproj.json`.

## 3. Geração dos níveis

Ferramenta: `@playcanvas/splat-transform` 3.11.2 (CLI oficial). Os níveis são cópias reduzidas da
cena inteira:

| Nível | Fração | Gaussianas | Tempo de decimação (medido) |
|---|---:|---:|---:|
| LOD 0 | 100 % | 2.994.965 | — |
| LOD 1 | 50 % | 1.497.483 | 30 s |
| LOD 2 | 25 % | 748.741 | 43 s |
| LOD 3 | 10 % | 299.497 | 45 s |

### Decimação uniforme × adaptativa

As duas opções do SplatTransform foram geradas e renderizadas pelo próprio renderizador da
ferramenta em duas vistas fixas. O PSNR foi calculado contra o LOD 0 (maior é melhor):

| Vista | Modo | LOD 1 | LOD 2 | LOD 3 |
|---|---|---:|---:|---:|
| visão geral | uniforme (`-d`) | **36,21** | **32,26** | **29,03** |
| visão geral | adaptativa (`--decimate-adaptive`) | 33,83 | 30,07 | 26,93 |
| painéis do fundo | uniforme | **38,84** | **31,84** | **28,91** |
| painéis do fundo | adaptativa | 36,63 | 30,64 | 28,00 |

Os tempos da adaptativa foram 49 s, 63 s e 145 s. **Decisão: uniforme.** Nesta cena, ela venceu em
todas as vistas e níveis, com 0,9 a 2,4 dB a mais, e foi mais rápida. As imagens lado a lado estão
em `processo/lod-streaming/01_…png` e `02_…png`.

Limitação: são duas vistas e uma métrica (PSNR). Não houve avaliação perceptual com usuários.

## 4. Particionamento espacial e empacotamento

```
splat-transform -w --lod-chunk-count 64 --lod-chunk-extent 1 --lod-chunk-min 8 \
  --lod-file-count 256,256,256,512 --sog-version 2 \
  lod0.ply -l 0 lod1.ply -l 1 lod2.ply -l 2 lod3.ply -l 3 lod-meta.json --filter-nan
```

| Parâmetro | Valor | Justificativa |
|---|---|---|
| `--lod-chunk-count` | 64 (mil) | Cada nó (a unidade de decisão de LOD) tem cerca de 64 mil gaussianas no LOD 0, o que dá 178 nós na sala. Com nós maiores, o refinamento perto do visitante desperdiçaria orçamento em regiões distantes do mesmo nó. Com nós menores, haveria mais trocas e mais costuras visíveis. |
| `--lod-chunk-extent` | 1 | A ferramenta só aceita inteiros. 1 unidade do arquivo equivale a 5,4 m na exposição. Quem divide o espaço na prática é a contagem; o extent só impede nós maiores que isso. Escalar o arquivo para usar um extent menor mudaria as coordenadas e foi descartado. |
| `--lod-chunk-min` | 8 (mil) | É o padrão da ferramenta. Evita nós minúsculos nas bordas da cena. |
| `--lod-file-count` | 256, 256, 256, 512 (mil) | Ver abaixo. |
| `--sog-version` | 2 | Ver abaixo. |

### Tamanho do arquivo e paleta SH (medido)

O primeiro teste usou 64 mil gaussianas por arquivo. Saíram 81 arquivos e **258 MB**, 5,6 vezes o
SOG único. A causa, confirmada no código da ferramenta, é que cada arquivo recebe a própria paleta de
harmônicos esféricos (`shN_centroids.webp`), com tamanho min(64 K, 2^⌊log2(N/1024)⌋ K). Com 64 mil
gaussianas por arquivo, cada um carregava uma paleta de 65.536 entradas (~2,5 MB). A opção
`--sh-palette-size` não é repassada à saída LOD (`writeLodSource`). Com arquivos de 256 mil
gaussianas, ou 512 mil no LOD 3, a paleta passa a ser dividida por mais gaussianas e o conjunto cai
para 126 MB em v3, ou 133 MB em v2 (a versão publicada, ver abaixo), sem modificar a ferramenta oficial.

### Versão do formato SOG (problema encontrado no navegador)

O SplatTransform 3.x grava SOG **v3** por padrão. O PlayCanvas 2.23.3, embutido no
`@playcanvas/supersplat-viewer` 1.42, só lê a **v2**: com v3, o parser falha em `loadTextures`
(`Cannot read properties of undefined (reading '0')`) e o carregamento trava em 0 %. A opção oficial
`--sog-version 2` resolve. Ela só descarta o que esta cena não usa: opacidade acima de 1, dados
extras ("blind") e a 4ª banda SH. A exceção também revelou que um erro dentro do parser do motor não
chega como evento de erro do asset. Por isso o `GaussianViewer` passou a tratar promessas rejeitadas
sem dono durante o carregamento do streamed como falha, o que dispara o recuo para o SOG único.

### Resultado publicado

| Item | Valor (medido) |
|---|---|
| Pasta | `public/models/museu_streamed/<hash>/` (hash sha256 do conteúdo, 10 caracteres) |
| Nós (folhas da octree) | 178 |
| Arquivos por LOD (0..3) | 11 / 6 / 3 / 1 |
| Bytes por LOD (0..3) | 71,6 / 36,5 / 18,1 / 6,7 MB |
| Total | 133,0 MB (`totalBytes` em `src/data/streamedSplat.json`), contra 45,7 MB do SOG único |
| Maior arquivo | 6,7 MB |
| Tempo de geração | 7 min 35 s (CPU de pico 2 GB) |
| `lod-meta.json` | ~69 KB |

O total maior que o SOG único é esperado: o conjunto guarda a cena quatro vezes (100 + 50 + 25 +
10 % = 185 % das gaussianas), mais as paletas por arquivo. **O visitante nunca baixa tudo.** Baixa o
LOD 3 da sala inteira (um arquivo, ~6,7 MB) e depois só os blocos que o orçamento e a distância
pedem. Os bytes realmente transferidos em cada modo estão na seção 9: com orçamentos altos o total passa do SOG único.

## 5. Integração no viewer

- `src/data/splatSources.ts`: as duas fontes (`streamed` e `legacy`) e o manifesto gerado.
- `GaussianViewer.tsx`:
  - No streamed, não há `fetch` próprio. O viewer 1.42 reconhece `lod-meta.json` e baixa o índice
    pelo parser de octree do motor, que ignora um `contents` pré-carregado. Buscar o índice no app
    seria um download a mais.
  - Cancelamento: a destruição do viewer cancela os blocos pendentes. O SOG único continua com
    `AbortController`.
  - StrictMode: a criação continua adiada com `setTimeout(0)` e encadeada ao desmonte anterior.
  - Erros:
    - índice com HTTP ≥ 400 → `http`;
    - bloco que falha nas 3 tentativas do motor (`maxRetries` 2) → `chunk`, antes de a cena ficar
      pronta;
    - depois de pronta, o bloco é só contado (`chunkFailures`) e a região fica no nível que já
      chegou;
    - exceção no parser → `engine`.
  - Recuo: sem `?splat=` na URL, qualquer erro do streamed antes de a cena ficar pronta troca
    sozinho para o SOG único (exceto erro de colisão, que não depende do Gaussian). Com
    `?splat=streamed`, o erro aparece, para os testes.
- Coordenadas: as mesmas do SOG único (seção 2). `SCENE_SCALE`, a colisão (`collision.glb`), o
  ponto de entrada, o Walk Mode e os volumes de inspeção não mudaram.

### Tela inicial

Os estados vêm do motor, sem percentual artificial:

- "Preparando exposição…";
- "Carregando ambiente inicial…": a porcentagem é a fração de **arquivos** da primeira onda (o
  nível mais grosso), como o viewer informa; no streamed não há megabytes estimados;
- "Preparando navegação…": a colisão;
- "Pronto para visitar.", com o aviso de que os detalhes continuam chegando.

A visita é liberada quando o nível grosso da sala inteira e a colisão estão prontos. O refinamento
continua durante a visita.

## 6. Qualidade gráfica: orçamento, resolução e LOD

`src/data/quality.ts`:

| Modo | Resolução | Orçamento de gaussianas |
|---|---:|---:|
| Automático (recomendado, padrão) | 50–100 % | 350 mil a 3 milhões (seção 7) |
| Alto | 100 % | 3.000.000 |
| Médio | 75 % | 1.500.000 |
| Baixo | 50 % | 750.000 |
| Muito baixo | 25 % | 350.000 |

- **Orçamento** (`app.scene.gsplat.splatBudget`): só tem efeito no streamed, porque o SOG único não
  tem níveis. O viewer 1.42 define o próprio orçamento pela escada interna (computador de 2 a 16 M,
  celular de 1 a 8 M) e o reaplica, e a flag `budget` dele exige recriar o viewer. Por isso
  `pinSplatBudget()` (`src/lib/viewer/splatBudget.ts`) reaplica o valor da exposição a cada
  `frameupdate`. A troca vale no quadro seguinte, sem recriar o viewer.
- **Política de LOD:**
  - `splatBudgetMode: "target"`, o padrão do motor: o refinamento parte dos nós mais próximos da
    câmera até gastar o orçamento, então o detalhe próximo ao visitante vem primeiro;
  - `lodUnderfillLimit: 2`: um nó pode ficar até 2 níveis abaixo do ideal enquanto o nível certo
    não chega, em vez de sumir (evita buracos e reduz popping);
  - mantidos do viewer: `lodBehindPenalty` 5 (o que está atrás do visitante perde prioridade) e
    `lodUpdateAngle` 90.
- **`pinViewerQuality()`**: continua necessário. O modo de desempenho do viewer reduziria a
  resolução por conta própria. A resolução é da exposição, não do viewer.
- **`colorRefresh` (1°)**: preservado. A cor das gaussianas é recalculada a cada 1° de rotação.
- Limitação: o motor só prioriza por distância e direção. Não existe prioridade semântica, como
  "este experimento é importante". Um objeto inspecionado de perto recebe detalhe porque está
  perto, não porque é um objeto.

## 7. Qualidade automática por FPS

Módulo puro e testável: `src/lib/viewer/adaptiveQuality.ts` (controlador) e
`src/components/viewer/useRenderQuality.ts` (ligação ao viewer).

### Medição

- `monitorFrames()` (`frameMonitor.ts`) lê os eventos do laço do motor. Quadros desenhados vêm de
  `postrender`; o tempo de CPU do tick vai de `frameupdate` a `frameend`; o streaming ativo vem de
  carregamentos pendentes do sistema gsplat, até 600 ms depois do último.
- Janela móvel de 4 s com média, p50, p95 e p99 do intervalo entre quadros. Intervalos acima de
  250 ms são descartados (troca de aba, pausa do sistema). São exigidos 2,5 s de amostras.
- A taxa de atualização da tela é estimada pela mediana dos ticks **ociosos**, quando o motor não
  desenhou por estar parado, e arredondada para taxas comuns (30, 60, 75, 90, 120, 144…). Assim, um
  computador lento a 30 FPS não é confundido com uma tela de 30 Hz.
- A avaliação pausa:
  - com a aba em segundo plano;
  - antes de a visita começar;
  - com painéis, menus ou inspeção abertos;
  - por 3 s depois de voltar.
  - Janelas com mais de 50 % do tempo em streaming não contam como lentidão.

### Metas

| Dispositivo | Meta |
|---|---|
| Computador | 60 FPS |
| Celular/tablet | 30 FPS; sobe para 60 se a primeira janela sustentar 92 % de 60 |
| Qualquer | no máximo 98 % da taxa da tela |

### Regras

- **Reduzir:** quando o FPS médio fica abaixo de 85 % da meta por 4 s. O orçamento cai primeiro, um
  degrau da escada: 3 M, 2,2 M, 1,6 M, 1,2 M, 900 mil, 700 mil, 500 mil, 350 mil.
  - A resolução (100, 85, 75, 60 e 50 %) só cai nestes casos:
    - o orçamento já está no mínimo;
    - o orçamento não tem efeito (SOG único);
    - duas reduções seguidas de orçamento renderam menos de 5 % (gargalo de pixels).
- **Aumentar:** depois de 15 s com FPS ≥ 95 % da meta e p95 ≤ 1,35 vez o quadro-alvo.
  - É um **teste**: sobe um único degrau, primeiro a resolução e depois o orçamento, nunca os dois
    juntos.
  - Se o FPS cair em até 6 s, volta. Aquele degrau fica bloqueado por 60 s, prazo que dobra a cada
    nova falha, até 8 min.
- Histerese: 85 % para descer e 95 % para subir. Há 4 s de estabilização depois de cada mudança.
- Os modos manuais nunca são sobrescritos. O último nível estável do automático fica salvo em
  `localStorage` (`solos:auto-quality`) e é retomado na visita seguinte.
- Nível inicial sem histórico: computador com 2,2 M e 100 %; celular e tablet com 700 mil e 75 %.

### Testes simulados (medido: `npm test`)

`tests/adaptiveQuality.test.mjs` simula um dispositivo com custo por gaussiana e por pixel e
quantização por vsync:

1. Computador rápido.
2. Computador lento.
3. Celular rápido.
4. Celular lento.
5. Tela de 30 Hz.
6. Tela de 144 Hz.
7. Queda temporária durante o streaming.
8. Aba em segundo plano.
9. Gargalo de pixels.
10. Oscilação perto do limiar.

Mais quatro casos completam os testes: 7b (aumento desfeito), 8b (estado no teto), toque com
meta 60 e nível salvo. Os 15 testes do controlador passam (79 no total do projeto).

Limitação: são simulações. O comportamento em aparelhos reais precisa do roteiro da seção 9.

## 8. Diagnóstico (A/B e benchmark)

- `?splat=legacy` ou `?splat=streamed` escolhem a fonte. A opção é segura em produção, porque só
  alterna entre arquivos publicados.
- `?diag=1`, só fora da produção (`NEXT_PUBLIC_VERCEL_ENV !== "production"`), mostra o painel
  `SplatDiagnostics`. A tecla P continua mostrando e escondendo o contador.
- O painel mostra:
  - FPS instantâneo e de 5 s, e média, p50, p95 e p99 do quadro;
  - CPU do tick e gaussianas desenhadas (`app.stats.frame.gsplats`);
  - qualidade, orçamento e resolução;
  - estado, meta, taxa da tela, gargalo e última mudança do automático, com o motivo;
  - arquivos e gaussianas residentes e blocos por LOD, lidos do estado interno da octree;
  - blocos abaixo do ideal e perdidos;
  - rede (`/models`, via Resource Timing), heap JS e os tempos até a cena ficar pronta e navegável.
- "Copiar medição" copia um JSON com tudo isso, para a tabela da seção 9.

As métricas de blocos vêm de campos internos do motor (`nodeInfos[].currentLod`). Elas servem para
diagnóstico e podem mudar em outra versão do PlayCanvas.

## 9. Avaliação

### Medido nesta máquina (Windows 11, RTX 3060, Chromium do app, WebGPU)

Condições: build de produção (`next start`) em localhost, no painel de navegador do app Claude
(Chromium, WebGPU), com tela de 60 Hz e GPU NVIDIA RTX 3060, em 2026-11-15. **Localhost não
representa a rede real**: os 128 MB chegam em 1,8 s. Por isso os tempos de carregamento abaixo não
valem como ganho. O que vale é a quantidade de bytes e o comportamento.

**Bytes baixados por modo**, com a câmera parada na entrada, cache vazio para os blocos e leitura
8 s depois de abrir (Resource Timing, soma de `encodedBodySize`):

| Fonte / modo | Orçamento | Arquivos tocados (de 21) | MB baixados |
|---|---:|---:|---:|
| SOG único (`legacy`) | — | 1 | 45,7 |
| Streamed · Muito baixo | 350 mil | 6 | 38,5 |
| Streamed · Baixo | 750 mil | 10 | 63,6 |
| Streamed · Médio | 1,5 M | 14 | 87,6 |
| Streamed · Automático (computador, inicial) | 2,2 M | 20 | 127,7 |
| Streamed · Alto | 3 M | 21 | 132,7 |

Antes da primeira imagem, o streamed baixa só o índice (13 KB) e o LOD 3 inteiro (um arquivo, cerca
de 6,7 MB). O SOG único exige os 45,7 MB. **Esse é o ganho de entrada esperado em rede real, mas ele
ainda precisa ser medido fora do localhost.**

**Resultado negativo, que precisa constar:** com os orçamentos de computador, o streamed baixa
**mais** bytes no total que o SOG único (até 2,9 vezes). Há três causas:

1. Cada arquivo agrupa vários nós (cerca de 256 mil gaussianas). Basta um nó precisar do nível
   para o arquivo inteiro vir junto.
2. Os níveis intermediários também são baixados durante o refinamento, porque `lodUnderfillLimit`
   usa o nível que já chegou enquanto o ideal não chega.
3. Há uma paleta SH por arquivo (seção 4).

Só o "Muito baixo" ficou abaixo do SOG único. O ganho do streamed nesta versão está no **tempo até a
primeira imagem** e no **controle do custo de GPU** pelo orçamento, não no volume total de dados.

**Taxa de quadros**, andando pela sala com o mesmo percurso nas duas fontes (W, ←, W, →; janela de
5 s):

| Fonte | Gaussianas desenhadas | FPS | Quadro p50 / p95 / p99 | CPU do tick |
|---|---:|---:|---:|---:|
| SOG único | 2,99 M | 57,4 | 16,7 / 17,1 / 50,0 ms | 1,0 ms |
| Streamed, automático (2,2 M) | 2,17 M | 57,4 | 16,7 / 17,2 / 50,0 ms | 1,0 ms |

Nesta GPU, as duas fontes ficam presas no vsync de 60 Hz, e **não há diferença de FPS mensurável**.
O controlador classificou o gargalo como "taxa de atualização". A diferença de custo de GPU só deve
aparecer em aparelhos que não alcançam 60 FPS com 3 M de gaussianas, o que ainda precisa ser medido
(roteiro abaixo).

**Comportamento verificado no navegador:**

- O alinhamento do streamed com a colisão, a entrada e o minimapa ficou idêntico ao do SOG único.
- Trocar para "Baixo" durante a visita, sem recarregar, mudou o motor para 718 mil gaussianas
  desenhadas, 50 % de resolução e blocos por LOD 4/9/86/79. Os arquivos residentes caíram de 20
  para 10, porque o motor libera o que saiu do orçamento.
- Com o conjunto removido e sem `?splat=`, o índice falhou (HTTP 500 no `next start`) e a
  exposição recuou sozinha para `museu_web.sog`, ficando pronta para visitar.
- Cabeçalhos: `museu_streamed/<hash>/*` com `max-age=31536000, immutable`; `museu_web.sog` com a
  regra anterior.
- O automático pausa com painéis abertos e, nesta máquina, fica em 2,2 M a 3 M, meta de 59 FPS
  (60 Hz × 0,98).

### Melhorias possíveis (não feitas, a avaliar com medição)

- Arquivos menores no LOD 0 reduzem o excesso por arquivo, mas aumentam o custo das paletas.
- Remover as bandas SH dos níveis distantes (`--filter-bands 0` no LOD 2–3) eliminaria cerca de
  40 % de cada arquivo desses níveis. Isso muda a aparência à distância e exige comparação visual.
- `lodUnderfillLimit` menor evita baixar níveis intermediários, ao custo de buracos ou popping
  durante a chegada.

### Roteiro para os demais dispositivos

Em cada aparelho, abra `?splat=legacy&diag=1` e depois `?splat=streamed&diag=1`, numa aba anônima
para ter o cache vazio. Anote o JSON de "Copiar medição":

| Cenário | Como medir |
|---|---|
| A. Primeira visita, cache vazio | "cena pronta" e "navegável" e bytes de `/models` no painel |
| B. Segunda visita, cache cheio | idem; `do cache` deve cobrir os blocos |
| C. Parado na entrada, 30 s | FPS e p95, gaussianas desenhadas, blocos por LOD |
| D. Andando pela sala, 60 s | FPS e p95, blocos abaixo do ideal (popping) |
| E. Inspeção de perto | detalhe do objeto (captura), FPS |
| F. Cada modo manual | FPS, gaussianas desenhadas, resolução |
| G. Automático, 2 min | estado, nível final, número de mudanças |
| H. Rede lenta (DevTools "Fast 4G") | tempo até navegável, bytes |

Ainda não testado: celulares Android e iPhone, tablets, notebooks com GPU integrada e Safari.

## 10. Cache e versionamento (Vercel)

- `next.config.ts`: `/models/museu_streamed/:version/*` com
  `Cache-Control: public, max-age=31536000, immutable`. O caminho contém o hash do conteúdo, então
  nunca recebe conteúdo novo, e um navegador nunca mistura blocos de versões diferentes.
- `museu_web.sog` mantém a regra anterior: 1 dia, com revalidação em segundo plano por 7.
- Uma nova geração cria outra pasta e outro manifesto. As pastas antigas são removidas à mão depois
  da confirmação.
- Tamanho no repositório: o conjunto (133 MB, maior arquivo com 6,7 MB) cabe nos limites do Git
  e da Vercel para arquivos estáticos, mas aumenta o clone. Nenhum PLY ou checkpoint foi commitado.

## 11. Limitações

1. `--lod-chunk-extent` só aceita inteiros (1 = 5,4 m nesta cena).
2. A paleta SH por arquivo não é configurável na saída LOD; a contornei com arquivos maiores.
3. O viewer 1.42 só lê SOG v2. Quando ele for atualizado, a v3 pode ser reavaliada.
4. Não há prioridade semântica no motor, só distância e direção.
5. As métricas de blocos dependem de campos internos do PlayCanvas.
6. O controlador foi validado em simulação e nesta máquina; faltam aparelhos reais (seção 9).
7. A qualidade dos níveis foi medida com PSNR em duas vistas, sem avaliação perceptual.
8. Com a sala inteira no orçamento "Alto" (3 M ≥ 2,99 M), um computador potente desenha o LOD 0
   completo: nesse caso o ganho é só no tempo de entrada, não no FPS.

## 12. Reprodução

```bash
# Pipeline completo (extração → LODs → Streamed SOG → validação → publicação):
SSPROJ="D:/TCC Gaussian/Output 60k/output60k.ssproj" WORK="D:/TCC Gaussian/lod-work" npm run lod:build
# Só validar o conjunto publicado:
npm run lod:validate -- public/models/museu_streamed/<hash>
# Testes (dataset, validador, parâmetros, controlador automático):
npm test
```

Os intermediários (PLYs de centenas de MB) ficam em `$WORK`, fora do Git.
