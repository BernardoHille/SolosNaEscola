# Protocolo de testes em dispositivos: LOD, Streamed SOG e qualidade automática

Versão publicada: <https://solosnaescola.vercel.app>. Detalhes técnicos da implementação estão em
[`lod-streaming.md`](lod-streaming.md).

Todos os campos marcados como **Pendente** devem ser preenchidos só com valores medidos. Não estime
valores.

## URLs

| Uso | URL |
|---|---|
| Visitante (padrão: Streamed SOG, Automático) | `https://solosnaescola.vercel.app/` |
| Streamed com diagnóstico | `https://solosnaescola.vercel.app/?splat=streamed&diag=1` |
| Original (SOG único) com diagnóstico | `https://solosnaescola.vercel.app/?splat=legacy&diag=1` |

- `?splat=` só escolhe o arquivo do Gaussian. `?diag=1` mostra o painel técnico, que a tecla **P**
  esconde e mostra. Nenhum controle da interface leva a esses parâmetros.
- Sem `?splat=`, se o Streamed SOG falhar antes de a cena ficar pronta, a exposição passa sozinha
  para o SOG original. Com `?splat=streamed`, a falha aparece na tela, para o teste.

## Preparação (cada aparelho)

1. Use uma janela anônima ou privada para a **primeira visita**, com o cache vazio. Para a
   **segunda visita**, recarregue na mesma janela.
2. Use o navegador padrão do aparelho e anote a versão: Chrome no Android, Chrome ou Edge no
   Windows. No Xiaomi, anote também se é o navegador da Xiaomi.
3. Anote:
   - a rede (Wi-Fi ou 4G/5G) e, se possível, a velocidade medida (fast.com);
   - a taxa da tela (60/90/120 Hz) e o modo de economia de bateria.
4. Celular e tablet: carga acima de 50 %, fora do carregador, com o brilho como de costume.
5. A qualidade começa no **Automático**. Se houver uma escolha salva de outro teste, use
   Configurações → "Apagar memória".

## Roteiro (repetir em `streamed` e `legacy`)

| Etapa | O que fazer | O que anotar |
|---|---|---|
| A. Carregamento | Abrir a URL e esperar o botão "Iniciar visita" | Tempo até a tela inicial ficar pronta (cronômetro) e "cena pronta · navegável" no painel |
| B. Parado | Iniciar a visita e ficar parado na entrada por 30 s | Gaussianas desenhadas, blocos por LOD, MB baixados |
| C. Caminhar | Andar até o fundo da sala e voltar, por cerca de 60 s | FPS da janela de 5 s, p95/p99 e engasgos visíveis |
| D. Girar | Girar 360° devagar e depois rápido | FPS, buracos ou blocos aparecendo |
| E. Perto | Chegar perto de uma mesa e de um painel | Nitidez (captura de tela), popping ao aproximar |
| F. Inspeção | Abrir um objeto (E ou toque), girá-lo e avançar para o próximo | Fluidez e erros |
| G. Automático | Continuar andando por 2 min | Estado final, orçamento e resolução, número de mudanças, "última mudança" |
| H. Manuais | Trocar para Alto, Médio, Baixo e Muito baixo durante a visita | FPS e gaussianas em cada modo; a troca não pode recarregar a cena |

Ao fim de cada etapa B, C, G e H, toque em **"Copiar medição"** no painel e cole o JSON numa nota com o
nome do aparelho, a fonte e a etapa. Os dados de FPS mínimo saem do p99 do quadro: FPS mínimo ≈
1000 / p99 (ms).

## Tabela de resultados (Automático, `streamed`)

| Dispositivo | FPS médio | FPS mínimo | Qualidade | Splats | Problemas |
|---|---|---|---|---|---|
| RTX 3060 | Pendente | Pendente | Automático | Pendente | Pendente |
| Notebook | Pendente | Pendente | Automático | Pendente | Pendente |
| Galaxy S25 | Pendente | Pendente | Automático | Pendente | Pendente |
| Xiaomi Pad 7 | Pendente | Pendente | Automático | Pendente | Pendente |

## Comparação com o original (`legacy`)

| Dispositivo | FPS médio legacy | FPS médio streamed | Tempo até iniciar legacy | Tempo até iniciar streamed | MB legacy | MB streamed |
|---|---|---|---|---|---|---|
| RTX 3060 | Pendente | Pendente | Pendente | Pendente | Pendente | Pendente |
| Notebook | Pendente | Pendente | Pendente | Pendente | Pendente | Pendente |
| Galaxy S25 | Pendente | Pendente | Pendente | Pendente | Pendente | Pendente |
| Xiaomi Pad 7 | Pendente | Pendente | Pendente | Pendente | Pendente | Pendente |

## Observações por dispositivo

Copie o bloco abaixo para cada aparelho:

```
Dispositivo / navegador / rede / taxa da tela:
Tempo de carregamento (1ª visita / 2ª visita):
Fluidez ao caminhar:
Fluidez ao girar a câmera:
Nitidez dos objetos próximos:
Aparição de chunks (blocos surgindo ou faltando):
Popping entre LODs:
Estabilidade da qualidade automática (mudanças, oscilação, nível final):
Memória (heap JS no painel; no Android, chrome://inspect → Memory, se disponível):
Problemas e capturas:
```

## Já verificado antes da publicação

Ambiente: build de produção local, Chromium do app Claude, Windows 11, RTX 3060, tela de 60 Hz.

- Tela inicial, carregamento, "Iniciar visita".
- Caminhada com colisão: a câmera para na mesa.
- Destaque amarelo, inspeção, giro do objeto, avanço entre objetos e legenda da narração.
- Mapa, módulo explorado e visita guiada.
- Voltar à entrada e voltar ao menu inicial, sem recriar o viewer.
- Tecla P e troca de qualidade ao vivo.
- Modo de toque emulado: joystick, giro por arrasto e nível inicial de celular (700 mil
  gaussianas, 75 %, meta de 30 FPS).
- Recuo para o SOG original.

**Não verificado:**

- tela cheia (o painel do app bloqueia a Fullscreen API);
- som das narrações;
- toque real (só emulação);
- qualquer aparelho além do computador com RTX 3060;
- rede real, porque localhost não serve para medir tempo de carregamento.

Atenção ao consumo de dados: com os orçamentos de computador, o streamed baixa mais bytes que o
original (até cerca de 133 MB contra 45,7 MB; ver `lod-streaming.md`, seção 9). Isso pesa no plano
de dados dos celulares e na cota de transferência da Vercel.

## Como reverter

A versão anterior está marcada pela tag `backup/pre-lod-streaming`. Para voltar ao SOG original sem
desfazer o código, troque `DEFAULT_SPLAT_SOURCE` para `"legacy"` em
`src/lib/viewer/splatSourceParam.ts` e publique. Para voltar o código inteiro, crie um commit de
reversão do merge (`git revert -m 1 <merge>`), sem reescrever a `main`.
