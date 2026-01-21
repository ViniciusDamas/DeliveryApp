// js/admin.js
// Admin: KPIs consolidados + pedidos + resumo por loja + seed demo

import { DATA, getStoreById } from "./data.js";
import { UI, money, toast, uid, nowISO, rand } from "./ui.js";
import { State, saveAllState, resetAllData } from "./storage.js";

function kpiCard(label, value) {
  return `
    <div class="kpi">
      <div class="kpi__label">${label}</div>
      <div class="kpi__value">${value}</div>
    </div>
  `;
}

function renderAdminKpis() {
  const orders = State.orders;

  const revenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const count = orders.length;
  const ticket = count ? revenue / count : 0;

  const delivered = orders.filter((o) => o.statusIndex >= 4).length;
  const inProgress = orders.filter((o) => o.statusIndex < 4).length;

  UI.adminKpis.innerHTML = [
    kpiCard("Pedidos", String(count)),
    kpiCard("Receita (simulada)", money(revenue)),
    kpiCard("Ticket médio", count ? money(ticket) : "-"),
    kpiCard("Entregues / Em andamento", `${delivered} / ${inProgress}`),
  ].join("");
}

function orderRowAdmin(o) {
  const dt = new Date(o.createdAt);
  const when = dt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  const items = (o.items || []).map((it) => `${it.qty}× ${it.name}`).join(", ");
  const status = ["Recebido", "Aceito", "Pago", "Em rota", "Entregue"][o.statusIndex] || "-";

  return `
    <div class="order">
      <div class="order__top">
        <div>
          <div class="order__id">${o.id}</div>
          <div class="order__meta">
            <span>${o.storeName || getStoreById(o.storeId)?.name || "Loja"}</span>
            <span class="muted">•</span>
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

function renderAdminOrders() {
  if (State.orders.length === 0) {
    UI.adminOrders.innerHTML = `<div class="note">Sem pedidos no sistema.</div>`;
    return;
  }
  UI.adminOrders.innerHTML = State.orders.map(orderRowAdmin).join("");
}

function renderAdminStores() {
  // resumo por loja
  const rows = DATA.stores.map((s) => {
    const orders = State.orders.filter((o) => o.storeId === s.id);
    const revenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
    const delivered = orders.filter((o) => o.statusIndex >= 4).length;
    const ticket = orders.length ? revenue / orders.length : 0;

    return {
      store: s,
      orders: orders.length,
      revenue,
      delivered,
      ticket,
    };
  });

  if (rows.every((r) => r.orders === 0)) {
    UI.adminStores.innerHTML = `<div class="note">Sem dados por loja ainda.</div>`;
    return;
  }

  UI.adminStores.innerHTML = rows
    .map((r) => {
      return `
        <div class="storebtn" style="cursor: default;">
          <div class="storebtn__name">${r.store.name}</div>
          <div class="storebtn__meta">
            <span>${r.store.niche}</span>
            <span class="muted">•</span>
            <span>Pedidos: ${r.orders}</span>
            <span class="muted">•</span>
            <span>Receita: ${money(r.revenue)}</span>
          </div>
          <div class="storebtn__meta">
            <span>Entregues: ${r.delivered}</span>
            <span class="muted">•</span>
            <span>Ticket: ${r.orders ? money(r.ticket) : "-"}</span>
            <span class="muted">•</span>
            <span>⭐ ${r.store.rating.toFixed(1)}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function randomItemsForStore(storeId) {
  const products = DATA.products.filter((p) => p.storeId === storeId);
  const pickCount = rand(1, Math.min(3, products.length));
  const picked = [];
  const used = new Set();

  while (picked.length < pickCount) {
    const p = products[rand(0, products.length - 1)];
    if (used.has(p.id)) continue;
    used.add(p.id);

    picked.push({
      productId: p.id,
      name: p.name,
      price: p.price,
      qty: rand(1, 3),
    });
  }

  return picked;
}

function buildDemoOrder() {
  const store = DATA.stores[rand(0, DATA.stores.length - 1)];
  const items = randomItemsForStore(store.id);

  const subtotal = items.reduce((acc, it) => acc + it.price * it.qty, 0);
  const deliveryFee = store.deliveryFee;
  const total = subtotal + deliveryFee;

  return {
    id: uid("ORD"),
    createdAt: nowISO(),
    storeId: store.id,
    storeName: store.name,
    items,
    subtotal,
    deliveryFee,
    total,
    paymethod: rand(0, 1) ? "pix" : "card",
    statusIndex: rand(0, 4),
    customer: { name: "Cliente Demo", phone: "(11) 90000-0000" },
    address: { line1: "Rua Exemplo, 123", district: "Centro", extra: "" },
  };
}

function seedDemoOrders() {
  const n = 6;
  for (let i = 0; i < n; i++) {
    State.orders.unshift(buildDemoOrder());
  }
  saveAllState();
  toast("Pedidos demo gerados");
  renderAdminView();
}

function clearAll() {
  resetAllData();
  toast("Tudo zerado");
  location.hash = "#login-admin";
}

export function renderAdminView() {
  renderAdminKpis();
  renderAdminOrders();
  renderAdminStores();
}

export function bindAdminEvents() {
  UI.adminSeedDemo?.addEventListener("click", seedDemoOrders);
  UI.adminClearAll?.addEventListener("click", clearAll);
}

