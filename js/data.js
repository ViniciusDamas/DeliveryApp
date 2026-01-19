// js/data.js
// Dados mockados (catálogo curado + lojas)

export const PLACEHOLDER_IMG = "./assets/products/placeholder.jpg";

export const DATA = {
  categories: [
    { id: "all", label: "Todas", image: "./assets/categories/todas.png" },
    { id: "Cabos", label: "Cabos", image: "./assets/categories/cabos.png" },
    { id: "Carregadores", label: "Carregadores", image: "./assets/categories/carregadores.png" },
    { id: "Proteção", label: "Proteção", image: "./assets/categories/protecao.png" },
    { id: "Perfumes", label: "Perfumes", image: "./assets/categories/perfumes.png" },
    { id: "Cuidados", label: "Cuidados", image: "./assets/categories/cuidados.png" },
    { id: "Cadernos", label: "Cadernos", image: "./assets/categories/cadernos.png" },
    { id: "Canetas", label: "Canetas", image: "./assets/categories/canetas.png" },
  ],

  stores: [
    {
      id: "loja-01",
      name: "Turbo Acessórios",
      niche: "Acessórios de celular",
      districtCoverage: ["Centro", "Vila Nova", "Jardins"],
      deliveryFee: 7.9,
      etaMin: 60,
      etaMax: 90,
      rating: 4.8,
      whatsapp: "5541997277806",
      image: "./assets/stores/turbo-acessorios.png",
    },
    {
      id: "loja-02",
      name: "Essência Perfumaria",
      niche: "Perfumaria",
      districtCoverage: ["Centro", "Jardins"],
      deliveryFee: 9.9,
      etaMin: 60,
      etaMax: 90,
      rating: 4.7,
      whatsapp: "5541997277806",
      image: "./assets/stores/essencia-perfumaria.png",
    },
    {
      id: "loja-03",
      name: "Papel & Cia",
      niche: "Papelaria",
      districtCoverage: ["Centro", "Vila Nova"],
      deliveryFee: 6.9,
      etaMin: 60,
      etaMax: 90,
      rating: 4.6,
      whatsapp: "5541997277806",
      image: "./assets/stores/papel-e-cia.png",
    },
  ],

  products: [
    {
      id: "p-001",
      storeId: "loja-01",
      name: "Cabo USB-C Reforçado",
      category: "Cabos",
      price: 24.9,
      available: true,
      badge: "Campeão",
      image: "./assets/products/cabo-usbc.jpg",
    },
    {
      id: "p-002",
      storeId: "loja-01",
      name: "Carregador Turbo 20W",
      category: "Carregadores",
      price: 59.9,
      available: true,
      badge: "Entrega rápida",
      image: "./assets/products/carregador-20w.jpg",
    },
    {
      id: "p-003",
      storeId: "loja-01",
      name: "Película 3D Premium",
      category: "Proteção",
      price: 29.9,
      available: true,
      image: "./assets/products/pelicula-3d.jpg",
    },

    {
      id: "p-101",
      storeId: "loja-02",
      name: "Perfume Amadeirado 50ml",
      category: "Perfumes",
      price: 119.9,
      available: true,
      badge: "Top",
      image: "./assets/products/perfume-amadeirado.jpg",
    },
    {
      id: "p-102",
      storeId: "loja-02",
      name: "Hidratante 200ml",
      category: "Cuidados",
      price: 39.9,
      available: true,
      image: "./assets/products/hidratante-200.png",
    },
    {
      id: "p-103",
      storeId: "loja-02",
      name: "Desodorante Aerosol",
      category: "Cuidados",
      price: 19.9,
      available: true,
      image: "./assets/products/desodorante.png",
    },

    {
      id: "p-201",
      storeId: "loja-03",
      name: "Caderno Universitário 10 matérias",
      category: "Cadernos",
      price: 34.9,
      available: true,
      badge: "Mais vendido",
      image: "./assets/products/caderno-10m.png",
    },
    {
      id: "p-202",
      storeId: "loja-03",
      name: "Caneta Gel 0.7 (kit c/ 3)",
      category: "Canetas",
      price: 17.9,
      available: true,
      image: "./assets/products/caneta-gel.png",
    },
    {
      id: "p-203",
      storeId: "loja-03",
      name: "Marcador Texto (kit c/ 4)",
      category: "Canetas",
      price: 21.9,
      available: true,
      image: "./assets/products/marca-texto.png",
    },
  ],
};

export function getStoreById(id) {
  return DATA.stores.find((s) => s.id === id) || null;
}

export function getProductById(id) {
  return DATA.products.find((p) => p.id === id) || null;
}
