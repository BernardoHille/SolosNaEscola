/**
 * Rótulos de navegação a partir do nome do passo de cada acervo (`stepNoun`). Os nomes em uso são
 * femininos em "a" ("Etapa", "Rocha", "Amostra") ou masculinos ("Item", "Experimento").
 */
const isFeminine = (noun: string) => noun.toLowerCase().endsWith("a");

/** "Próxima etapa", "Próximo item". */
export const nextStepLabel = (noun: string) => `${isFeminine(noun) ? "Próxima" : "Próximo"} ${noun.toLowerCase()}`;

/** "Ir para a etapa 1", "Ir para o experimento". `step` é o rótulo da aba, com ou sem número. */
export const goToStepLabel = (noun: string, step: string) => `Ir para ${isFeminine(noun) ? "a" : "o"} ${step.toLowerCase()}`;

/** "Etapas", "Itens". */
export const stepPlural = (noun: string) => (noun.endsWith("m") ? `${noun.slice(0, -1)}ns` : `${noun}s`);
