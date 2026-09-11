import { ArrowRight, Cloud, ExternalLink, Repeat2 } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { homeCourses, type CourseId } from "../config/site";
import { useAuth } from "../features/auth/auth-context";
import { preloadRoute } from "../route-preload";
import "./home-page.css";

const courseVisuals: Record<CourseId, ReactNode> = {
  greek: <span className="course-glyph course-glyph-word greek-course-title">Ἑλληνικά</span>,
  latin: <span className="course-glyph course-glyph-word latin-course-title">LATINA</span>,
};

const overlayLinkStyle: CSSProperties = { position: "absolute", inset: 0, zIndex: 1, borderRadius: "inherit" };
const protectedTextStyle: CSSProperties = { position: "relative", zIndex: 2 };
const interactiveStyle: CSSProperties = { position: "relative", zIndex: 3 };
const visualLinkStyle: CSSProperties = { ...interactiveStyle, width: "fit-content", display: "inline-flex", color: "inherit", textDecoration: "none" };
const titleLinkStyle: CSSProperties = { ...interactiveStyle, color: "inherit", textDecoration: "underline", textDecorationThickness: "1px" };
const homePolishCss = `.flashcard-course .course-card-top{min-height:7.25rem;margin-bottom:1.1rem}.flashcard-course>.eyebrow{margin-top:0}.flashcard-course h2{min-height:5.25rem;align-content:start}.flashcard-course .course-source-links{min-height:2rem;margin-top:.9rem}.flashcard-course .course-link{margin-top:auto}@media(max-width:720px){.flashcard-course h2,.flashcard-course .course-card-top,.flashcard-course .course-source-links{min-height:0}}`;

function preloadCourse(id: CourseId, href: string) {
  preloadRoute(href);
  if (id === "greek") {
    void import("../data/builtin-decks").then(({ loadGreekDeck, loadGreekLesson3GrammarDeck, loadGreekLesson3VocabularyDeck }) => Promise.all([loadGreekDeck(), loadGreekLesson3VocabularyDeck(), loadGreekLesson3GrammarDeck()])).catch(() => undefined);
    return;
  }
  if (id === "latin") {
    void Promise.all([
      import("../data/builtin-decks").then(({ loadLatinDeck }) => loadLatinDeck()),
      import("../data/latin-active-indicative-paradigms").then(({ loadLatinActiveIndicativeParadigmsDeck }) => loadLatinActiveIndicativeParadigmsDeck()),
      import("../data/latin-passive-indicative-paradigms").then(({ loadLatinPassiveIndicativeParadigmsDeck }) => loadLatinPassiveIndicativeParadigmsDeck()),
    ]).catch(() => undefined);
  }
}

export function HomePage() {
  const { user } = useAuth();
  return <main className="page-shell home-page">
    <style>{homePolishCss}</style>
    <section className="home-intro">
      <div><h1>Build a durable memory of Greek and Latin.</h1><p className="home-lede">Greek and Latin each have one study app. Choose exactly what belongs in a session, from several Greek lesson categories to a mixture of Latin vocabulary and grammar, then reveal, rate, and review adaptively.</p></div>
      <div className="method-note"><Repeat2 /><div><strong>One deliberate cycle</strong><span>Choose · recall · reveal · rate · review</span></div></div>
    </section>
    <section className="course-grid">
      {homeCourses.map((course) => <Course key={course.id} {...course} visual={courseVisuals[course.visual]} />)}
    </section>
    <section className="sign-in-callout panel-surface">
      <div className="callout-icon"><Cloud /></div>
      <div><h2>{user ? "Your progress is connected" : "Keep your place on every device"}</h2><p>{user ? "Forward, reverse, whole-chart, session, and saved-card progress can sync to your account." : "Guest study works immediately on this device. Sign in when cloud accounts are configured to sync everywhere."}</p></div>
      <Link className="button-link primary-button" to="/account">{user ? "View account" : "Sign in to sync"}</Link>
    </section>
  </main>;
}

function Course({ id, visual, count, eyebrow, title, titleLinks, description, sourceLinks, href, linkLabel }: { id: CourseId; visual: ReactNode; count: string; eyebrow: string; title: string; titleLinks: readonly { label: string; href: string }[]; description: string; sourceLinks: readonly { label: string; href: string }[]; href: string; linkLabel: string }) {
  const flashcardCourse = id === "greek" || id === "latin";
  const preload = () => preloadCourse(id, href);
  return <article className={`course-card ${flashcardCourse ? "flashcard-course" : ""} ${id}-course`} onPointerEnter={preload} onPointerDown={preload} onFocusCapture={preload}>
    <Link to={href} aria-hidden="true" tabIndex={-1} style={overlayLinkStyle} />
    <div className="course-card-top">
      {flashcardCourse ? <Link to={href} aria-label={`Open ${eyebrow} flashcards`} style={visualLinkStyle}>{visual}</Link> : visual}
      {count && <span className="course-count" style={protectedTextStyle}>{count}</span>}
    </div>
    <p className="eyebrow" style={protectedTextStyle}>{eyebrow}</p>
    <h2 style={protectedTextStyle}>{titleLinks.length > 0 ? titleLinks.map((item, index) => <span key={item.href}>{index > 0 && <span aria-hidden="true"> · </span>}<a href={item.href} target="_blank" rel="noreferrer" style={titleLinkStyle}>{item.label}</a></span>) : <Link to={href} style={{ color: "inherit", textDecoration: "none" }}>{title}</Link>}</h2>
    {description && <p style={protectedTextStyle}>{description}</p>}
    {sourceLinks.length > 0 && <div className="course-source-links" aria-label={`${eyebrow} sources`} style={interactiveStyle}>
      {sourceLinks.map((source) => <a key={source.href} href={source.href} target="_blank" rel="noreferrer">{source.label} <ExternalLink aria-hidden="true" /></a>)}
    </div>}
    <Link className="course-link" to={href} style={interactiveStyle}>{linkLabel} <ArrowRight /></Link>
  </article>;
}
