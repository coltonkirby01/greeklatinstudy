import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app";
import { AuthProvider } from "./features/auth/auth-context";
import "./styles.css";

const flashcardNoScrollCss = `.study-panel .flashcard-inner{display:grid;height:auto}.study-panel .flashcard-face{position:relative;inset:auto;grid-area:1/1;height:auto;overflow:visible}.study-panel .flashcard-face:has(.chart-scroll){overflow:visible}.study-panel .flashcard-face[aria-hidden=true]{pointer-events:none}`;
const basename = import.meta.env.BASE_URL === "/" ? "/" : import.meta.env.BASE_URL.replace(/\/$/, "");
createRoot(document.getElementById("root")!).render(<><style>{flashcardNoScrollCss}</style><BrowserRouter basename={basename}><AuthProvider><App /></AuthProvider></BrowserRouter></>);
