// js/store.js
// Painel da Loja: KPIs, pedidos da loja e top produtos

import { DATA, getStoreById } from "./data.js";
import { UI, money } from "./ui.js";
import { State, saveAllState } from "./storage.js";

function selectedStoreId() {
  return State.filters.lojaSelectedStoreId || "all";
}

function setSelectedStoreId(id) {
  State.filters.lojaSelectedStoreId = id;
  saveAllState();
}

function ordersForStore(storeId) {
  if (storeId === "all") return State.orders;
  return State.orders.filter((o) => o.storeId === storeId);
}

function renderStoreSelect() {
  const options = [
    { id: "all", name: "Todas (consolidado)" },
    ...DATA.stores.map((s) => ({ id: s.id, name: s.name })),
  ];

  UI.storeSelectLoja.innerHTML = options
    .map((o) => `<option value="${o.id}">${o.name}</option>`)
    .join("");

  UI.storeSelectLoja.value = selectedStoreId();
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
  const sid = selectedStoreId();
  const store = sid === "all" ? null : getStoreById(sid);
  const orders = ordersForStore(sid);

  const revenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const count = orders.length;
  const ticket = count ? revenue / count : 0;

  const delivered = orders.filter((o) => o.statusIndex >= 4).length;
  const inProgress = orders.filter((o) => o.statusIndex < 4).length;

  const eta = store ? `${store.etaMin}–${store.etaMax} min` : "—";

  UI.storeKpis.innerHTML = [
    kpiCard("Pedidos", String(count)),
    kpiCard("Receita (simulada)", money(revenue)),
    kpiCard("Ticket médio", count ? money(ticket) : "—"),
    kpiCard("SLA alvo", store ? eta : "60–90 min"),
  ].join("");
}

function orderRowCompact(o) {
  const dt = new Date(o.createdAt);
  const when = dt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const items = (o.items || []).map((it) => `${it.qty}× ${it.name}`).join(", ");
  const status = ["Recebido", "Aceito", "Pago", "Em rota", "Entregue"][o.statusIndex] || "—";

  return `
    <div class="order">
      <div class="order__top">
        <div>
          <div class="order__id">${o.id}</div>
          <div class="order__meta">
            <span>${when}</span>
            <span class="muted">•</span>
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
  const sid = selectedStoreId();
  const orders = ordersForStore(sid);

  if (orders.length === 0) {
    UI.storeOrders.innerHTML = `<div class="note">Sem pedidos para esta loja ainda.</div>`;
    return;
  }

  UI.storeOrders.innerHTML = orders.map(orderRowCompact).join("");
}

function renderTopProducts() {
  const sid = selectedStoreId();
  const orders = ordersForStore(sid);

  // conta quantidades por produto
  const map = new Map(); // productName -> qty
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
    UI.storeTopProducts.innerHTML = `<div class="note">Sem dados ainda. Faça pedidos para gerar ranking.</div>`;
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

export function renderStoreView() {
  renderStoreSelect();
  renderStoreKpis();
  renderStoreOrders();
  renderTopProducts();
}

export function bindStoreEvents() {
  UI.storeSelectLoja?.addEventListener("change", (e) => {
    setSelectedStoreId(e.target.value);
    renderStoreView();
  });
}
