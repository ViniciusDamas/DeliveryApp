export function initRouter({ defaultRoute = "cliente", onRoute }) {
  const routes = new Set(["cliente", "loja", "admin", "login-cliente", "login-loja", "login-admin"]);
  function normalize(hash) {
    const h = (hash || "").replace("#", "").trim();
    if (!h) return defaultRoute;
    if (routes.has(h)) return h;
    return defaultRoute;
  }

  function handle() {
    const route = normalize(location.hash);
    onRoute?.(route);
  }

  window.addEventListener("hashchange", handle);
  handle();
}
