import fs from "node:fs";

function patchFile(path, patches) {
  let source = fs.readFileSync(path, "utf8");
  for (const [needle, replacement] of patches) {
    if (!source.includes(needle)) throw new Error(`Patch needle not found in ${path}: ${needle.slice(0, 100)}`);
    source = source.replace(needle, replacement);
  }
  fs.writeFileSync(path, source);
}

patchFile("src/pages/greek-page-v2.tsx", [
  [
    'import { loadIncludeSavedCards, saveIncludeSavedCards, savedCardRef, useSavedCards } from "../features/study/saved-cards";\n',
    'import { loadIncludeSavedCards, saveIncludeSavedCards, savedCardRef, useSavedCards } from "../features/study/saved-cards";\nimport { SavedCardsFilter, type SavedCardFilterItem } from "../features/study/saved-cards-filter";\nimport { SelectedCardsProvider, type SelectedCardPanelItem } from "../features/study/selected-cards-context";\n',
  ],
  [
`  function changeSavedCards(checked: boolean) {
    setIncludeSavedCards(checked);
    if (!checked || !decks) return;
    const refs = deckList(decks).flatMap((sourceDeck) => sourceDeck.cards
      .filter((card) => Boolean(groupKeyForCard(sourceDeck, card)) && savedCards.refs.has(savedCardRef(sourceDeck.id, card.id)))
      .map((card) => ({ deckId: sourceDeck.id, cardId: card.id })));
    excludedCards.setMany(refs, false);
  }
`,
`  function changeSavedCards(checked: boolean) {
    setIncludeSavedCards(checked);
    if (!checked) return;
    excludedCards.setMany(savedCardEntries.map(({ sourceDeck, card }) => ({ deckId: sourceDeck.id, cardId: card.id })), false);
  }

  function changeSavedCardEntry(key: string, checked: boolean) {
    const entry = savedCardEntries.find((item) => item.key === key);
    if (!entry) return;
    if (!checked) {
      excludedCards.exclude(entry.sourceDeck.id, entry.card.id);
      return;
    }
    if (!includeSavedCards) {
      setIncludeSavedCards(true);
      excludedCards.setMany(savedCardEntries.map(({ sourceDeck, card }) => ({ deckId: sourceDeck.id, cardId: card.id })), true);
    }
    excludedCards.restore(entry.sourceDeck.id, entry.card.id);
  }
`,
  ],
  [
`  const savedCardCount = useMemo(() => {
    if (!decks) return 0;
    return deckList(decks).flatMap((sourceDeck) => sourceDeck.cards
      .filter((card) => Boolean(groupKeyForCard(sourceDeck, card)))
      .map((card) => savedCardRef(sourceDeck.id, card.id)))
      .filter((ref) => savedCards.refs.has(ref)).length;
  }, [decks, savedCards.refs]);
`,
`  const savedCardEntries = useMemo(() => {
    if (!decks) return [];
    const seen = new Set<string>();
    return deckList(decks).flatMap((sourceDeck) => sourceDeck.cards.flatMap((card) => {
      const key = savedCardRef(sourceDeck.id, card.id);
      if (!groupKeyForCard(sourceDeck, card) || !savedCards.refs.has(key) || seen.has(key)) return [];
      seen.add(key);
      return [{ key, sourceDeck, card }];
    }));
  }, [decks, savedCards.refs]);
  const savedCardFilterItems = useMemo<SavedCardFilterItem[]>(() => savedCardEntries.map(({ key, card }) => ({
    key,
    label: `${card.rank ? `#${card.rank} · ` : ""}${card.front}`,
    checked: includeSavedCards && !excludedCards.refs.has(key),
  })), [excludedCards.refs, includeSavedCards, savedCardEntries]);
  const savedCardCount = savedCardEntries.length;
`,
  ],
  [
`  const selectedCards = useMemo(() => sources.flatMap((source) => source.cards), [sources]);
`,
`  const selectedCards = useMemo(() => sources.flatMap((source) => source.cards), [sources]);
  const currentlySelectedItems = useMemo<SelectedCardPanelItem[]>(() => {
    const seen = new Set<string>();
    return sources.flatMap((source) => source.cards.flatMap((card) => {
      const key = savedCardRef(source.deck.id, card.id);
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ key, deckId: source.deck.id, cardId: card.id, label: `${card.rank ? `#${card.rank} · ` : ""}${card.front}` }];
    }));
  }, [sources]);
`,
  ],
  [
`  const savedHint = "Cards you save with the card button or S shortcut are private to your account or this guest browser.";
`,
``,
  ],
  [
`        <FilterCheckbox label="Saved Cards" count={savedCardCount} checked={includeSavedCards} disabled={!savedCards.ready || savedCardCount === 0} onChange={changeSavedCards} hint={savedHint} />
`,
`        <SavedCardsFilter items={savedCardFilterItems} ready={savedCards.ready} onAllChange={changeSavedCards} onItemChange={changeSavedCardEntry} />
`,
  ],
  [
`    {decks ? <MultiSourceStudySession
`,
`    {decks ? <SelectedCardsProvider items={currentlySelectedItems} onChange={(item, checked) => checked ? excludedCards.restore(item.deckId, item.cardId) : excludedCards.exclude(item.deckId, item.cardId)}><MultiSourceStudySession
`,
  ],
  [
`      }}
    /> : <div className="study-loading panel-surface"><span className="loading-mark">α</span><p>Preparing Greek…</p></div>}
`,
`      }}
    /></SelectedCardsProvider> : <div className="study-loading panel-surface"><span className="loading-mark">α</span><p>Preparing Greek…</p></div>}
`,
  ],
]);

patchFile("src/pages/latin-page.tsx", [
  [
    'import { loadIncludeSavedCards, saveIncludeSavedCards, savedCardRef, useSavedCards } from "../features/study/saved-cards";\n',
    'import { loadIncludeSavedCards, saveIncludeSavedCards, savedCardRef, useSavedCards } from "../features/study/saved-cards";\nimport { SavedCardsFilter, type SavedCardFilterItem } from "../features/study/saved-cards-filter";\nimport { SelectedCardsProvider, type SelectedCardPanelItem } from "../features/study/selected-cards-context";\n',
  ],
  [
`  const savedCardCount = useMemo(() => {
    const decks = [vocabularyDeck, adjectiveParadigmDeck, participlesDeck, activeParadigmDeck, passiveParadigmDeck, activeSubjunctiveDeck, passiveSubjunctiveDeck].filter((item): item is DeckDefinition => Boolean(item));
    return decks.flatMap((sourceDeck) => sourceDeck.cards.map((card) => savedCardRef(sourceDeck.id, card.id))).filter((ref) => savedCards.refs.has(ref)).length;
  }, [activeParadigmDeck, activeSubjunctiveDeck, adjectiveParadigmDeck, participlesDeck, passiveParadigmDeck, passiveSubjunctiveDeck, savedCards.refs, vocabularyDeck]);
`,
`  const savedSourceDecks = useMemo(() => [vocabularyDeck, adjectiveParadigmDeck, participlesDeck, activeParadigmDeck, passiveParadigmDeck, activeSubjunctiveDeck, passiveSubjunctiveDeck].filter((item): item is DeckDefinition => Boolean(item)), [activeParadigmDeck, activeSubjunctiveDeck, adjectiveParadigmDeck, participlesDeck, passiveParadigmDeck, passiveSubjunctiveDeck, vocabularyDeck]);
  const savedCardEntries = useMemo(() => {
    const seen = new Set<string>();
    return savedSourceDecks.flatMap((sourceDeck) => sourceDeck.cards.flatMap((card) => {
      const key = savedCardRef(sourceDeck.id, card.id);
      if (!savedCards.refs.has(key) || seen.has(key)) return [];
      seen.add(key);
      return [{ key, sourceDeck, card }];
    }));
  }, [savedCards.refs, savedSourceDecks]);
  const savedCardFilterItems = useMemo<SavedCardFilterItem[]>(() => savedCardEntries.map(({ key, card }) => ({
    key,
    label: `${card.rank ? `#${card.rank} · ` : ""}${card.front.split(" — R.")[0]}`,
    checked: includeSavedCards && !excludedCards.refs.has(key),
  })), [excludedCards.refs, includeSavedCards, savedCardEntries]);
  const savedCardCount = savedCardEntries.length;
`,
  ],
  [
`  const selectedCards = useMemo(() => sources.flatMap((source) => source.cards), [sources]);
`,
`  const selectedCards = useMemo(() => sources.flatMap((source) => source.cards), [sources]);
  const currentlySelectedItems = useMemo<SelectedCardPanelItem[]>(() => {
    const seen = new Set<string>();
    return sources.flatMap((source) => source.cards.flatMap((card) => {
      const key = savedCardRef(source.deck.id, card.id);
      if (seen.has(key)) return [];
      seen.add(key);
      return [{ key, deckId: source.deck.id, cardId: card.id, label: `${card.rank ? `#${card.rank} · ` : ""}${card.front.split(" — R.")[0]}` }];
    }));
  }, [sources]);
`,
  ],
  [
`  function changeSavedCards(checked: boolean) {
    setIncludeSavedCards(checked);
    if (!checked) return;
    const sourceDecks = [vocabularyDeck, adjectiveParadigmDeck, participlesDeck, activeParadigmDeck, passiveParadigmDeck, activeSubjunctiveDeck, passiveSubjunctiveDeck].filter((item): item is DeckDefinition => Boolean(item));
    const refs = sourceDecks.flatMap((sourceDeck) => sourceDeck.cards
      .filter((card) => savedCards.refs.has(savedCardRef(sourceDeck.id, card.id)))
      .map((card) => ({ deckId: sourceDeck.id, cardId: card.id })));
    excludedCards.setMany(refs, false);
  }
`,
`  function changeSavedCards(checked: boolean) {
    setIncludeSavedCards(checked);
    if (!checked) return;
    excludedCards.setMany(savedCardEntries.map(({ sourceDeck, card }) => ({ deckId: sourceDeck.id, cardId: card.id })), false);
  }

  function changeSavedCardEntry(key: string, checked: boolean) {
    const entry = savedCardEntries.find((item) => item.key === key);
    if (!entry) return;
    if (!checked) {
      excludedCards.exclude(entry.sourceDeck.id, entry.card.id);
      return;
    }
    if (!includeSavedCards) {
      setIncludeSavedCards(true);
      excludedCards.setMany(savedCardEntries.map(({ sourceDeck, card }) => ({ deckId: sourceDeck.id, cardId: card.id })), true);
    }
    excludedCards.restore(entry.sourceDeck.id, entry.card.id);
  }
`,
  ],
  [
`          <FilterCheckbox label="Saved Cards" count={savedCardCount} checked={includeSavedCards} disabled={!savedCards.ready || savedCardCount === 0} onChange={changeSavedCards} hint="Your saved Latin cards" />
`,
`          <SavedCardsFilter items={savedCardFilterItems} ready={savedCards.ready} onAllChange={changeSavedCards} onItemChange={changeSavedCardEntry} />
`,
  ],
  [
`        <MultiSourceStudySession
`,
`        <SelectedCardsProvider items={currentlySelectedItems} onChange={(item, checked) => checked ? excludedCards.restore(item.deckId, item.cardId) : excludedCards.exclude(item.deckId, item.cardId)}><MultiSourceStudySession
`,
  ],
  [
`          }}
        />
      ) : (
`,
`          }}
        /></SelectedCardsProvider>
      ) : (
`,
  ],
]);
