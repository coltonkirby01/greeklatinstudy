import { Link } from "react-router-dom";
import { LatinPage as CoreLatinPage } from "./latin-page";

export function LatinPage() {
  return <>
    <section className="page-shell" aria-label="Featured Latin deck" style={{ paddingBottom: "0.5rem" }}>
      <div className="panel-surface" style={{ padding: "1.25rem 1.4rem", display: "grid", gap: "0.75rem" }}>
        <div>
          <p className="eyebrow">Latin paradigm deck</p>
          <h2 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: "1.55rem", fontWeight: 650 }}>Passive Indicative Paradigms</h2>
          <p style={{ margin: "0.45rem 0 0", color: "var(--ink-soft)" }}>12 whole-paradigm cards: present, imperfect, and future passive indicative across all four regular conjugations.</p>
        </div>
        <Link className="course-link" to="/latin/passive-indicative-paradigms">Open the paradigm deck →</Link>
      </div>
    </section>
    <CoreLatinPage />
  </>;
}
