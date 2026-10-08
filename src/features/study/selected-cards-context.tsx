import { createContext, useContext, type ReactNode } from "react";

export type SelectedCardPanelItem = {
  key: string;
  label: string;
  deckId: string;
  cardId: string;
};

type SelectedCardsPanelState = {
  items: readonly SelectedCardPanelItem[];
  onChange?: (item: SelectedCardPanelItem, checked: boolean) => void;
};

const SelectedCardsPanelContext = createContext<SelectedCardsPanelState>({ items: [] });

export function SelectedCardsProvider({ items, onChange, children }: SelectedCardsPanelState & { children: ReactNode }) {
  return <SelectedCardsPanelContext.Provider value={{ items, onChange }}>{children}</SelectedCardsPanelContext.Provider>;
}

export function useSelectedCardsPanel() {
  return useContext(SelectedCardsPanelContext);
}
