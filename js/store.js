// js/store.js
// Painel da Loja: KPIs, pedidos, top produtos e gestao do catalogo

import { UI, money, toast, uid } from "./ui.js";
import { State, saveAllState, getStoreById } from "./storage.js";

const STORE_SECTIONS = ["overview", "orders", "products"];
let activeSection = "overview";

function selectedStoreId() {
  return State.filters.lojaSelectedStoreId || "all";
}

function activeStoreId() {
  const authId = State.auth?.store?.storeId;
  return authId || selectedStoreId();
}

function setSelectedStoreId(id) {
  State.filters.lojaSelectedStoreId = id;
  saveAllState();
}

function ordersForStore(storeId) {
  if (!storeId || storeId === "all") return State.orders;
  return State.orders.filter((o) => o.storeId === storeId);
}

function storeProducts(storeId) {
  if (!storeId || storeId === "all") return [];
  return State.products.filter((p) => p.storeId === storeId);
}

function setActiveSection(section) {
  const next = STORE_SECTIONS.includes(section) ? section : STORE_SECTIONS[0];
  activeSection = next;

  UI.storeSections?.forEach((el) => {
    el.classList.toggle("is-active", el.dataset.storeSection === next);
  });

  UI.storeNavButtons?.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.storeNav === next);
  });
}

function toggleSidebar() {
  if (!UI.storeSidebar) return;
  const collapsed = UI.storeSidebar.classList.toggle("is-collapsed");
  UI.storeSidebarToggle?.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

function renderStoreSidebarInfo() {
  if (!UI.storeSidebarName) return;
  const store = getStoreById(activeStoreId());
  UI.storeSidebarName.textContent = store?.name || "Loja";
}

function renderStoreSelect() {
  if (!UI.storeSelectLoja) return;
  const storeId = activeStoreId();
  const store = storeId && storeId !== "all" ? getStoreById(storeId) : null;
  const options = store ? [{ id: store.id, name: store.name }] : State.stores;

  UI.storeSelectLoja.innerHTML = options
    .map((o) => `<option value="${o.id}">${o.name}</option>`)
    .join("");

  if (store) UI.storeSelectLoja.value = store.id;
  UI.storeSelectLoja.disabled = Boolean(State.auth?.store?.loggedIn);
}

function kpiCard(label, value) {
  return `
    <div class="kpi">
      <div class="kpi__label">${label}</div>
      <div class="kpi__value">${value}</div>
    </div>
  `;
}

function renderStoreKpis() {
  const sid = activeStoreId();
  const store = sid && sid !== "all" ? getStoreById(sid) : null;
  const orders = ordersForStore(sid);

  const revenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const count = orders.length;
  const ticket = count ? revenue / count : 0;

  const eta = store ? `${store.etaMin}-${store.etaMax} min` : "--";

  UI.storeKpis.innerHTML = [
    kpiCard("Pedidos", String(count)),
    kpiCard("Receita (simulada)", money(revenue)),
    kpiCard("Ticket medio", count ? money(ticket) : "--"),
    kpiCard("SLA alvo", store ? eta : "60-90 min"),
  ].join("");
}

function orderRowCompact(o) {
  const dt = new Date(o.createdAt);
  const when = dt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const items = (o.items || []).map((it) => `${it.qty}x ${it.name}`).join(", ");
  const status = ["Recebido", "Aceito", "Pago", "Em rota", "Entregue"][o.statusIndex] || "--";

  return `
    <div class="order">
      <div class="order__top">
        <div>
          <div class="order__id">${o.id}</div>
          <div class="order__meta">
            <span>${when}</span>
            <span class="muted">-</span>
            <span>${status}</span>
          </div>
        </div>
        <div class="order__id">${money(o.total)}</div>
      </div>
      <div class="order__items">${items}</div>
    </div>
  `;
}

function renderStoreOrders() {
  const sid = activeStoreId();
  const orders = ordersForStore(sid);

  if (orders.length === 0) {
    UI.storeOrders.innerHTML = `<div class="note">Sem pedidos para esta loja ainda.</div>`;
    return;
  }

  UI.storeOrders.innerHTML = orders.map(orderRowCompact).join("");
}

function renderTopProducts() {
  const sid = activeStoreId();
  const orders = ordersForStore(sid);

  const map = new Map();
  orders.forEach((o) => {
    (o.items || []).forEach((it) => {
      map.set(it.name, (map.get(it.name) || 0) + (it.qty || 0));
    });
  });

  const list = Array.from(map.entries())
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  if (list.length === 0) {
    UI.storeTopProducts.innerHTML = `<div class="note">Sem dados ainda. Faca pedidos para gerar ranking.</div>`;
    return;
  }

  UI.storeTopProducts.innerHTML = list
    .map(
      (x) => `
    <div class="toprow">
      <div class="toprow__left">
        <div class="toprow__name">${x.name}</div>
        <div class="toprow__meta">Quantidade vendida (simulada)</div>
      </div>
      <div class="toprow__right">${x.qty}</div>
    </div>
  `
    )
    .join("");
}

function categoryOptions() {
  const categories = Array.isArray(State.categories)
    ? State.categories.filter((c) => c.id !== "all")
    : [];

  if (categories.length) {
    return categories.map((c) => ({ id: c.id, label: c.label || c.id }));
  }

  const set = new Set(State.products.map((p) => p.category).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR")).map((c) => ({ id: c, label: c }));
}

function renderStoreProductCategories() {
  if (!UI.storeProductCategory) return;
  const list = categoryOptions();
  const options = [`<option value="">Selecione</option>`, ...list.map((c) => `<option value="${c.id}">${c.label}</option>`)];
  UI.storeProductCategory.innerHTML = options.join("");
}

function productRow(p) {
  const statusLabel = p.available ? "Ativo" : "Pausado";
  const rowClass = p.available ? "productrow" : "productrow productrow--off";

  return `
    <div class="${rowClass}">
      <div>
        <div class="productrow__name">${p.name}</div>
        <div class="productrow__meta">
          <span>${p.category}</span>
          <span class="muted">-</span>
          <span>${money(p.price)}</span>
          <span class="muted">-</span>
          <span>${statusLabel}</span>
        </div>
      </div>
      <div class="productrow__actions">
        <button class="btn btn--ghost btn--sm" type="button" data-toggle-product="${p.id}">
          ${p.available ? "Pausar" : "Ativar"}
        </button>
        <button class="btn btn--danger btn--sm" type="button" data-delete-product="${p.id}">
          Excluir
        </button>
      </div>
    </div>
  `;
}

function renderStoreProducts() {
  if (!UI.storeProductsList) return;
  const sid = activeStoreId();
  const list = storeProducts(sid).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  if (list.length === 0) {
    UI.storeProductsList.innerHTML = `<div class="note">Sua loja ainda nao tem produtos cadastrados.</div>`;
    return;
  }

  UI.storeProductsList.innerHTML = list.map(productRow).join("");
}

function parsePrice(value) {
  const normalized = String(value || "").replace(",", ".");
  const price = Number(normalized);
  return Number.isFinite(price) ? price : null;
}

function handleCreateProduct(e) {
  e.preventDefault();
  const storeId = activeStoreId();
  const store = storeId && storeId !== "all" ? getStoreById(storeId) : null;
  if (!store) {
    toast("Loja invalida.");
    return;
  }

  const name = (UI.storeProductName?.value || "").trim();
  const category = (UI.storeProductCategory?.value || "").trim();
  const price = parsePrice(UI.storeProductPrice?.value);
  const badge = (UI.storeProductBadge?.value || "").trim();
  const image = (UI.storeProductImage?.value || "").trim();
  const available = UI.storeProductAvailable?.checked ?? true;

  if (!name || !category || price === null) {
    toast("Preencha nome, categoria e preco.");
    return;
  }

  const product = {
    id: uid("PRD"),
    storeId,
    name,
    category,
    price,
    available,
    badge: badge || "",
    image: image || "",
  };

  State.products.unshift(product);
  saveAllState();
  UI.storeProductForm?.reset();
  if (UI.storeProductAvailable) UI.storeProductAvailable.checked = true;
  renderStoreProducts();
  toast("Produto criado.");
}

function handleProductActions(e) {
  const toggleBtn = e.target.closest("[data-toggle-product]");
  const deleteBtn = e.target.closest("[data-delete-product]");
  if (!toggleBtn && !deleteBtn) return;

  const id = (toggleBtn || deleteBtn)?.dataset?.toggleProduct || (toggleBtn || deleteBtn)?.dataset?.deleteProduct;
  const sid = activeStoreId();
  const product = State.products.find((p) => p.id === id);
  if (!product || product.storeId !== sid) return;

  if (toggleBtn) {
    product.available = !product.available;
  } else if (deleteBtn) {
    State.products = State.products.filter((p) => p.id !== id);
  }

  saveAllState();
  renderStoreProducts();
}

export function renderStoreView() {
  renderStoreSidebarInfo();
  renderStoreSelect();
  renderStoreKpis();
  renderStoreOrders();
  renderTopProducts();
  renderStoreProductCategories();
  renderStoreProducts();
  setActiveSection(activeSection);
}

export function bindStoreEvents() {
  UI.storeSelectLoja?.addEventListener("change", (e) => {
    if (State.auth?.store?.loggedIn) return;
    setSelectedStoreId(e.target.value);
    renderStoreView();
  });

  UI.storeNavButtons?.forEach((btn) => {
    btn.addEventListener("click", () => setActiveSection(btn.dataset.storeNav));
  });

  UI.storeSidebarToggle?.addEventListener("click", toggleSidebar);
  UI.storeProductForm?.addEventListener("submit", handleCreateProduct);
  UI.storeProductsList?.addEventListener("click", handleProductActions);
}
