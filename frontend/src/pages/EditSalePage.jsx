import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";

const PAYMENT_METHODS = ["transferencia", "efectivo", "tarjeta", "permuta", "otro"];

export default function EditSalePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [sale, setSale] = useState(null);
  const [product, setProduct] = useState(null);
  const [users, setUsers] = useState([]);
  const [exchange, setExchange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState(null);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [saleRes, usersRes, exchangeRes] = await Promise.all([
          api.get(`/sales/${id}`),
          api.get("/users/"),
          api.get("/exchange-rates/active"),
        ]);
        const saleData = saleRes.data;
        setSale(saleData);
        setUsers(usersRes.data);
        setExchange(exchangeRes.data);

        const productRes = await api.get(`/products/${saleData.product_id}`);
        setProduct(productRes.data);

        setForm({
          sale_price_usd: String(saleData.sale_price_usd),
          seller_id: String(saleData.seller_id),
          client_name: saleData.client_name || "",
          notes: saleData.notes || "",
          status: saleData.status || "completed",
          has_trade_in: saleData.has_trade_in || false,
          trade_in_value_usd: String(saleData.trade_in_value_usd || ""),
          has_deposit: saleData.has_deposit || false,
          deposit_amount_usd: String(saleData.deposit_amount_usd || ""),
          remaining_balance_usd: String(saleData.remaining_balance_usd || ""),
        });

        setPayments(
          saleData.payments.map((p) => ({
            method: p.method,
            amount_usd: String(p.amount_usd),
            reference: p.reference || "",
            installments: p.installments ? String(p.installments) : "",
            surcharge_usd: p.surcharge_usd ? String(p.surcharge_usd) : "",
            commission_usd: p.commission_usd ? String(p.commission_usd) : "",
          }))
        );
      } catch (error) {
        console.error("Error cargando venta:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  function handlePaymentChange(index, field, value) {
    setPayments((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }

  function addPayment() {
    setPayments((prev) => [...prev, { method: "transferencia", amount_usd: "", reference: "", installments: "", surcharge_usd: "", commission_usd: "" }]);
  }

  function removePayment(index) {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      await api.put(`/sales/${id}`, {
        sale_price_usd: Number(form.sale_price_usd),
        seller_id: Number(form.seller_id),
        client_name: form.client_name || null,
        notes: form.notes || null,
        status: form.status,
        has_trade_in: form.has_trade_in,
        trade_in_value_usd: form.trade_in_value_usd ? Number(form.trade_in_value_usd) : null,
        has_deposit: form.has_deposit,
        deposit_amount_usd: form.deposit_amount_usd ? Number(form.deposit_amount_usd) : null,
        remaining_balance_usd: form.remaining_balance_usd ? Number(form.remaining_balance_usd) : null,
        payments: payments.map((p) => ({
          method: p.method,
          amount_usd: Number(p.amount_usd),
          reference: p.reference || null,
          installments: p.installments ? Number(p.installments) : null,
          surcharge_usd: p.surcharge_usd ? Number(p.surcharge_usd) : null,
          commission_usd: p.commission_usd ? Number(p.commission_usd) : null,
        })),
      });
      navigate(`/sales/${id}`);
    } catch (error) {
      setMessage(error?.response?.data?.detail || "Error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-base-muted">Cargando venta...</p>;
  if (!sale || !form) return <p className="text-base-muted">Venta no encontrada.</p>;

  const inputClass = "w-full bg-base-subtle border border-base-border rounded-xl px-4 py-3 text-base-text outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition text-sm";

  return (
    <div className="max-w-3xl mx-auto">
      <Header title={`Editar venta #${id}`} subtitle={product ? `${product.model} · IMEI ${product.imei}` : ""} />

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Datos principales */}
        <section className="bg-base-card border border-base-border rounded-2xl p-6 shadow-card space-y-5">
          <h3 className="text-sm font-semibold text-base-text">Datos de la venta</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <p className="text-sm text-base-muted mb-2">Precio de venta USD</p>
              <input name="sale_price_usd" value={form.sale_price_usd} onChange={handleChange} type="number" step="0.01" className={inputClass} required />
            </div>
            <div>
              <p className="text-sm text-base-muted mb-2">Precio de venta ARS</p>
              <div className="w-full bg-base-subtle border border-base-border rounded-xl px-4 py-3 text-base-muted text-sm">
                {exchange && form.sale_price_usd ? `ARS ${toArs(form.sale_price_usd, exchange.sell_rate_ars)}` : "-"}
              </div>
            </div>
            <div>
              <p className="text-sm text-base-muted mb-2">Vendedor</p>
              <select name="seller_id" value={form.seller_id} onChange={handleChange} className={inputClass} required>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <p className="text-sm text-base-muted mb-2">Cliente</p>
              <input name="client_name" value={form.client_name} onChange={handleChange} className={inputClass} placeholder="Nombre del cliente" />
            </div>
            <div>
              <p className="text-sm text-base-muted mb-2">Estado</p>
              <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                <option value="completed">Completada</option>
                <option value="pending">Pendiente</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>

          <div>
            <p className="text-sm text-base-muted mb-2">Notas</p>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
              className="w-full bg-base-subtle border border-base-border rounded-xl px-4 py-3 text-base-text outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition text-sm"
              placeholder="Observaciones de la venta" />
          </div>
        </section>

        {/* Pagos */}
        <section className="bg-base-card border border-base-border rounded-2xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-base-text">Pagos</h3>
            <button type="button" onClick={addPayment}
              className="text-xs bg-xylo-500/10 hover:bg-xylo-500/20 text-xylo-500 rounded-lg px-3 py-1.5 transition">
              + Agregar pago
            </button>
          </div>

          {payments.length === 0 && (
            <p className="text-sm text-base-muted">Sin pagos registrados.</p>
          )}

          {payments.map((payment, index) => (
            <div key={index} className="bg-base-subtle border border-base-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-base-muted font-medium">Pago {index + 1}</span>
                <button type="button" onClick={() => removePayment(index)}
                  className="text-xs text-red-400 hover:text-red-300 transition">Eliminar</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-base-muted mb-1">Método</p>
                  <select value={payment.method} onChange={(e) => handlePaymentChange(index, "method", e.target.value)} className={inputClass}>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-base-muted mb-1">Monto USD</p>
                  <input type="number" step="0.01" value={payment.amount_usd}
                    onChange={(e) => handlePaymentChange(index, "amount_usd", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <p className="text-xs text-base-muted mb-1">Referencia</p>
                  <input value={payment.reference} onChange={(e) => handlePaymentChange(index, "reference", e.target.value)}
                    className={inputClass} placeholder="Opcional" />
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Extras */}
        <section className="bg-base-card border border-base-border rounded-2xl p-6 shadow-card space-y-4">
          <h3 className="text-sm font-semibold text-base-text">Opciones adicionales</h3>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="has_trade_in" checked={form.has_trade_in} onChange={handleChange} className="w-4 h-4 accent-xylo-500" />
            <span className="text-sm text-base-text">Incluye trade-in</span>
          </label>
          {form.has_trade_in && (
            <div>
              <p className="text-sm text-base-muted mb-2">Valor del trade-in USD</p>
              <input name="trade_in_value_usd" value={form.trade_in_value_usd} onChange={handleChange} type="number" step="0.01" className={inputClass} />
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="has_deposit" checked={form.has_deposit} onChange={handleChange} className="w-4 h-4 accent-xylo-500" />
            <span className="text-sm text-base-text">Incluye seña</span>
          </label>
          {form.has_deposit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-base-muted mb-2">Seña USD</p>
                <input name="deposit_amount_usd" value={form.deposit_amount_usd} onChange={handleChange} type="number" step="0.01" className={inputClass} />
              </div>
              <div>
                <p className="text-sm text-base-muted mb-2">Saldo restante USD</p>
                <input name="remaining_balance_usd" value={form.remaining_balance_usd} onChange={handleChange} type="number" step="0.01" className={inputClass} />
              </div>
            </div>
          )}
        </section>

        {message && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{message}</p>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-xylo-500 hover:bg-xylo-600 transition text-white rounded-xl px-6 py-3 font-medium shadow-sm disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button type="button" onClick={() => navigate(`/sales/${id}`)}
            className="bg-base-subtle hover:bg-base-border transition text-base-muted rounded-xl px-6 py-3 text-sm">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function toArs(usd, rate) {
  return (Number(usd) * Number(rate)).toLocaleString("es-AR");
}
