import { UI, show, hide, toast } from "./ui.js";
import { initRouter } from "./router.js";
import { loadAllState, State, saveAllState, resetAllData } from "./storage.js";
import { renderCustomer, bindCustomerEvents } from "./customer.js";
import { renderStoreView, bindStoreEvents } from "./store.js";
import { renderAdminView, bindAdminEvents } from "./admin.js";

const ROUTE_VIEWS = {
  cliente: "#view-cliente",
  loja: "#view-loja",
  admin: "#view-admin",
  "login-cliente": "#view-login-cliente",
  "login-loja": "#view-login-loja",
  "login-admin": "#view-login-admin",
};

let userBoxHomeParent = null;

function baseRoute(route) {
  return route.startsWith("login-") ? route.replace("login-", "") : route;
}

function routeRole(route) {
  if (route === "cliente") return "customer";
  if (route === "loja") return "store";
  if (route === "admin") return "admin";
  return null;
}

function isLoggedIn(role) {
  return Boolean(State.auth?.[role]?.loggedIn);
}

function guardRoute(route) {
  if (route === "cliente" && !isLoggedIn("customer")) return "login-cliente";
  if (route === "loja" && !isLoggedIn("store")) return "login-loja";
  if (route === "admin" && !isLoggedIn("admin")) return "login-admin";
  if (route === "login-cliente" && isLoggedIn("customer")) return "cliente";
  if (route === "login-loja" && isLoggedIn("store")) return "loja";
  if (route === "login-admin" && isLoggedIn("admin")) return "admin";
  return route;
}

function setActiveViewLink(route) {
  const target = baseRoute(route);
  document.querySelectorAll(".viewnav__link").forEach((a) => {
    a.classList.toggle("is-active", a.dataset.route === target);
  });
}

function updateUserBox(route) {
  const base = baseRoute(route);
  const role = routeRole(base);
  const data = role ? State.auth?.[role] : null;

  if (!role || !data?.loggedIn) {
    hide(UI.userBox);
    return;
  }

  if (UI.userRoleLabel) UI.userRoleLabel.textContent = base === "cliente" ? "Cliente" : base === "loja" ? "Loja" : "Admin";
  if (UI.userNameLabel) {
    if (role === "store") {
      const storeName = State.stores.find((s) => s.id === data.storeId)?.name || "Loja";
      UI.userNameLabel.textContent = `${storeName} (${data.operator || "Operador"})`;
    } else if (role === "admin") {
      UI.userNameLabel.textContent = data.email || "Admin";
    } else {
      UI.userNameLabel.textContent = data.name || data.phone || "Cliente";
    }
  }

  show(UI.userBox);
}

function syncUserBoxLocation(route) {
  if (!UI.userBox) return;
  if (!userBoxHomeParent) userBoxHomeParent = UI.userBox.parentElement;
  const target = route === "loja" ? UI.storeSidebarFooter : userBoxHomeParent;
  if (!target || UI.userBox.parentElement === target) return;
  target.appendChild(UI.userBox);
}

function closeUserMenu() {
  if (!UI.userBox) return;
  UI.userBox.classList.remove("is-open");
  UI.userMenuBtn?.setAttribute("aria-expanded", "false");
}

function initUserMenu() {
  if (!UI.userMenuBtn || !UI.userBox) return;

  UI.userMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = UI.userBox.classList.toggle("is-open");
    UI.userMenuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("click", (e) => {
    if (!UI.userBox.contains(e.target)) closeUserMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeUserMenu();
  });

  UI.openOrdersBtn?.addEventListener("click", closeUserMenu);

  if (UI.fxToggleBtn) {
    updateFxToggleUI();
    UI.fxToggleBtn.addEventListener("click", () => {
      toggleFxLite();
    });
  }
}

function renderLoginStoreOptions() {
  if (!UI.loginStoreSelect) return;
  const options = [
    `<option value="">Selecione uma loja</option>`,
    ...State.stores.map((s) => `<option value="${s.id}">${s.name}</option>`),
  ];
  UI.loginStoreSelect.innerHTML = options.join("");
  if (State.auth?.store?.storeId) {
    UI.loginStoreSelect.value = State.auth.store.storeId;
  }
}

function showView(route) {
  const guarded = guardRoute(route);
  if (guarded !== route) {
    location.hash = `#${guarded}`;
    return;
  }

  hide(UI.overlay);
  hide(UI.cartDrawer);
  hide(UI.ordersModal);
  hide(UI.scopeModal);
  closeUserMenu();

  Object.values(ROUTE_VIEWS).forEach((sel) => hide(document.querySelector(sel)));
  show(document.querySelector(ROUTE_VIEWS[route] || ROUTE_VIEWS.cliente));

  setActiveViewLink(route);
  document.body.dataset.route = route;
  updateUserBox(route);
  syncUserBoxLocation(route);

  if (route !== "cliente") {
    document.body.classList.remove("has-minicart");
    hide(UI.miniCartBar);
  }

  // Render por rota
  if (route === "cliente") renderCustomer();
  if (route === "loja") renderStoreView();
  if (route === "admin") renderAdminView();
  if (route === "login-loja") renderLoginStoreOptions();
}

function initGlobalOverlayBehavior() {
  UI.overlay?.addEventListener("click", () => {
    // fecha drawer/modal que estiver aberto
    hide(UI.cartDrawer);
    hide(UI.ordersModal);
    hide(UI.scopeModal);
    hide(UI.overlay);
  });
}

function handleCustomerLogin(e) {
  e.preventDefault();
  const name = (UI.loginCustomerName?.value || "").trim();
  const phone = (UI.loginCustomerPhone?.value || "").trim();
  const email = (UI.loginCustomerEmail?.value || "").trim();

  if (!name || !phone) {
    toast("Informe nome e WhatsApp.");
    return;
  }

  State.auth.customer = { loggedIn: true, name, phone, email };
  saveAllState();
  location.hash = "#cliente";
}

function handleStoreLogin(e) {
  e.preventDefault();
  const storeId = UI.loginStoreSelect?.value || "";
  const operator = (UI.loginStoreOperator?.value || "").trim();
  const email = (UI.loginStoreEmail?.value || "").trim();

  if (!storeId || !operator) {
    toast("Selecione a loja e informe o operador.");
    return;
  }

  State.filters.lojaSelectedStoreId = storeId;
  State.auth.store = { loggedIn: true, storeId, operator, email };
  saveAllState();
  location.hash = "#loja";
}

function handleAdminLogin(e) {
  e.preventDefault();
  const email = (UI.loginAdminEmail?.value || "").trim();
  const pass = (UI.loginAdminPass?.value || "").trim();

  if (!email || !pass) {
    toast("Informe email e senha.");
    return;
  }

  State.auth.admin = { loggedIn: true, name: "Admin", email };
  saveAllState();
  location.hash = "#admin";
}

function handleLogout() {
  closeUserMenu();
  const route = baseRoute((location.hash || "").replace("#", "") || "cliente");
  const role = routeRole(route);
  if (!role) return;

  if (role === "customer") {
    State.auth.customer = { loggedIn: false, name: "", phone: "", email: "" };
  }
  if (role === "store") {
    State.auth.store = { loggedIn: false, storeId: "", operator: "", email: "" };
  }
  if (role === "admin") {
    State.auth.admin = { loggedIn: false, name: "", email: "" };
  }

  saveAllState();
  location.hash = `#login-${route}`;
}

function init() {
  loadAllState();

  // garante UI fechada
  hide(UI.overlay);
  hide(UI.cartDrawer);
  hide(UI.ordersModal);
  hide(UI.scopeModal);

  initGlobalOverlayBehavior();

  // binds (uma vez)
  bindCustomerEvents();
  bindStoreEvents();
  bindAdminEvents();
  UI.loginCustomerForm?.addEventListener("submit", handleCustomerLogin);
  UI.loginStoreForm?.addEventListener("submit", handleStoreLogin);
  UI.loginAdminForm?.addEventListener("submit", handleAdminLogin);
  UI.logoutBtn?.addEventListener("click", handleLogout);
  initUserMenu();

  initRouter({
    defaultRoute: "cliente",
    onRoute: (route) => showView(route),
  });

  // Inicializa view atual
  const hash = (location.hash || "").replace("#", "") || "cliente";
  showView(hash);
}

document.addEventListener("DOMContentLoaded", init);

function setFxLite(enabled) {
  if (!document.body) return;
  document.body.classList.toggle("fx-lite", enabled);
  updateFxToggleUI();
}

function toggleFxLite() {
  if (!document.body) return false;
  document.body.classList.toggle("fx-lite");
  updateFxToggleUI();
  return document.body.classList.contains("fx-lite");
}

function updateFxToggleUI() {
  if (!UI.fxToggleBtn) return;
  const isLite = Boolean(document.body && document.body.classList.contains("fx-lite"));
  UI.fxToggleBtn.setAttribute("aria-pressed", isLite ? "true" : "false");
  if (UI.fxToggleBadge) UI.fxToggleBadge.textContent = isLite ? "On" : "Off";
}

// Expondo só para debug manual (opcional)
window.FL = {
  State,
  saveAllState,
  resetAllData,
  toast,
  fx: {
    enable: () => setFxLite(true),
    disable: () => setFxLite(false),
    toggle: () => toggleFxLite(),
    isLite: () => Boolean(document.body && document.body.classList.contains("fx-lite")),
  },
};



