export const loadHomePage = () => import("./pages/home-page");
export const loadGreekPage = () => import("./pages/greek-page");
export const loadLatinPage = () => import("./pages/latin-page");
export const loadLatinPassiveIndicativePage = () => import("./pages/latin-passive-indicative-page");
export const loadStatsPage = () => import("./pages/stats-page");
export const loadDynamicDeckPage = () => import("./pages/dynamic-deck-page");
export const loadReadingPage = () => import("./pages/reading-page");
export const loadAccountPage = () => import("./pages/account-page");
export const loadAdminPage = () => import("./pages/admin-page");
export const loadNotFoundPage = () => import("./pages/not-found-page");

const routeLoaders: Record<string, () => Promise<unknown>> = {
  "/": loadHomePage,
  "/greek": loadGreekPage,
  "/latin": loadLatinPage,
  "/latin/passive-indicative-paradigms": loadLatinPassiveIndicativePage,
  "/stats": loadStatsPage,
  "/reading": loadReadingPage,
  "/account": loadAccountPage,
  "/admin": loadAdminPage,
};

export function preloadRoute(href: string) {
  const loader = routeLoaders[href];
  if (loader) void loader().catch(() => undefined);
}
