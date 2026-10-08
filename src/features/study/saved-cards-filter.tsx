import { FilterCheckbox, FilterDisclosure, FilterSection } from "./study-filter-menu";

export type SavedCardFilterItem = {
  key: string;
  label: string;
  checked: boolean;
};

export function SavedCardsFilter({ items, ready, onAllChange, onItemChange }: {
  items: readonly SavedCardFilterItem[];
  ready: boolean;
  onAllChange: (checked: boolean) => void;
  onItemChange: (key: string, checked: boolean) => void;
}) {
  const selectedCount = items.filter((item) => item.checked).length;
  const checked = items.length > 0 && selectedCount === items.length;
  const mixed = selectedCount > 0 && selectedCount < items.length;

  if (!ready || items.length === 0) {
    return <FilterCheckbox label="Saved Cards" count={items.length} checked={false} disabled onChange={onAllChange} />;
  }

  return <FilterDisclosure
    title="Saved Cards"
    summary={`${selectedCount} of ${items.length} selected`}
    count={items.length}
    checked={checked}
    mixed={mixed}
    onCheckedChange={onAllChange}
  >
    <FilterSection title="Individual saved cards">
      {items.map((item) => <FilterCheckbox key={item.key} label={item.label} checked={item.checked} onChange={(next) => onItemChange(item.key, next)} />)}
    </FilterSection>
  </FilterDisclosure>;
}
