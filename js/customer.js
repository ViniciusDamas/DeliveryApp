// js/customer.js
// View do Cliente: catálogo + filtros + carrinho + pedidos (modal)

import { PLACEHOLDER_IMG } from "./data.js";
import { UI, show, hide, toast, debounce, money, uid, nowISO } from "./ui.js";
import { State, saveAllState, getProductById, getStoreById } from "./storage.js";

const ORDER_STEPS = ["received", "accepted", "paid", "route", "done"];
const nowServingLine = document.querySelector("#nowServingLine");
let hasShownWelcome = false;

function computeCategories() {
  if (Array.isArray(State.categories) && State.categories.length) {
    return State.categories;
  }

  const set = new Set((State.products || []).map((p) => p.category));
  const cats = Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const placeholder = PLACEHOLDER_IMG || "./assets/products/placeholder.jpg";
  return [{ id: "all", label: "Todas", image: placeholder }, ...cats.map((c) => ({ id: c, label: c, image: placeholder }))];
}

function cartCount() {
  return State.cart.items.reduce((acc, it) => acc + (it.qty || 0), 0);
}

function cartSubtotal() {
  return State.cart.items.reduce((acc, it) => {
    const p = getProductById(it.productId);
    if (!p) return acc;
    return acc + p.price * it.qty;
  }, 0);
}

function cartStoreId() {
  return State.cart.storeId;
}

function cartDeliveryFee() {
  const sid = cartStoreId();
  if (!sid) return 0;
  const s = getStoreById(sid);
  return s?.deliveryFee || 0;
}

function cartTotal() {
  return cartSubtotal() + cartDeliveryFee();
}

function cartEta() {
  const sid = cartStoreId();
  if (!sid) return null;
  const s = getStoreById(sid);
  if (!s) return null;
  return Math.round((s.etaMin + s.etaMax) / 2);
}

function getSelectedPaymethod() {
  const checked = Array.from(UI.paymethodRadios || []).find((r) => r.checked);
  return checked?.value || "pix";
}

function normalizeWhatsAppNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function paymethodLabel(method) {
  if (method === "card") return "Cartao (simulado)";
  return "PIX";
}

function buildWhatsAppMessage(order) {
  const itemsLine = (order.items || []).map((it) => `${it.qty}x ${it.name}`).join(", ");
  const addrParts = [order.address?.line1, order.address?.district, order.address?.extra].filter(Boolean);
  const addressLine = addrParts.join(" - ");

  return [
    `Pedido ${order.id}`,
    `Itens: ${itemsLine}`,
    `Total: ${money(order.total)}`,
    `Pagamento: ${paymethodLabel(order.paymethod)}`,
    `Endereco: ${addressLine}`,
  ].join("\n");
}

function notifyStoreWhatsApp(order, store) {
  const number = normalizeWhatsAppNumber(store?.whatsapp);
  if (!number) {
    toast("Loja sem WhatsApp cadastrado.");
    return;
  }

  const message = buildWhatsAppMessage(order);
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  const win = window.open(url, "_blank", "noopener");
  if (!win) window.location.href = url;
}

function ensureCartSingleStore(product) {
  // regra: 1 pedido = 1 loja
  if (!State.cart.storeId) {
    State.cart.storeId = product.storeId;
    return true;
  }
  if (State.cart.storeId !== product.storeId) {
    toast("Seu carrinho já tem itens de outra loja. Finalize ou limpe o carrinho.");
    return false;
  }
  return true;
}

function addToCart(productId) {
  const p = getProductById(productId);
  if (!p) return false;

  if (!ensureCartSingleStore(p)) return false;

  const found = State.cart.items.find((it) => it.productId === productId);
  if (found) found.qty += 1;
  else State.cart.items.push({ productId, qty: 1 });

  saveAllState();
  updateCartUI();
  toast("Adicionado ao carrinho");
  return true;
}

function changeQty(productId, delta) {
  const it = State.cart.items.find((x) => x.productId === productId);
  if (!it) return;

  it.qty += delta;
  if (it.qty <= 0) {
    State.cart.items = State.cart.items.filter((x) => x.productId !== productId);
  }

  if (State.cart.items.length === 0) State.cart.storeId = null;

  saveAllState();
  updateCartUI();
}

function clearCart() {
  State.cart.items = [];
  State.cart.storeId = null;
  saveAllState();
  updateCartUI();
  toast("Carrinho limpo");
}

function validateCheckout() {
  const hasItems = State.cart.items.length > 0;
  if (!hasItems) {
    toast("Seu carrinho está vazio.");
    return false;
  }

  const name = (UI.customerName?.value || "").trim();
  const phone = (UI.customerPhone?.value || "").trim();
  const line1 = (UI.addressLine1?.value || "").trim();
  const district = (UI.addressDistrict?.value || "").trim();

  if (!name || !phone || !line1 || !district) {
    toast("Preencha nome, WhatsApp, rua/número e bairro.");
    return false;
  }

  return true;
}

function checkout() {
  if (!validateCheckout()) return;

  const sid = cartStoreId();
  const store = getStoreById(sid);
  if (!store) {
    toast("Selecione itens de uma loja válida.");
    return;
  }

  const items = State.cart.items.map((it) => {
    const p = getProductById(it.productId);
    return {
      productId: it.productId,
      name: p?.name || "Produto",
      price: p?.price || 0,
      qty: it.qty,
    };
  });

  const order = {
    id: uid("ORD"),
    createdAt: nowISO(),
    storeId: sid,
    storeName: store.name,
    items,
    subtotal: cartSubtotal(),
    deliveryFee: cartDeliveryFee(),
    total: cartTotal(),
    paymethod: getSelectedPaymethod(),
    statusIndex: 1, // simulação: pago e aceito -> Aceito já
    customer: {
      name: UI.customerName.value.trim(),
      phone: UI.customerPhone.value.trim(),
    },
    address: {
      line1: UI.addressLine1.value.trim(),
      district: UI.addressDistrict.value.trim(),
      extra: (UI.addressExtra?.value || "").trim(),
    },
  };

  State.orders.unshift(order);
  clearCart();

  saveAllState();
  notifyStoreWhatsApp(order, store);

  hide(UI.cartDrawer);
  hide(UI.overlay);

  updateOrdersUI();
  updateKpis();
  toast("Pedido enviado! (simulado)");
}

function nextStatusIndex(current) {
  return Math.min(current + 1, ORDER_STEPS.length - 1);
}

function simulateAdvanceOrders() {
  if (State.orders.length === 0) {
    toast("Não há pedidos.");
    return;
  }
  // avança o pedido mais recente que não terminou
  const idx = State.orders.findIndex((o) => o.statusIndex < ORDER_STEPS.length - 1);
  if (idx === -1) {
    toast("Todos os pedidos já estão entregues.");
    return;
  }
  State.orders[idx].statusIndex = nextStatusIndex(State.orders[idx].statusIndex);
  saveAllState();
  updateOrdersUI();
  updateKpis();
  toast("Status avançado (simulado)");
}

function resetOrders() {
  State.orders = [];
  saveAllState();
  updateOrdersUI();
  updateKpis();
  toast("Histórico zerado");
}

function applyScope() {
  State.scope.area = UI.scopeArea?.value || State.scope.area;
  State.scope.niche = UI.scopeNiche?.value || State.scope.niche;
  State.scope.hours = UI.scopeHours?.value || State.scope.hours;
  State.scope.sla = UI.scopeSla?.value || State.scope.sla;

  saveAllState();
  renderScopeBar();
  toast("Escopo aplicado");
}

function renderScopeBar() {
  if (UI.pilotArea) UI.pilotArea.textContent = State.scope.area;
  if (UI.pilotHours) UI.pilotHours.textContent = State.scope.hours;
  if (UI.pilotSla) UI.pilotSla.textContent = State.scope.sla;
  if (nowServingLine) {
    nowServingLine.textContent = `Atendendo agora: ${State.scope.area} | Ativo: ${State.scope.hours}`;
  }
}

function renderCategories() {
  const cats = computeCategories();

  UI.categoryList.innerHTML = cats
    .map((c) => {
      const id = c.id;
      const label = c.label || (id === "all" ? "Todas" : id);
      const active = State.filters.category === id ? "listbtn--active" : "";

      return `
        <button class="listbtn ${active}" data-cat="${id}" type="button" aria-label="Categoria ${label}">
          <div class="listbtn__title">${label}</div>
        </button>
      `;
    })
    .join("");
}

function renderStoresSidebar() {
  const storeTiles = [
    {
      id: "all",
      name: "Todas as lojas",
      niche: "Catalogo completo",
      rating: null,
    },
    ...State.stores.map((s) => ({
      id: s.id,
      name: s.name,
      niche: s.niche,
      rating: s.rating,
    })),
  ];

  UI.storeList.innerHTML = storeTiles
    .map((s) => {
      const active = State.filters.store === s.id ? "listbtn--active" : "";
      const r = s.rating ? `Rating ${s.rating.toFixed(1)}` : "Sem rating";

      return `
        <button class="listbtn ${active}" data-store="${s.id}" type="button" aria-label="Loja ${s.name}">
          <div class="listbtn__title">${s.name}</div>
          <div class="listbtn__meta">
            <span>${s.niche}</span>
            <span class="muted">-</span>
            <span>${r}</span>
          </div>
        </button>
      `;
    })
    .join("");
}

function sortProducts(list) {
  const s = State.filters.sort;
  const byPriceAsc = (a, b) => a.price - b.price;
  const byPriceDesc = (a, b) => b.price - a.price;
  const byStore = (a, b) => {
    const sa = getStoreById(a.storeId)?.name || "";
    const sb = getStoreById(b.storeId)?.name || "";
    return sa.localeCompare(sb, "pt-BR");
  };

  if (s === "price_asc") return [...list].sort(byPriceAsc);
  if (s === "price_desc") return [...list].sort(byPriceDesc);
  if (s === "store") return [...list].sort(byStore);
  return list; // relevance (do jeito que está)
}

function filterProducts() {
  const q = (State.filters.search || "").toLowerCase().trim();
  const cat = State.filters.category;
  const store = State.filters.store;

  let list = State.products.filter((p) => p.available);

  if (store !== "all") list = list.filter((p) => p.storeId === store);
  if (cat !== "all") list = list.filter((p) => p.category === cat);

  if (q) {
    list = list.filter((p) => {
      const storeName = getStoreById(p.storeId)?.name || "";
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        storeName.toLowerCase().includes(q)
      );
    });
  }

  list = sortProducts(list);

  // hint
  const hintParts = [];
  if (store !== "all") hintParts.push(`Loja: ${getStoreById(store)?.name || store}`);
  if (cat !== "all") hintParts.push(`Categoria: ${cat}`);
  if (q) hintParts.push(`Busca: "${q}"`);

  UI.resultsHint.textContent = hintParts.length
    ? `Filtrado para você: ${hintParts.join(" - ")}`
    : "Navegue com tranquilidade - entrega rápida na sua área.";

  return list;
}

function productCard(p) {
  const store = getStoreById(p.storeId);
  const img = p.image || PLACEHOLDER_IMG;

  const badgeHtml = p.badge ? `<span class="tag">${p.badge}</span>` : "";

  return `
    <article class="card card--product">
      <div class="card__imgwrap">
        ${badgeHtml}
        <img class="card__img" src="${img}" alt="${p.name}" onerror="this.src='${PLACEHOLDER_IMG}'" />
      </div>

      <div class="card__content">
        <h3 class="card__title">${p.name}</h3>

        <div class="card__meta">
          <span>${p.category}</span>
          <span class="muted">•</span>
          <span>${store ? store.niche : "Loja"}</span>
        </div>

        <div class="card__store">${store ? store.name : ""}</div>

        <div class="card__price">${money(p.price)}</div>

        <button class="btn btn--primary btn--wide" type="button" data-add="${p.id}">
          Adicionar
        </button>
      </div>
    </article>
  `;
}

function rowTargetCount(list, min = 3, max = 6) {
  if (!list.length) return 0;
  const target = Math.min(max, list.length);
  return target < min ? target : Math.max(min, target);
}

function splitByCategory(list) {
  const cat = State.filters.category;
  if (!cat || cat === "all") return { preferred: list, extra: [] };
  const preferred = list.filter((p) => p.category === cat);
  if (!preferred.length) return { preferred: list, extra: [] };
  const extra = list.filter((p) => p.category !== cat);
  return { preferred, extra };
}

function shuffleList(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildQuickPicks(preferred, extra, count) {
  const picks = [];
  const seen = new Set();
  const add = (p) => {
    if (!p || seen.has(p.id)) return;
    seen.add(p.id);
    picks.push(p);
  };

  const cheapest = [...preferred].sort((a, b) => a.price - b.price).slice(0, Math.min(3, preferred.length));
  cheapest.forEach(add);

  preferred.filter((p) => p.badge).forEach(add);

  if (picks.length < count) {
    extra.filter((p) => p.badge).forEach(add);
  }

  if (picks.length < count) {
    const remaining = [...preferred, ...extra].filter((p) => !seen.has(p.id));
    shuffleList(remaining)
      .slice(0, count - picks.length)
      .forEach(add);
  }

  return picks.slice(0, count);
}

function buildBestSellers(preferred, extra, count) {
  const picks = [];
  const seen = new Set();
  const add = (p) => {
    if (!p || seen.has(p.id)) return;
    seen.add(p.id);
    picks.push(p);
  };

  preferred.filter((p) => p.badge).forEach(add);
  shuffleList(preferred.filter((p) => !p.badge)).forEach(add);

  if (picks.length < count) {
    shuffleList(extra).forEach(add);
  }

  return picks.slice(0, count);
}

function buildStoreRow(storeProducts, count) {
  const { preferred, extra } = splitByCategory(storeProducts);
  const merged = [...shuffleList(preferred), ...shuffleList(extra)];
  return merged.slice(0, count);
}

function discoveryCard(p) {
  const img = p.image || PLACEHOLDER_IMG;
  return `
    <button class="discovery-card" type="button" data-add="${p.id}" aria-label="Adicionar ${p.name}">
      <div class="discovery-card__imgwrap">
        <img class="discovery-card__img" src="${img}" alt="${p.name}" onerror="this.src='${PLACEHOLDER_IMG}'" />
      </div>
      <div class="discovery-card__name">${p.name}</div>
      <div class="discovery-card__price">${money(p.price)}</div>
    </button>
  `;
}

function discoveryRow(title, items) {
  if (!items.length) return "";
  return `
    <section class="discovery__row">
      <div class="discovery__title">${title}</div>
      <div class="discovery__scroll">
        ${items.map(discoveryCard).join("")}
      </div>
    </section>
  `;
}

function renderDiscoveryRows() {
  const container = document.querySelector("#discoveryRows");
  if (!container) return;

  const available = State.products.filter((p) => p.available);
  if (!available.length) {
    container.innerHTML = "";
    return;
  }

  const { preferred, extra } = splitByCategory(available);
  const target = rowTargetCount(available);
  const rows = [];

  rows.push(discoveryRow("Escolhas rápidas", buildQuickPicks(preferred, extra, target)));
  rows.push(discoveryRow("Mais vendidos", buildBestSellers(preferred, extra, target)));

  const storeId = State.filters.store !== "all" ? State.filters.store : cartStoreId();
  if (storeId) {
    const storeProducts = available.filter((p) => p.storeId === storeId);
    const storeTarget = rowTargetCount(storeProducts);
    if (storeTarget) {
      rows.push(discoveryRow("Da sua loja selecionada", buildStoreRow(storeProducts, storeTarget)));
    }
  }

  container.innerHTML = rows.filter(Boolean).join("");
}

function renderProductGrid() {
  const list = filterProducts();
  UI.productGrid.innerHTML = list.map(productCard).join("");
}

function renderCartItems() {
  if (State.cart.items.length === 0) {
    UI.cartItems.innerHTML = `<div class="note">Seu carrinho está vazio.</div>`;
    return;
  }

  UI.cartItems.innerHTML = State.cart.items
    .map((it) => {
      const p = getProductById(it.productId);
      const store = p ? getStoreById(p.storeId) : null;
      const lineTotal = (p?.price || 0) * it.qty;

      return `
        <div class="cartitem">
          <div>
            <div class="cartitem__name">${p?.name || "Produto"}</div>
            <div class="cartitem__meta">${store?.name || ""} • ${money(p?.price || 0)}</div>
          </div>

          <div class="cartitem__qty">
            <button class="iconbtn" type="button" data-qty="${it.productId}" data-delta="-1">−</button>
            <span class="qty">${it.qty}</span>
            <button class="iconbtn" type="button" data-qty="${it.productId}" data-delta="1">+</button>
          </div>

          <div class="cartitem__total">${money(lineTotal)}</div>
        </div>
      `;
    })
    .join("");
}

function renderCartTotals() {
  UI.subtotalValue.textContent = money(cartSubtotal());
  UI.deliveryFeeValue.textContent = money(cartDeliveryFee());
  UI.totalValue.textContent = money(cartTotal());
}

function updateMiniCartBar() {
  if (!UI.miniCartBar) return;
  const count = cartCount();
  const shouldShow = count > 0 && document.body.dataset.route === "cliente";

  document.body.classList.toggle("has-minicart", shouldShow);

  if (!shouldShow) {
    hide(UI.miniCartBar);
    return;
  }

  if (UI.miniCartItemsCount) UI.miniCartItemsCount.textContent = String(count);
  if (UI.miniCartTotal) UI.miniCartTotal.textContent = money(cartTotal());

  const eta = cartEta();
  if (UI.miniCartEta) UI.miniCartEta.textContent = eta ? `${eta} min` : "—";

  show(UI.miniCartBar);
}

function updateCartUI() {
  if (UI.cartCount) UI.cartCount.textContent = String(cartCount());
  renderCartItems();
  renderCartTotals();
  updateMiniCartBar();
  renderDiscoveryRows();
}

function flashAddFeedback(btn) {
  if (!btn) return;
  const label = btn.dataset.defaultLabel || btn.textContent;
  btn.dataset.defaultLabel = label;
  btn.textContent = "Adicionado ✓";

  if (btn.dataset.addedTimer) {
    clearTimeout(Number(btn.dataset.addedTimer));
  }
  const timer = window.setTimeout(() => {
    btn.textContent = btn.dataset.defaultLabel || "Adicionar";
    btn.dataset.addedTimer = "";
  }, 900);
  btn.dataset.addedTimer = String(timer);
}

function stepPill(label, state) {
  // state: off | on | done
  const cls = state === "on" ? "step step--on" : state === "done" ? "step step--done" : "step";
  return `<span class="${cls}">${label}</span>`;
}

function orderRow(o) {
  const dt = new Date(o.createdAt);
  const when = dt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  const items = (o.items || [])
    .map((it) => `${it.qty}× ${it.name}`)
    .join(", ");

  const steps = ["Recebido", "Aceito", "Pago", "Em rota", "Entregue"]
    .map((label, i) => {
      if (i < o.statusIndex) return stepPill(label, "done");
      if (i === o.statusIndex) return stepPill(label, "on");
      return stepPill(label, "off");
    })
    .join("");

  return `
    <div class="order">
      <div class="order__top">
        <div>
          <div class="order__id">${o.id}</div>
          <div class="order__meta">
            <span>${o.storeName || getStoreById(o.storeId)?.name || "Loja"}</span>
            <span class="muted">•</span>
            <span>${when}</span>
          </div>
        </div>
        <div class="order__id">${money(o.total)}</div>
      </div>

      <div class="order__items">${items}</div>
      <div class="steps">${steps}</div>
    </div>
  `;
}

function updateOrdersUI() {
  if (UI.ordersBadge) UI.ordersBadge.textContent = String(State.orders.length);
  if (!UI.ordersList) return;

  if (State.orders.length === 0) {
    UI.ordersList.innerHTML = `<div class="note">Sem pedidos ainda. Faça um pedido para ver o status.</div>`;
    return;
  }

  UI.ordersList.innerHTML = State.orders.map(orderRow).join("");
}

function updateKpis() {
  // simples, baseado nos dados existentes (simulado)
  const orders = State.orders;
  if (orders.length === 0) {
    UI.kpiAvgTime.textContent = "—";
    UI.kpiCancel.textContent = "—";
    UI.kpiTicket.textContent = "—";
    return;
  }

  // tempo médio: usa ETA médio da loja (simulação)
  const avgEta = Math.round(
    orders.reduce((acc, o) => {
      const s = getStoreById(o.storeId);
      const eta = s ? (s.etaMin + s.etaMax) / 2 : 75;
      return acc + eta;
    }, 0) / orders.length
  );

  // cancelamentos: simulado (0 por enquanto)
  const cancels = 0;

  // ticket médio
  const avgTicket = orders.reduce((acc, o) => acc + (o.total || 0), 0) / orders.length;

  UI.kpiAvgTime.textContent = `${avgEta} min`;
  UI.kpiCancel.textContent = `${cancels}%`;
  UI.kpiTicket.textContent = money(avgTicket);
}

export function renderCustomer() {
  // aplica valores de UI conforme filtros/scope
  renderScopeBar();

  if (UI.searchInput) UI.searchInput.value = State.filters.search || "";
  if (UI.sortSelect) UI.sortSelect.value = State.filters.sort || "relevance";

  if (!hasShownWelcome) {
    toast(`Welcome back. Deliveries active until ${State.scope.hours}.`);
    hasShownWelcome = true;
  }

  renderCategories();
  renderStoresSidebar();
  renderProductGrid();
  renderDiscoveryRows();

  updateCartUI();
  updateOrdersUI();
  updateKpis();
}

export function bindCustomerEvents() {
  const openCart = () => {
    show(UI.overlay);
    show(UI.cartDrawer);
    updateCartUI();
  };

  // Search
  UI.searchInput?.addEventListener(
    "input",
    debounce((e) => {
      State.filters.search = e.target.value || "";
      saveAllState();
      renderProductGrid();
      renderDiscoveryRows();
    }, 180)
  );

  UI.clearSearchBtn?.addEventListener("click", () => {
    State.filters.search = "";
    if (UI.searchInput) UI.searchInput.value = "";
    saveAllState();
    renderProductGrid();
    renderDiscoveryRows();
  });

  // Sort
  UI.sortSelect?.addEventListener("change", (e) => {
    State.filters.sort = e.target.value;
    saveAllState();
    renderProductGrid();
    renderDiscoveryRows();
  });

  // Clicks no grid (delegação)
  UI.productGrid?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    if (addToCart(btn.dataset.add)) {
      flashAddFeedback(btn);
    }
  });

  const discoveryRows = document.querySelector("#discoveryRows");
  discoveryRows?.addEventListener("click", (e) => {
    const card = e.target.closest("[data-add]");
    if (!card) return;
    addToCart(card.dataset.add);
  });

  // Categorias (delegação)
  UI.categoryList?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    State.filters.category = btn.dataset.cat;
    saveAllState();
    renderCategories();
    renderProductGrid();
    renderDiscoveryRows();
  });

  // Lojas (delegação)
  UI.storeList?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-store]");
    if (!btn) return;
    State.filters.store = btn.dataset.store;
    saveAllState();
    renderStoresSidebar();
    renderProductGrid();
    renderDiscoveryRows();
  });

  // Cart open/close
  UI.openCartBtn?.addEventListener("click", openCart);
  UI.miniCartBar?.addEventListener("click", openCart);
  UI.miniCartBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    openCart();
  });
  UI.closeCartBtn?.addEventListener("click", () => {
    hide(UI.cartDrawer);
    hide(UI.overlay);
  });

  // Cart qty buttons (delegação)
  UI.cartItems?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-qty]");
    if (!b) return;
    const pid = b.dataset.qty;
    const delta = Number(b.dataset.delta || "0");
    if (!delta) return;
    changeQty(pid, delta);
  });

  UI.clearCartBtn?.addEventListener("click", clearCart);
  UI.checkoutBtn?.addEventListener("click", checkout);

  // Orders modal
  UI.openOrdersBtn?.addEventListener("click", () => {
    show(UI.overlay);
    show(UI.ordersModal);
    updateOrdersUI();
  });
  UI.closeOrdersBtn?.addEventListener("click", () => {
    hide(UI.ordersModal);
    hide(UI.overlay);
  });
  UI.simulateNextStepBtn?.addEventListener("click", simulateAdvanceOrders);
  UI.resetOrdersBtn?.addEventListener("click", resetOrders);

  // Scope modal
  UI.scopeBtn?.addEventListener("click", () => {
    // preenche selects com estado atual
    if (UI.scopeArea) UI.scopeArea.value = State.scope.area;
    if (UI.scopeNiche) UI.scopeNiche.value = State.scope.niche;
    if (UI.scopeHours) UI.scopeHours.value = State.scope.hours;
    if (UI.scopeSla) UI.scopeSla.value = State.scope.sla;

    show(UI.overlay);
    show(UI.scopeModal);
  });

  UI.closeScopeBtn?.addEventListener("click", () => {
    hide(UI.scopeModal);
    hide(UI.overlay);
  });

  UI.applyScopeBtn?.addEventListener("click", () => {
    applyScope();
    hide(UI.scopeModal);
    hide(UI.overlay);
  });

  // Botões do hero (simples)
  UI.startDemoBtn?.addEventListener("click", () => {
    // adiciona 1 item aleatório pra acelerar o demo
    const list = State.products;
    if (!list.length) {
      toast("Nao ha produtos disponiveis.");
      return;
    }
    const p = list[Math.floor(Math.random() * list.length)];
    addToCart(p.id);
    show(UI.overlay);
    show(UI.cartDrawer);
  });

  UI.viewMetricsBtn?.addEventListener("click", () => {
    toast("Métricas do piloto: veja Loja/Admin no topo.");
  });
}

