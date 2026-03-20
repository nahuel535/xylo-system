import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";

const METHODS = [
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "permuta", label: "Permuta" },
  { value: "cripto", label: "Cripto" },
];

export default function SellProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    seller_id: 1,
    sale_price_usd: "",
    client_name: "",
    notes: "",
    status: "completed",
  });

  const [pay1, setPay1] = useState({
    method: "transferencia",
    amount_usd: "",
    reference: "",
  });

  const [pay2, setPay2] = useState({
    enabled: false,
    method: "efectivo",
    amount_usd: "",
    reference: "",
  });

  useEffect(() => {
    async function loadProduct() {
      try {
        const [productRes, exchangeRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get("/exchange-rates/active"),
        ]);
        const productData = productRes.data;
        setProduct(productData);
        setExchange(exchangeRes.data);
        const suggestedPrice = productData.suggested_sale_price_usd || "";
        setForm((prev) => ({ ...prev, sale_price_usd: suggestedPrice }));
        setPay1((prev) => ({ ...prev, amount_usd: suggestedPrice }));
      } catch (error) {
        console.error("Error cargando producto:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const payments = [
      {
        method: pay1.method,
        amount_usd: Number(pay1.amount_usd),
        installments: null,
        surcharge_usd: null,
        commission_usd: null,
        reference: pay1.reference || null,
      },
    ];

    if (pay2.enabled && pay2.amount_usd) {
      payments.push({
        method: pay2.method,
        amount_usd: Number(pay2.amount_usd),
        installments: null,
        surcharge_usd: null,
        commission_usd: null,
        reference: pay2.reference || null,
      });
    }

    try {
      await api.post("/sales/", {
        product_id: Number(id),
        seller_id: Number(form.seller_id),
        sale_price_usd: Number(form.sale_price_usd),
        client_name: form.client_name || null,
        notes: form.notes || null,
        has_trade_in: false,
        trade_in_value_usd: null,
        has_deposit: false,
        deposit_amount_usd: null,
        remaining_balance_usd: null,
        status: form.status,
        payments,
      });
      navigate("/products");
    } catch (error) {
      setMessage(error?.response?.data?.detail || "Error al registrar la venta.");
    }
  }

  if (loading) return <p className="text-base-muted">Cargando producto...</p>;
  if (!product) return <p className="text-base-muted">Producto no encontrado.</p>;
  if (product.status !== "in_stock") {
    return (
      <div className="max-w-2xl mx-auto">
        <Header title="Producto no disponible" subtitle="Este equipo ya no está en stock" />
        <div className="bg-base-card border border-base-border rounded-2xl p-6 shadow-card">
          <p className="text-base-muted mb-4">Este producto ya fue vendido o no está disponible.</p>
          <button onClick={() => navigate(`/products/${id}`)} className="bg-base-subtle hover:bg-base-border transition rounded-xl px-5 py-3 text-sm text-base-muted">
            Volver al detalle
          </button>
        </div>
      </div>
    );
  }

  const inputClass = "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-3 text-base-text outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition";
  const selectClass = inputClass;

  // Balance check
  const salePrice = Number(form.sale_price_usd || 0);
  const totalPaid = Number(pay1.amount_usd || 0) + (pay2.enabled ? Number(pay2.amount_usd || 0) : 0);
  const diff = salePrice - totalPaid;

  return (
    <div className="max-w-3xl mx-auto">
      <Header title={`Vender ${product.model}`} subtitle={`Equipo #${product.id}`} />

      {/* Info del producto */}
      <div className="bg-base-card border border-base-border rounded-2xl p-5 mb-5 shadow-card">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <InfoItem label="Modelo" value={product.model} />
          <InfoItem label="IMEI" value={product.imei} mono />
          <InfoItem label="Costo USD" value={`USD ${product.purchase_price_usd}`} />
          <InfoItem label="Costo ARS" value={exchange ? `ARS ${toArs(product.purchase_price_usd, exchange.buy_rate_ars)}` : "-"} />
          <InfoItem label="Precio sugerido USD" value={`USD ${product.suggested_sale_price_usd}`} />
          <InfoItem label="Precio sugerido ARS" value={exchange ? `ARS ${toArs(product.suggested_sale_price_usd, exchange.sell_rate_ars)}` : "-"} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-base-card border border-base-border rounded-2xl p-6 space-y-5 shadow-card">

        {/* Precio de venta + cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <p className="text-sm text-base-muted mb-2">Precio de venta USD</p>
            <input
              name="sale_price_usd"
              value={form.sale_price_usd}
              onChange={handleChange}
              className={inputClass}
              type="number"
              min="0"
              step="0.01"
            />
          </div>
          <ReadOnlyField
            label="Precio de venta ARS"
            value={exchange && form.sale_price_usd ? `ARS ${toArs(form.sale_price_usd, exchange.sell_rate_ars)}` : "-"}
          />
          <div className="md:col-span-2">
            <p className="text-sm text-base-muted mb-2">Cliente</p>
            <input name="client_name" value={form.client_name} onChange={handleChange} className={inputClass} placeholder="Nombre del cliente (opcional)" />
          </div>
        </div>

        {/* Sección de pagos */}
        <div className="border border-base-border rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold text-base-text">Cobro</p>

          {/* Pago 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-base-muted mb-2">Método 1</p>
              <select value={pay1.method} onChange={(e) => setPay1((p) => ({ ...p, method: e.target.value }))} className={selectClass}>
                {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <p className="text-sm text-base-muted mb-2">Monto USD</p>
              <input
                value={pay1.amount_usd}
                onChange={(e) => setPay1((p) => ({ ...p, amount_usd: e.target.value }))}
                className={inputClass}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div>
              <p className="text-sm text-base-muted mb-2">Referencia</p>
              <input
                value={pay1.reference}
                onChange={(e) => setPay1((p) => ({ ...p, reference: e.target.value }))}
                className={inputClass}
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Pago 2 */}
          {!pay2.enabled ? (
            <button
              type="button"
              onClick={() => setPay2((p) => ({ ...p, enabled: true }))}
              className="text-xs text-xylo-500 hover:text-xylo-600 transition font-medium flex items-center gap-1"
            >
              + Agregar segundo método de pago
            </button>
          ) : (
            <>
              <div className="border-t border-base-border pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-base-muted mb-2">Método 2</p>
                  <select value={pay2.method} onChange={(e) => setPay2((p) => ({ ...p, method: e.target.value }))} className={selectClass}>
                    {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-sm text-base-muted mb-2">Monto USD</p>
                  <input
                    value={pay2.amount_usd}
                    onChange={(e) => setPay2((p) => ({ ...p, amount_usd: e.target.value }))}
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <p className="text-sm text-base-muted mb-2">Referencia</p>
                  <input
                    value={pay2.reference}
                    onChange={(e) => setPay2((p) => ({ ...p, reference: e.target.value }))}
                    className={inputClass}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPay2({ enabled: false, method: "efectivo", amount_usd: "", reference: "" })}
                className="text-xs text-red-400 hover:text-red-500 transition font-medium"
              >
                × Quitar segundo pago
              </button>
            </>
          )}

          {/* Balance */}
          {salePrice > 0 && diff !== 0 && (
            <div className={`text-xs px-3 py-2 rounded-lg border ${diff > 0 ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-red-50 text-red-500 border-red-100"}`}>
              {diff > 0
                ? `Faltan cubrir USD ${diff.toFixed(2)} (total cobrado: USD ${totalPaid.toFixed(2)})`
                : `Exceso de USD ${Math.abs(diff).toFixed(2)} sobre el precio de venta`}
            </div>
          )}
          {salePrice > 0 && diff === 0 && totalPaid > 0 && (
            <div className="text-xs px-3 py-2 rounded-lg border bg-green-50 text-green-600 border-green-100">
              ✓ Pago completo — USD {totalPaid.toFixed(2)}
            </div>
          )}
        </div>

        {/* Notas */}
        <div>
          <p className="text-sm text-base-muted mb-2">Notas</p>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="w-full min-h-[90px] bg-base-subtle border border-base-border rounded-xl px-4 py-3 text-base-text outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
            placeholder="Observaciones de la venta"
          />
        </div>

        {message && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{message}</p>
        )}

        <div className="flex gap-3">
          <button type="submit" className="bg-xylo-500 hover:bg-xylo-600 transition text-white rounded-xl px-6 py-3 font-medium shadow-sm">
            Confirmar venta
          </button>
          <button type="button" onClick={() => navigate(-1)} className="bg-base-subtle hover:bg-base-border transition text-base-muted rounded-xl px-6 py-3 text-sm">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function InfoItem({ label, value, mono = false }) {
  return (
    <div className="bg-base-subtle rounded-xl p-3">
      <p className="text-xs text-base-muted mb-1">{label}</p>
      <p className={`text-sm font-medium text-base-text ${mono ? "font-mono text-xs" : ""}`}>{value || "-"}</p>
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="text-sm text-base-muted mb-2">{label}</p>
      <div className="w-full bg-base-subtle border border-base-border rounded-xl px-4 py-3 text-base-muted text-sm">
        {value}
      </div>
    </div>
  );
}

function toArs(usd, rate) {
  return (Number(usd) * Number(rate)).toLocaleString("es-AR");
}
