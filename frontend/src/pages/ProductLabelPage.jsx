import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

export default function ProductLabelPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        console.error("Error cargando producto:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  if (loading) return <p style={{ padding: 24 }}>Cargando etiqueta...</p>;
  if (!product) return <p style={{ padding: 24 }}>Producto no encontrado.</p>;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#111111] px-6 py-10 print:bg-white print:p-0">
      <div className="max-w-[720px] mx-auto">
        <div className="flex justify-end mb-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-2xl bg-black text-white px-5 py-3 text-sm font-medium hover:opacity-90 transition"
          >
            Imprimir etiqueta
          </button>
        </div>

        <div className="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-black/5 overflow-hidden print:shadow-none print:border print:rounded-none">
          <div className="px-10 pt-10 pb-8">
            <div className="flex items-start justify-between gap-8">
              <div>
                <p className="text-[12px] tracking-[0.22em] uppercase text-black/45 mb-3">
                  Xylo Selection
                </p>

                <h1 className="text-[42px] leading-[1.02] font-semibold tracking-[-0.03em]">
                  {product.model || "iPhone"}
                </h1>

                <p className="mt-3 text-[20px] text-black/70 tracking-[-0.01em]">
                  {[product.storage, product.color].filter(Boolean).join(" · ") || "Configuración no especificada"}
                </p>
              </div>

              <div className="shrink-0 rounded-[24px] border border-black/8 bg-[#fafafa] px-6 py-5 min-w-[190px] text-right">
                <p className="text-[12px] uppercase tracking-[0.18em] text-black/40 mb-2">
                  Precio
                </p>
                <p className="text-[34px] leading-none font-semibold tracking-[-0.03em]">
                  USD {formatPrice(product.suggested_sale_price_usd)}
                </p>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-x-10 gap-y-6">
              <Spec label="Batería" value={product.battery_health ? `${product.battery_health}%` : "-"} />
              <Spec label="Condición" value={product.condition_type || "-"} />
              <Spec label="Estado estético" value={product.cosmetic_condition || "-"} />
              <Spec label="Estado funcional" value={product.functional_condition || "-"} />
              <Spec label="Tipo de SIM" value={product.sim_type || "-"} />
              <Spec label="IMEI" value={product.imei || "-"} mono />
            </div>

            {product.notes && (
              <div className="mt-10 rounded-[24px] bg-[#f7f7f8] border border-black/5 p-5">
                <p className="text-[12px] uppercase tracking-[0.16em] text-black/40 mb-2">
                  Observaciones
                </p>
                <p className="text-[14px] leading-6 text-black/75">
                  {product.notes}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-black/6 px-10 py-8 flex items-center justify-between gap-8">
            <div>
              <p className="text-[12px] uppercase tracking-[0.18em] text-black/40 mb-3">
                Escanear para abrir
              </p>
              <p className="text-[15px] text-black/70 max-w-[260px] leading-6">
                Escaneá este código para abrir el producto y acceder rápido a la venta.
              </p>
            </div>

            <div className="shrink-0 rounded-[28px] border border-black/8 bg-white p-4">
              <img
                src={`http://192.168.0.224:8000/products/${product.id}/qr`}
                alt="QR producto"
                className="w-40 h-40 object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }

          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}

function Spec({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-[12px] uppercase tracking-[0.16em] text-black/40 mb-2">
        {label}
      </p>
      <p
        className={`text-[18px] leading-6 tracking-[-0.01em] text-black/85 ${
          mono ? "font-mono text-[15px]" : "font-medium"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toLocaleString("en-US");
}