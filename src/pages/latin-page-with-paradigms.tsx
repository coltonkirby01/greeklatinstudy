import { Link } from "react-router-dom";
import { LatinPage as CoreLatinPage } from "./latin-page";

export function LatinPage() {
  return <>
    <section className="page-shell" aria-label="Featured Latin deck">
      <div className="guest-banner">
        <span><strong>Passive Indicative Paradigms</strong> · 12 whole-paradigm cards covering present, imperfect, and future across all four regular conjugations.</span>
        <Link to="/latin/passive-indicative-paradigms">Study this deck</Link>
      </div>
    </section>
    <CoreLatinPage />
  </>;
}
