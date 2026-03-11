import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";

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
    payment_method: "transferencia",
    payment_amount_usd: "",
    payment_reference: "",
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

        setForm((prev) => ({
          ...prev,
          sale_price_usd: productData.suggested_sale_price_usd || "",
          payment_amount_usd: productData.suggested_sale_price_usd || "",
        }));
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
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

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
        payments: [
          {
            method: form.payment_method,
            amount_usd: Number(form.payment_amount_usd),
            installments: null,
            surcharge_usd: null,
            commission_usd: null,
            reference: form.payment_reference || null,
          },
        ],
      });

      navigate("/products");
    } catch (error) {
      console.error("Error registrando venta:", error);
      setMessage(error?.response?.data?.detail || "Error al registrar la venta.");
    }
  }

  if (loading) return <p className="text-base-muted">Cargando producto...</p>;
  if (!product) return <p className="text-base-muted">Producto no encontrado.</p>;
  if (product.status !== "in_stock") {
    return (
      <div className="max-w-2xl mx-auto">
        <Header
          title="Producto no disponible"
          subtitle="Este equipo ya no está en stock"
        />
        <div className="bg-base-card border border-base-border rounded-xl p-6">
          <p className="text-base-muted mb-4">
            Este producto ya fue vendido o no está disponible para la venta.
          </p>
          <button
            onClick={() => navigate(`/products/${id}`)}
            className="bg-white/5 hover:bg-white/10 transition rounded-xl px-5 py-3"
          >
            Volver al detalle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Header
        title={`Vender ${product.model}`}
        subtitle={`Equipo #${product.id}`}
      />

      <div className="bg-base-card border border-base-border rounded-xl p-5 mb-5">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-base-muted">Modelo</p>
            <p className="font-medium">{product.model}</p>
          </div>
          <div>
            <p className="text-base-muted">IMEI</p>
            <p className="font-medium">{product.imei}</p>
          </div>
          <div>
            <p className="text-base-muted">Costo USD</p>
            <p className="font-medium">USD {product.purchase_price_usd}</p>
          </div>
          <div>
            <p className="text-base-muted">Costo ARS</p>
            <p className="font-medium">
              {exchange ? `ARS ${toArs(product.purchase_price_usd, exchange.buy_rate_ars)}` : "-"}
            </p>
          </div>
          <div>
            <p className="text-base-muted">Precio sugerido USD</p>
            <p className="font-medium">USD {product.suggested_sale_price_usd}</p>
          </div>
          <div>
            <p className="text-base-muted">Precio sugerido ARS</p>
            <p className="font-medium">
              {exchange ? `ARS ${toArs(product.suggested_sale_price_usd, exchange.sell_rate_ars)}` : "-"}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-base-card border border-base-border rounded-xl p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label="Precio de venta USD"
            name="sale_price_usd"
            value={form.sale_price_usd}
            onChange={handleChange}
          />

          <ReadOnlyField
            label="Precio de venta ARS"
            value={
              exchange && form.sale_price_usd
                ? `ARS ${toArs(form.sale_price_usd, exchange.sell_rate_ars)}`
                : "-"
            }
          />

          <Field
            label="Cliente"
            name="client_name"
            value={form.client_name}
            onChange={handleChange}
          />

          <Field
            label="Método de pago"
            name="payment_method"
            value={form.payment_method}
            onChange={handleChange}
          />

          <Field
            label="Monto cobrado USD"
            name="payment_amount_usd"
            value={form.payment_amount_usd}
            onChange={handleChange}
          />

          <ReadOnlyField
            label="Monto cobrado ARS"
            value={
              exchange && form.payment_amount_usd
                ? `ARS ${toArs(form.payment_amount_usd, exchange.sell_rate_ars)}`
                : "-"
            }
          />

          <Field
            label="Referencia"
            name="payment_reference"
            value={form.payment_reference}
            onChange={handleChange}
          />
        </div>

        <div>
          <p className="text-sm text-base-muted mb-2">Notas</p>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="w-full min-h-[110px] bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
            placeholder="Observaciones de la venta"
          />
        </div>

        {message && (
          <p className="text-sm text-red-300">{message}</p>
        )}

        <div className="flex gap-3 flex-wrap">
          <button
            type="submit"
            className="bg-xylo-500 hover:bg-xylo-400 transition text-white rounded-xl px-5 py-3 font-medium"
          >
            Confirmar venta
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-white/5 hover:bg-white/10 transition rounded-xl px-5 py-3"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange }) {
  return (
    <div>
      <p className="text-sm text-base-muted mb-2">{label}</p>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
      />
    </div>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="text-sm text-base-muted mb-2">{label}</p>
      <div className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white">
        {value}
      </div>
    </div>
  );
}

function toArs(usd, rate) {
  return (Number(usd) * Number(rate)).toLocaleString("es-AR");
}