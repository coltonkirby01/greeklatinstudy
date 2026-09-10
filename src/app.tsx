import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { SiteLayout } from "./components/site-layout";
import {
  loadAccountPage,
  loadAdminPage,
  loadDynamicDeckPage,
  loadGreekPage,
  loadHomePage,
  loadLatinPage,
  loadLatinPassiveIndicativePage,
  loadNotFoundPage,
  loadReadingPage,
  loadStatsPage,
} from "./route-preload";

const HomePage = lazy(async () => ({ default: (await loadHomePage()).HomePage }));
const GreekPage = lazy(async () => ({ default: (await loadGreekPage()).GreekPage }));
const LatinPage = lazy(async () => ({ default: (await loadLatinPage()).LatinPage }));
const LatinPassiveIndicativePage = lazy(async () => ({ default: (await loadLatinPassiveIndicativePage()).LatinPassiveIndicativePage }));
const StatsPage = lazy(async () => ({ default: (await loadStatsPage()).StatsPage }));
const DynamicDeckPage = lazy(async () => ({ default: (await loadDynamicDeckPage()).DynamicDeckPage }));
const ReadingPage = lazy(async () => ({ default: (await loadReadingPage()).ReadingPage }));
const AccountPage = lazy(async () => ({ default: (await loadAccountPage()).AccountPage }));
const AdminPage = lazy(async () => ({ default: (await loadAdminPage()).AdminPage }));
const NotFoundPage = lazy(async () => ({ default: (await loadNotFoundPage()).NotFoundPage }));

function RouteLoading() {
  return <main className="page-shell"><div className="study-loading panel-surface" role="status"><span className="loading-mark">Α</span><p>Opening your study materials…</p></div></main>;
}

export function App() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="greek" element={<GreekPage />} />
          <Route path="latin" element={<LatinPage />} />
          <Route path="latin/passive-indicative-paradigms" element={<LatinPassiveIndicativePage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="henle" element={<Navigate to="/latin" replace />} />
          <Route path="decks/:slug" element={<DynamicDeckPage />} />
          <Route path="reading" element={<ReadingPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
