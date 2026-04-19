export const ACCESSORY_TYPE_OPTIONS = [
  "Cargador",
  "Cable",
  "Funda / Case",
  "AirPods",
  "Apple Watch",
  "Banda Apple Watch",
  "MagSafe",
  "Adaptador",
  "Auriculares",
  "Soporte",
  "Otro",
];

export const CATEGORY_OPTIONS = [
  "iPhone",
  "iPad",
  "Mac",
  "Apple Watch",
  "AirPods",
  "Accesorio",
  "Combo",
];

export const COMBO_ITEMS = [
  "Base de carga",
  "Base de carga MagSafe",
  "Cable Lightning",
  "Cable USB-C",
  "Adaptador 20W",
  "Adaptador 30W",
  "Adaptador 35W",
  "Auriculares EarPods Lightning",
  "Auriculares EarPods USB-C",
  "Funda transparente",
  "Funda de silicona",
  "Protector de pantalla",
  "Paño de limpieza",
  "Apple Pencil",
];

export const COMBO_TEMPLATES = [
  { name: "Base + Cable USB-C", items: ["Base de carga", "Cable USB-C"] },
  { name: "Carga Rápida 20W", items: ["Base de carga", "Cable USB-C", "Adaptador 20W"] },
  { name: "Carga MagSafe", items: ["Base de carga MagSafe", "Cable USB-C", "Adaptador 20W"] },
  { name: "Funda + Protector", items: ["Funda transparente", "Protector de pantalla"] },
  { name: "Kit completo", items: ["Base de carga", "Cable USB-C", "Adaptador 20W", "Funda transparente"] },
];

export const CONDITION_OPTIONS = [
  "Nuevo",
  "Usado",
];

export const COSMETIC_CONDITION_OPTIONS = [
  "Excelente",
  "Muy bueno",
  "Bueno",
  "Regular",
];

export const FUNCTIONAL_CONDITION_OPTIONS = [
  "Perfecto",
  "Detalles leves",
  "Revisar",
];

export const SIM_TYPE_OPTIONS = [
  "eSIM",
  "Nano SIM",
  "eSIM + Nano SIM",
];

export const SUPPLIER_OPTIONS = [
  "Proveedor local",
  "Distribuidor Apple",
  "Permuta / usado recibido",
  "Cliente particular",
];

export const IPHONE_OPTIONS = {
  "iPhone 11": {
    storages: ["64GB", "128GB", "256GB"],
    colors: ["Black", "White", "Green", "Yellow", "Purple", "Red"],
  },
  "iPhone 11 Pro": {
    storages: ["64GB", "256GB", "512GB"],
    colors: ["Space Gray", "Silver", "Gold", "Midnight Green"],
  },
  "iPhone 11 Pro Max": {
    storages: ["64GB", "256GB", "512GB"],
    colors: ["Space Gray", "Silver", "Gold", "Midnight Green"],
  },
  "iPhone 12": {
    storages: ["64GB", "128GB", "256GB"],
    colors: ["Black", "White", "Blue", "Green", "Purple", "Red"],
  },
  "iPhone 12 Pro": {
    storages: ["128GB", "256GB", "512GB"],
    colors: ["Silver", "Graphite", "Gold", "Pacific Blue"],
  },
  "iPhone 12 Pro Max": {
    storages: ["128GB", "256GB", "512GB"],
    colors: ["Silver", "Graphite", "Gold", "Pacific Blue"],
  },
  "iPhone 13": {
    storages: ["128GB", "256GB", "512GB"],
    colors: ["Midnight", "Starlight", "Blue", "Pink", "Red", "Green"],
  },
  "iPhone 13 Pro": {
    storages: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Graphite", "Silver", "Gold", "Sierra Blue", "Alpine Green"],
  },
  "iPhone 13 Pro Max": {
    storages: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Graphite", "Silver", "Gold", "Sierra Blue", "Alpine Green"],
  },
  "iPhone 14": {
    storages: ["128GB", "256GB", "512GB"],
    colors: ["Midnight", "Starlight", "Blue", "Purple", "Red", "Yellow"],
  },
  "iPhone 14 Pro": {
    storages: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Space Black", "Silver", "Gold", "Deep Purple"],
  },
  "iPhone 14 Pro Max": {
    storages: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Space Black", "Silver", "Gold", "Deep Purple"],
  },
  "iPhone 15": {
    storages: ["128GB", "256GB", "512GB"],
    colors: ["Black", "Blue", "Green", "Yellow", "Pink"],
  },
  "iPhone 15 Pro": {
    storages: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Black Titanium", "White Titanium", "Blue Titanium", "Natural Titanium"],
  },
  "iPhone 15 Pro Max": {
    storages: ["256GB", "512GB", "1TB"],
    colors: ["Black Titanium", "White Titanium", "Blue Titanium", "Natural Titanium"],
  },
  "iPhone 16": {
    storages: ["128GB", "256GB", "512GB"],
    colors: ["Black", "White", "Pink", "Teal", "Ultramarine"],
  },
  "iPhone 16 Pro": {
    storages: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Black Titanium", "White Titanium", "Natural Titanium", "Desert Titanium"],
  },
  "iPhone 16 Pro Max": {
    storages: ["256GB", "512GB", "1TB"],
    colors: ["Black Titanium", "White Titanium", "Natural Titanium", "Desert Titanium"],
  },
  "iPhone 17": {
    storages: ["128GB", "256GB", "512GB"],
    colors: ["Black", "White", "Pink", "Teal", "Ultramarine", "Desert", "Red", "Blue"],
  },
  "iPhone 17 Air": {
    storages: ["128GB", "256GB", "512GB"],
    colors: ["Black", "White", "Pink", "Teal", "Ultramarine", "Desert", "Red", "Blue"],
  },
  "iPhone 17 Pro": {
    storages: ["256GB", "512GB", "1TB"],
    colors: ["Silver Titanium", "Orange Titanium", "Blue Titanium"],
  },
  "iPhone 17 Pro Max": {
    storages: ["256GB", "512GB", "1TB"],
    colors: ["Silver Titanium", "Orange Titanium", "Blue Titanium"],
  },
};

export const MODEL_OPTIONS = Object.keys(IPHONE_OPTIONS);