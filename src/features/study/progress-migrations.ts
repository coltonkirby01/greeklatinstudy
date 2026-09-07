import type { DeckProgressEnvelope, StudyModeState } from "./types";

export const LESSON3_GRAMMAR_DECK_ID = "alpha-omega-lesson3-grammar";
export const RETIRED_LESSON3_GRAMMAR_CARD_IDS = [
  "lesson3-g-ind-1s",
  "lesson3-g-ind-2s",
  "lesson3-g-ind-3s",
  "lesson3-g-ind-1p",
  "lesson3-g-ind-2p",
  "lesson3-g-ind-3p",
  "lesson3-g-inf",
  "lesson3-g-imp-2s",
  "lesson3-g-imp-3s",
  "lesson3-g-imp-2p",
  "lesson3-g-imp-3p",
] as const;

const retiredLesson3GrammarIds = new Set<string>(RETIRED_LESSON3_GRAMMAR_CARD_IDS);

export function isRetiredLesson3GrammarCardId(cardId: string) {
  return retiredLesson3GrammarIds.has(cardId);
}

function purgeMode(mode: StudyModeState) {
  let changed = false;
  const cards = Object.fromEntries(Object.entries(mode.cards).filter(([cardId]) => {
    const keep = !isRetiredLesson3GrammarCardId(cardId);
    if (!keep) changed = true;
    return keep;
  }));
  const reviewSequence = mode.reviewSequence.filter((cardId) => !isRetiredLesson3GrammarCardId(cardId));
  if (reviewSequence.length !== mode.reviewSequence.length) changed = true;
  const currentCardId = mode.currentCardId && isRetiredLesson3GrammarCardId(mode.currentCardId) ? null : mode.currentCardId;
  if (currentCardId !== mode.currentCardId) changed = true;
  if (!changed) return mode;
  const remaining = Object.values(cards);
  return {
    ...mode,
    cards,
    reviewSequence,
    currentCardId,
    totalReviews: remaining.reduce((sum, card) => sum + card.reviews, 0),
    rightReviews: remaining.reduce((sum, card) => sum + card.right, 0),
    wrongReviews: remaining.reduce((sum, card) => sum + card.wrong, 0),
  };
}

export function purgeRetiredLesson3GrammarProgress(envelope: DeckProgressEnvelope) {
  if (envelope.deckId !== LESSON3_GRAMMAR_DECK_ID) return envelope;
  const retiredCardIds = [...new Set([...(envelope.retiredCardIds ?? []), ...RETIRED_LESSON3_GRAMMAR_CARD_IDS])];
  const modes = Object.fromEntries(Object.entries(envelope.modes).map(([studyKey, mode]) => [studyKey, purgeMode(mode)]));
  return { ...envelope, modes, retiredCardIds };
}
