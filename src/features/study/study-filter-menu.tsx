import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import type { StudyCard } from "./types";
import "./study-filter-menu.css";

const savedCardsHint = "Cards you save with the card button or S shortcut are private to your account or this guest browser.";

export function StudyFilterMenu({ summary, children }: { summary: string; detail?: string; children: ReactNode }) {
  return <details className="study-filter-menu panel-surface">
    <summary>
      <span className="filter-summary-label"><SlidersHorizontal aria-hidden="true" /><span>Choose cards</span></span>
      <strong>{summary}</strong>
      <ChevronDown className="filter-chevron" aria-hidden="true" />
    </summary>
    <div className="study-filter-menu-body">{children}</div>
  </details>;
}

export function FilterSection({ title, description, onAll, onNone, children }: { title: string; description?: string; onAll?: () => void; onNone?: () => void; children: ReactNode }) {
  const visibleDescription = title.toLowerCase() === "saved cards" ? undefined : description;
  return <section className="filter-section">
    <div className="filter-section-heading">
      <div><h3>{title}</h3>{visibleDescription && <p>{visibleDescription}</p>}</div>
      {(onAll || onNone) && <div className="filter-actions">{onAll && <button type="button" onClick={onAll}>Select all</button>}{onNone && <button type="button" onClick={onNone}>Deselect all</button>}</div>}
    </div>
    <div className="filter-option-grid">{children}</div>
  </section>;
}

type FilterDisclosureProps = {
  title: ReactNode;
  ariaLabel?: string;
  summary?: string;
  children: ReactNode;
  nested?: boolean;
  checked?: boolean;
  mixed?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onOpenChange?: (open: boolean) => void;
  count?: number;
};

export function FilterDisclosure({ title, ariaLabel, summary, children, nested = false, checked, mixed = false, onCheckedChange, onOpenChange, count }: FilterDisclosureProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = mixed;
  }, [mixed]);
  const titleLabel = ariaLabel ?? (typeof title === "string" ? title : "filter group");

  return <details className={`filter-disclosure ${nested ? "is-nested" : ""}`} onToggle={(event) => onOpenChange?.(event.currentTarget.open)}>
    <summary>
      <span className="filter-disclosure-leading">
        {onCheckedChange && <input
          ref={checkboxRef}
          className="filter-disclosure-checkbox"
          type="checkbox"
          checked={Boolean(checked)}
          aria-label={`Select all ${titleLabel}`}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onCheckedChange(event.target.checked)}
        />}
        <span className="filter-disclosure-copy"><strong>{title}</strong>{summary && <small>{summary}</small>}</span>
      </span>
      <span className="filter-disclosure-trailing">
        {typeof count === "number" && <span className="filter-count">{count.toLocaleString()}</span>}
        <ChevronDown className="filter-disclosure-chevron" aria-hidden="true" />
      </span>
    </summary>
    <div className="filter-disclosure-body">{children}</div>
  </details>;
}

export function FilterCheckbox({ label, checked, mixed = false, onChange, count, disabled = false, nested = false, hint }: { label: string; checked: boolean; mixed?: boolean; onChange: (checked: boolean) => void; count?: number; disabled?: boolean; nested?: boolean; hint?: string }) {
  const checkboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = mixed;
  }, [mixed]);
  const visibleHint = label === "Saved Cards" ? savedCardsHint : hint;

  return <label className={`filter-checkbox ${nested ? "is-nested" : ""} ${disabled ? "is-disabled" : ""}`}>
    <input ref={checkboxRef} type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    <span className="filter-checkbox-copy"><strong>{label}</strong>{visibleHint && <small>{visibleHint}</small>}</span>
    {typeof count === "number" && <span className="filter-count">{count.toLocaleString()}</span>}
  </label>;
}

type ExactCardSelectionProps = {
  cards: readonly StudyCard[];
  isSelected: (card: StudyCard) => boolean;
  onCardChange: (card: StudyCard, checked: boolean) => void;
  onCardsChange?: (cards: readonly StudyCard[], checked: boolean) => void;
  chunkSize?: number;
  labelForCard?: (card: StudyCard, index: number) => string;
  sectionTitle?: string;
};

function defaultCardLabel(card: StudyCard, index: number) {
  const rank = typeof card.rank === "number" ? `#${card.rank} · ` : `${index + 1}. `;
  return `${rank}${card.front}`;
}

export function ExactCardSelection({ cards, isSelected, onCardChange, onCardsChange, chunkSize, labelForCard = defaultCardLabel, sectionTitle = "Cards" }: ExactCardSelectionProps) {
  const renderCards = (items: readonly StudyCard[], offset = 0) => <FilterSection title={sectionTitle}>
    {items.map((card, index) => <FilterCheckbox key={`${card.deckId}:${card.id}`} label={labelForCard(card, offset + index)} checked={isSelected(card)} onChange={(checked) => onCardChange(card, checked)} />)}
  </FilterSection>;

  if (!chunkSize || cards.length <= chunkSize) return renderCards(cards);

  const chunks: StudyCard[][] = [];
  for (let index = 0; index < cards.length; index += chunkSize) chunks.push(cards.slice(index, index + chunkSize));
  return <>{chunks.map((chunk, chunkIndex) => {
    const start = chunkIndex * chunkSize + 1;
    const end = start + chunk.length - 1;
    const selectedCount = chunk.filter(isSelected).length;
    return <FilterDisclosure
      key={`${start}-${end}`}
      title={`${start}–${end}`}
      summary={`${selectedCount} of ${chunk.length} selected`}
      count={chunk.length}
      nested
      checked={selectedCount === chunk.length}
      mixed={selectedCount > 0 && selectedCount < chunk.length}
      onCheckedChange={onCardsChange ? (checked) => onCardsChange(chunk, checked) : undefined}
    >
      {renderCards(chunk, start - 1)}
    </FilterDisclosure>;
  })}</>;
}
