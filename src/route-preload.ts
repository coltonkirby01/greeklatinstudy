const routeLoaders: Record<string, () => Promise<unknown>> = {
  "/": () => import("./pages/home-page"),
  "/greek": () => import("./pages/greek-page"),
  "/latin": () => import("./pages/latin-page"),
  "/stats": () => import("./pages/stats-page"),
  "/reading": () => import("./pages/reading-page"),
  "/account": () => import("./pages/account-page"),
  "/admin": () => import("./pages/admin-page"),
};

export function preloadRoute(href: string) {
  const loader = routeLoaders[href];
  if (loader) void loader().catch(() => undefined);
}
