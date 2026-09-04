import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator, Search, CheckSquare, Square, ArrowRight, CreditCard, Smartphone, X } from "lucide-react";
import Header from "../components/Header";
import api from "../services/api";

function toArs(usd, rate) {
  if (!usd || !rate) return null;
  return Number(usd) * Number(rate);
}

function fmtUsd(v) {
  return `USD ${Number(v || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtArs(v) {
  if (v === null || v === undefined) return "-";
  return `ARS ${Number(v).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function TradeInCalculatorPage() {
  const navigate = useNavigate();

  // Datos generales
  const [exchange, setExchange] = useState(null);
  const [installmentRates, setInstallmentRates] = useState({});
  const [error, setError] = useState("");

  // Equipo a vender (de stock)
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Plan canje
  const [models, setModels] = useState([]);
  const [storages, setStorages] = useState([]);
  const [tiModel, setTiModel] = useState("");
  const [tiStorage, setTiStorage] = useState("");
  const [tiBattery, setTiBattery] = useState("");
  const [parts, setParts] = useState([]);
  const [partsSearch, setPartsSearch] = useState("");
  const [selectedPartIds, setSelectedPartIds] = useState(new Set());
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [tradeInIncluded, setTradeInIncluded] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/exchange-rates/active").catch(() => ({ data: null })),
      api.get("/settings/card-installment-rates").catch(() => ({ data: { rates: {} } })),
      api.get("/trade-in/models").catch(() => ({ data: [] })),
      api.get("/part-prices").catch(() => ({ data: [] })),
      api.get("/products/").catch(() => ({ data: [] })),
    ]).then(([exchangeRes, ratesRes, modelsRes, partsRes, productsRes]) => {
      setExchange(exchangeRes.data);
      setInstallmentRates(ratesRes.data.rates || {});
      setModels(modelsRes.data);
      setParts(partsRes.data);
      setProducts(productsRes.data.filter((p) => p.status === "in_stock"));
    });
  }, []);

  useEffect(() => {
    if (!tiModel) { setStorages([]); setTiStorage(""); return; }
    api.get("/trade-in/storages", { params: { model: tiModel } })
      .then((res) => setStorages(res.data))
      .catch(() => setStorages([]));
    setTiStorage("");
    setQuote(null);
  }, [tiModel]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products.slice(0, 20);
    return products.filter((p) =>
      [p.model, p.storage, p.color, p.imei].some((f) => String(f || "").toLowerCase().includes(term))
    ).slice(0, 20);
  }, [products, productSearch]);

  const filteredParts = useMemo(() => {
    const term = partsSearch.trim().toLowerCase();
    let list = parts;
    if (tiModel) {
      // Prioriza piezas que coincidan con el modelo elegido, sin ocultar el resto
      const matching = parts.filter((p) => p.label.toLowerCase().includes(tiModel.toLowerCase()));
      const rest = parts.filter((p) => !p.label.toLowerCase().includes(tiModel.toLowerCase()));
      list = [...matching, ...rest];
    }
    if (!term) return list;
    return list.filter((p) =>
      [p.label, p.category, p.notes].some((f) => String(f || "").toLowerCase().includes(term))
    );
  }, [parts, partsSearch, tiModel]);

  const selectedParts = useMemo(() => parts.filter((p) => selectedPartIds.has(p.id)), [parts, selectedPartIds]);

  function togglePart(id) {
    setSelectedPartIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function calculateQuote() {
    if (!tiModel || !tiStorage || tiBattery === "") return;
    setQuoteLoading(true);
    setQuoteError("");
    try {
      const res = await api.post("/trade-in/quote", {
        model: tiModel,
        storage: tiStorage,
        battery_health: Number(tiBattery),
        parts: [...selectedPartIds].map((id) => ({ part_price_id: id })),
      });
      setQuote(res.data);
    } catch (requestError) {
      setQuote(null);
      setQuoteError(requestError?.response?.data?.detail || "No se pudo calcular la cotización.");
    } finally {
      setQuoteLoading(false);
    }
  }

  const canCalculate = tiModel && tiStorage && tiBattery !== "";

  // ── Cuotas del equipo en stock ──────────────────────────────────────────
  const productPriceUsd = selectedProduct ? Number(selectedProduct.suggested_sale_price_usd) : 0;
  const tradeInDeductionUsd = tradeInIncluded && quote ? Number(quote.final_price_usd) : 0;
  const netPriceUsd = Math.max(productPriceUsd - tradeInDeductionUsd, 0);
  const netPriceArs = exchange ? toArs(netPriceUsd, exchange.sell_rate_ars) : null;

  const installmentRows = Object.entries(installmentRates)
    .map(([n, pct]) => ({ n: Number(n), pct: Number(pct) }))
    .sort((a, b) => a.n - b.n);

  function goToSale() {
    if (!selectedProduct) return;
    const params = new URLSearchParams();
    if (tradeInIncluded && quote) params.set("trade_in_value", String(quote.final_price_usd));
    navigate(`/sell/${selectedProduct.id}${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div>
      <Header title="Cotizador" subtitle="Plan canje y cuotas con tarjeta para equipos en stock" />

      {error && (
        <div className="mb-5 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* ── Panel: Equipo a vender ── */}
        <section className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card xl:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone size={16} className="text-base-muted" />
            <h3 className="text-sm font-semibold text-base-text">Equipo que vas a vender (opcional, para ver cuotas y vincular la venta)</h3>
          </div>

          {selectedProduct ? (
            <div className="flex items-center justify-between gap-3 bg-xylo-500/10 border border-xylo-500/30 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-base-text">{selectedProduct.model} {selectedProduct.storage}</p>
                <p className="text-xs text-base-muted">IMEI {selectedProduct.imei} · {fmtUsd(selectedProduct.suggested_sale_price_usd)}</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="p-1.5 rounded-lg hover:bg-base-card text-base-muted">
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-muted" />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar por modelo, color o IMEI..."
                className="w-full bg-base-subtle border border-base-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-base-text outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
              />
              {filteredProducts.length > 0 && (
                <div className="mt-2 border border-base-border rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProduct(p)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-base-subtle text-left border-b border-base-border last:border-0 transition"
                    >
                      <div>
                        <p className="text-sm font-medium text-base-text">{p.model} {p.storage}</p>
                        <p className="text-xs text-base-muted">IMEI {p.imei}</p>
                      </div>
                      <span className="text-xs font-semibold text-xylo-500">{fmtUsd(p.suggested_sale_price_usd)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Panel: Plan canje ── */}
        <section className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <Calculator size={16} className="text-base-muted" />
            <h3 className="text-sm font-semibold text-base-text">Plan canje</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-base-muted mb-1.5">Modelo entregado</p>
              <select
                value={tiModel}
                onChange={(e) => setTiModel(e.target.value)}
                className="w-full bg-base-subtle border border-base-border rounded-xl px-3 py-2.5 text-sm text-base-text outline-none focus:border-xylo-500"
              >
                <option value="">Elegir...</option>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs text-base-muted mb-1.5">Almacenamiento</p>
              <select
                value={tiStorage}
                onChange={(e) => setTiStorage(e.target.value)}
                disabled={!tiModel}
                className="w-full bg-base-subtle border border-base-border rounded-xl px-3 py-2.5 text-sm text-base-text outline-none focus:border-xylo-500 disabled:opacity-50"
              >
                <option value="">Elegir...</option>
                {storages.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs text-base-muted mb-1.5">% Batería</p>
              <input
                type="number"
                min="0"
                max="100"
                value={tiBattery}
                onChange={(e) => setTiBattery(e.target.value)}
                placeholder="0-100"
                className="w-full bg-base-subtle border border-base-border rounded-xl px-3 py-2.5 text-sm text-base-text outline-none focus:border-xylo-500"
              />
            </div>
          </div>

          {/* Piezas a descontar */}
          <div>
            <p className="text-xs font-medium text-base-muted mb-2">Reparaciones a descontar del valor de canje (opcional)</p>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-muted" />
              <input
                value={partsSearch}
                onChange={(e) => setPartsSearch(e.target.value)}
                placeholder="Buscar pieza..."
                className="w-full bg-base-subtle border border-base-border rounded-xl pl-9 pr-3 py-2 text-sm text-base-text outline-none focus:border-xylo-500"
              />
            </div>
            <div className="border border-base-border rounded-xl max-h-40 overflow-y-auto divide-y divide-base-border">
              {filteredParts.length === 0 ? (
                <p className="text-xs text-base-muted px-3 py-3">No hay piezas cargadas todavía.</p>
              ) : filteredParts.slice(0, 30).map((part) => {
                const isSelected = selectedPartIds.has(part.id);
                return (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => togglePart(part.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition ${isSelected ? "bg-xylo-500/10" : "hover:bg-base-subtle"}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isSelected ? <CheckSquare size={15} className="text-xylo-500 flex-shrink-0" /> : <Square size={15} className="text-base-muted flex-shrink-0" />}
                      <span className="text-sm text-base-text truncate">{part.category} · {part.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-base-muted flex-shrink-0">{fmtUsd(part.price_usd)}</span>
                  </button>
                );
              })}
            </div>
            {selectedParts.length > 0 && (
              <p className="text-xs text-base-muted mt-1.5">{selectedParts.length} pieza{selectedParts.length !== 1 ? "s" : ""} seleccionada{selectedParts.length !== 1 ? "s" : ""} · Total a descontar: {fmtUsd(selectedParts.reduce((s, p) => s + Number(p.price_usd), 0))}</p>
            )}
          </div>

          <button
            type="button"
            onClick={calculateQuote}
            disabled={!canCalculate || quoteLoading}
            className="w-full flex items-center justify-center gap-2 bg-xylo-500 hover:bg-xylo-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold transition"
          >
            {quoteLoading ? "Calculando..." : "Calcular valor de canje"}
          </button>

          {quoteError && <p className="text-xs text-red-500">{quoteError}</p>}

          {quote && (
            <div className="bg-base-subtle border border-base-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-base-muted">Precio base ({quote.model} {quote.storage}, {quote.battery_health}%)</span>
                <span className="font-medium text-base-text">{fmtUsd(quote.base_price_usd)}</span>
              </div>
              {quote.deductions.map((d) => (
                <div key={d.part_price_id} className="flex items-center justify-between text-xs text-red-500">
                  <span>− {d.category} {d.label}</span>
                  <span>−{fmtUsd(d.price_usd)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-base-border">
                <span className="text-sm font-semibold text-base-text">Valor de canje final</span>
                <span className="text-lg font-bold text-xylo-500">{fmtUsd(quote.final_price_usd)}</span>
              </div>
              {exchange && (
                <p className="text-xs text-base-muted text-right">≈ {fmtArs(toArs(quote.final_price_usd, exchange.buy_rate_ars))}</p>
              )}

              {selectedProduct && (
                <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={tradeInIncluded}
                    onChange={(e) => setTradeInIncluded(e.target.checked)}
                    className="w-4 h-4 rounded accent-xylo-500"
                  />
                  <span className="text-xs text-base-text">Descontar este canje del precio de {selectedProduct.model}</span>
                </label>
              )}
            </div>
          )}
        </section>

        {/* ── Panel: Cuotas ── */}
        <section className="bg-base-card border border-base-border rounded-2xl p-5 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-base-muted" />
            <h3 className="text-sm font-semibold text-base-text">Cuotas con tarjeta</h3>
          </div>

          {!selectedProduct ? (
            <p className="text-sm text-base-muted">Elegí un equipo en stock arriba para ver el desglose de cuotas.</p>
          ) : !exchange ? (
            <p className="text-sm text-base-muted">No hay cotización de dólar cargada todavía.</p>
          ) : (
            <>
              <div className="bg-base-subtle border border-base-border rounded-xl p-4 space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-base-muted">Precio {selectedProduct.model}</span>
                  <span className="font-medium text-base-text">{fmtUsd(productPriceUsd)}</span>
                </div>
                {tradeInIncluded && quote && (
                  <div className="flex items-center justify-between text-sm text-red-500">
                    <span>− Canje</span>
                    <span>−{fmtUsd(tradeInDeductionUsd)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1.5 border-t border-base-border">
                  <span className="text-sm font-semibold text-base-text">Neto a pagar</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-xylo-500">{fmtUsd(netPriceUsd)}</p>
                    <p className="text-xs text-base-muted">{fmtArs(netPriceArs)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                {installmentRows.map(({ n, pct }) => {
                  const totalArs = netPriceArs ? netPriceArs * (1 + pct / 100) : null;
                  const perInstallmentArs = totalArs ? totalArs / n : null;
                  return (
                    <div key={n} className="flex items-center justify-between px-3 py-2 rounded-lg bg-base-subtle text-sm">
                      <span className="text-base-text">{n} cuota{n !== 1 ? "s" : ""} <span className="text-xs text-base-muted">(+{pct}%)</span></span>
                      <div className="text-right">
                        <p className="font-semibold text-base-text">{fmtArs(perInstallmentArs)} c/u</p>
                        <p className="text-xs text-base-muted">Total {fmtArs(totalArs)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={goToSale}
                className="w-full flex items-center justify-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl py-2.5 text-sm font-semibold transition"
              >
                Ir a vender este equipo <ArrowRight size={15} />
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
