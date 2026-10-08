import { useState } from "react";
import { requestSavedCardRemoval } from "./saved-cards";
import { FilterCheckbox, FilterDisclosure, FilterSection } from "./study-filter-menu";

export type SavedCardFilterItem = {
  key: string;
  label: string;
  checked: boolean;
};

export function togglePendingSavedCardRemoval(current: ReadonlySet<string>, key: string) {
  const next = new Set(current);
  next.has(key) ? next.delete(key) : next.add(key);
  return next;
}

export function SavedCardsFilter({ items, ready, onAllChange, onItemChange }: {
  items: readonly SavedCardFilterItem[];
  ready: boolean;
  onAllChange: (checked: boolean) => void;
  onItemChange: (key: string, checked: boolean) => void;
}) {
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(() => new Set());
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
    onOpenChange={(open) => {
      if (open || pendingRemovals.size === 0) return;
      pendingRemovals.forEach(requestSavedCardRemoval);
      setPendingRemovals(new Set());
    }}
  >
    <FilterSection title="Individual saved cards">
      {items.map((item) => {
        const pendingRemoval = pendingRemovals.has(item.key);
        const actionLabel = pendingRemoval ? "Reselect" : "Deselect";
        return <div className="saved-card-filter-row" key={item.key}>
          <FilterCheckbox label={item.label} checked={item.checked} onChange={(next) => onItemChange(item.key, next)} />
          <button
            type="button"
            className="saved-card-library-action"
            aria-label={`${actionLabel} ${item.label} ${pendingRemoval ? "in" : "from"} Saved Cards`}
            onClick={() => setPendingRemovals((current) => togglePendingSavedCardRemoval(current, item.key))}
          >
            {actionLabel}
          </button>
        </div>;
      })}
    </FilterSection>
  </FilterDisclosure>;
}
