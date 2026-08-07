import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, MessageCircle, Minus, Plus, Search, Smartphone } from "lucide-react";
import api from "../services/api";
import Header from "../components/Header";

const GROUP_ICONS = ["🟡", "🟢", "🔵", "🟣", "🟠", "⚫"];

const DEFAULT_INTRO = "iPhones seleccionados en excelente estado, listos para usar.";
const DEFAULT_FOOTER = [
  "🧾 Precios en dólares.",
  "🛡️ Garantía de parte nuestra.",
  "🧪 Equipos revisados y testeados.",
  "📲 Pagos en dólares, pesos (transferencia o efectivo) o USDT. También aceptamos tarjetas.",
  "",
  "📌 Tipo de equipo:",
  "iPhones seleccionados en excelente estado, listos para usar.",
].join("\n");

function productSort(a, b) {
  const modelComparison = String(b.model || "").localeCompare(String(a.model || ""), "es", {
    numeric: true,
    sensitivity: "base",
  });
  if (modelComparison !== 0) return modelComparison;
  return Number.parseInt(b.storage, 10) - Number.parseInt(a.storage, 10);
}

function groupKey(product) {
  const storage = product.storage
    ? String(product.storage).replace(/(\d)\s*gb/i, "$1 GB")
    : "Sin capacidad";
  return `${product.model || "iPhone"}|||${storage}`;
}

function priceValue(product, priceOverrides) {
  const override = priceOverrides[product.id];
  return override === undefined ? Number(product.suggested_sale_price_usd || 0) : Number(override || 0);
}

function buildMessage(selectedProducts, priceOverrides, intro, footer) {
  const groups = new Map();
  [...selectedProducts].sort(productSort).forEach((product) => {
    const key = groupKey(product);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(product);
  });

  const sections = [...groups.entries()].map(([key, products], index) => {
    const [model, storage] = key.split("|||");
    const lines = products.map((product) => {
      const color = product.color || "Sin color";
      const battery = product.battery_health ? ` - ${product.battery_health}%` : "";
      const price = priceValue(product, priceOverrides);
      return `• ${color}${battery} — $${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    });
    return `${GROUP_ICONS[index % GROUP_ICONS.length]} *${model} — ${storage}*\n\n${lines.join("\n")}`;
  });

  return [intro.trim(), ...sections, footer.trim()].filter(Boolean).join("\n\n");
}

export default function WhatsAppListPage() {
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [priceOverrides, setPriceOverrides] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [intro, setIntro] = useState(DEFAULT_INTRO);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadStock() {
      try {
        const response = await api.get("/products/");
        const available = response.data
          .filter((product) => product.status === "in_stock")
          .sort(productSort);
        setProducts(available);
      } catch (requestError) {
        setError(requestError?.response?.data?.detail || "No se pudo cargar el stock.");
      } finally {
        setLoading(false);
      }
    }
    loadStock();
  }, []);

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return products;
    return products.filter((product) => [
      product.model,
      product.storage,
      product.color,
      product.battery_health,
    ].some((field) => String(field || "").toLowerCase().includes(value)));
  }, [products, search]);

  const selectedProducts = useMemo(() => {
    const ids = new Set(selectedIds);
    return products.filter((product) => ids.has(product.id));
  }, [products, selectedIds]);

  const message = useMemo(
    () => buildMessage(selectedProducts, priceOverrides, intro, footer),
    [selectedProducts, priceOverrides, intro, footer],
  );

  function toggleProduct(productId) {
    setSelectedIds((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
    setCopied(false);
  }

  function addVisible() {
    const visibleIds = filteredProducts.map((product) => product.id);
    setSelectedIds((current) => [...new Set([...current, ...visibleIds])]);
    setCopied(false);
  }

  function removeAll() {
    setSelectedIds([]);
    setCopied(false);
  }

  async function copyMessage() {
    if (!selectedProducts.length) return;
    try {
      let copiedWithClipboard = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(message);
          copiedWithClipboard = true;
        } catch {
          copiedWithClipboard = false;
        }
      }
      if (!copiedWithClipboard) {
        const textArea = document.createElement("textarea");
        textArea.value = message;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const copiedWithFallback = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!copiedWithFallback) throw new Error("copy_failed");
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("No se pudo copiar automáticamente. Seleccioná el texto de la vista previa.");
    }
  }

  return (
    <div>
      <Header title="Lista WhatsApp" subtitle="Armá un mensaje con los equipos disponibles" />

      {error && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] gap-5 items-start">
        <section className="bg-base-card border border-base-border rounded-2xl shadow-card overflow-hidden">
          <div className="p-5 border-b border-base-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="font-semibold text-base-text">Equipos en stock</h2>
                <p className="text-xs text-base-muted mt-0.5">{products.length} disponibles · {selectedIds.length} agregados</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addVisible}
                  disabled={filteredProducts.length === 0}
                  className="flex items-center gap-1.5 bg-xylo-500 hover:bg-xylo-600 disabled:opacity-50 text-white rounded-xl px-3 py-2 text-xs font-semibold transition"
                >
                  <Plus size={13} /> Agregar visibles
                </button>
                <button
                  type="button"
                  onClick={removeAll}
                  disabled={selectedIds.length === 0}
                  className="flex items-center gap-1.5 bg-base-subtle hover:bg-base-border disabled:opacity-50 text-base-muted rounded-xl px-3 py-2 text-xs font-semibold transition"
                >
                  <Minus size={13} /> Quitar todos
                </button>
              </div>
            </div>

            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar modelo, capacidad, color o batería..."
                className="w-full bg-base-subtle border border-base-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-base-text outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
              />
            </div>
          </div>

          <div className="divide-y divide-base-border max-h-[720px] overflow-y-auto">
            {loading ? (
              <p className="p-5 text-sm text-base-muted">Cargando stock...</p>
            ) : filteredProducts.length === 0 ? (
              <p className="p-5 text-sm text-base-muted">No hay equipos en stock que coincidan.</p>
            ) : filteredProducts.map((product) => {
              const selected = selectedIds.includes(product.id);
              return (
                <div key={product.id} className={`p-4 transition ${selected ? "bg-xylo-50/60 dark:bg-xylo-950/20" : "hover:bg-base-subtle/50"}`}>
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleProduct(product.id)}
                      className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border transition ${selected
                        ? "bg-xylo-500 border-xylo-500 text-white"
                        : "bg-base-card border-base-border text-base-muted hover:border-xylo-500"}`}
                      aria-label={selected ? `Quitar ${product.model}` : `Agregar ${product.model}`}
                    >
                      {selected ? <Check size={15} /> : <Plus size={15} />}
                    </button>

                    <button type="button" onClick={() => toggleProduct(product.id)} className="flex-1 min-w-0 text-left">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-base-text text-sm">{product.model}</p>
                          <p className="text-xs text-base-muted mt-0.5">
                            {product.storage || "Sin capacidad"} · {product.color || "Sin color"}
                            {product.battery_health ? ` · Batería ${product.battery_health}%` : ""}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-xylo-500 whitespace-nowrap">
                          USD {Number(product.suggested_sale_price_usd || 0).toLocaleString("en-US")}
                        </span>
                      </div>
                    </button>
                  </div>

                  {selected && (
                    <div className="mt-3 ml-11 flex items-center gap-2">
                      <label className="text-xs text-base-muted" htmlFor={`price-${product.id}`}>Precio en el mensaje</label>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-base-muted">$</span>
                        <input
                          id={`price-${product.id}`}
                          type="number"
                          min="0"
                          step="1"
                          value={priceOverrides[product.id] ?? product.suggested_sale_price_usd}
                          onChange={(event) => {
                            setPriceOverrides((current) => ({ ...current, [product.id]: event.target.value }));
                            setCopied(false);
                          }}
                          className="w-full bg-base-card border border-base-border rounded-lg pl-6 pr-2 py-1.5 text-sm text-base-text outline-none focus:border-xylo-500"
                        />
                      </div>
                      <span className="text-[10px] text-base-muted">No modifica el stock</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="xl:sticky xl:top-6 space-y-4">
          <div className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <h2 className="font-semibold text-base-text text-sm">Vista previa</h2>
                  <p className="text-xs text-base-muted">Formato listo para WhatsApp</p>
                </div>
              </div>
              <span className="text-xs font-semibold bg-base-subtle text-base-muted rounded-full px-2.5 py-1">
                {selectedProducts.length} equipo{selectedProducts.length !== 1 ? "s" : ""}
              </span>
            </div>

            <label className="block text-xs font-semibold text-base-muted mb-1.5">Introducción</label>
            <textarea
              value={intro}
              onChange={(event) => { setIntro(event.target.value); setCopied(false); }}
              rows={2}
              className="w-full bg-base-subtle border border-base-border rounded-xl px-3 py-2 text-sm text-base-text outline-none resize-y focus:border-xylo-500 mb-3"
            />

            <label className="block text-xs font-semibold text-base-muted mb-1.5">Información final</label>
            <textarea
              value={footer}
              onChange={(event) => { setFooter(event.target.value); setCopied(false); }}
              rows={7}
              className="w-full bg-base-subtle border border-base-border rounded-xl px-3 py-2 text-sm text-base-text outline-none resize-y focus:border-xylo-500"
            />
          </div>

          <div className="bg-[#efeae2] dark:bg-[#111b21] border border-base-border rounded-2xl p-4 shadow-card">
            {selectedProducts.length === 0 ? (
              <div className="min-h-48 flex flex-col items-center justify-center text-center px-6">
                <Smartphone size={28} className="text-base-muted mb-3" />
                <p className="text-sm font-medium text-base-text">Todavía no agregaste equipos</p>
                <p className="text-xs text-base-muted mt-1">Seleccioná los celulares para generar el mensaje.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#202c33] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <pre className="font-sans text-[14px] leading-relaxed text-[#111b21] dark:text-[#e9edef] whitespace-pre-wrap break-words">{message}</pre>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={copyMessage}
            disabled={selectedProducts.length === 0}
            className={`w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition shadow-sm ${copied
              ? "bg-green-600 text-white"
              : "bg-xylo-500 hover:bg-xylo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white"}`}
          >
            {copied ? <><Check size={16} /> Mensaje copiado</> : <><Clipboard size={16} /> Copiar mensaje</>}
          </button>
        </section>
      </div>
    </div>
  );
}
