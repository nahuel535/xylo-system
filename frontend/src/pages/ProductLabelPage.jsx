import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import logo from "../assets/logo.png";

export default function ProductLabelPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.classList.add("label-print-mode");
    return () => document.body.classList.remove("label-print-mode");
  }, []);

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
    <>
      {/* Botón solo visible en pantalla */}
      <div className="print:hidden flex justify-center items-center min-h-screen bg-[#f5f5f7]">
        <div className="text-center">
          <div style={{ width: "55mm", margin: "0 auto 20px" }}>
            <Label product={product} />
          </div>
          <button
            onClick={() => window.print()}
            className="rounded-2xl bg-black text-white px-5 py-3 text-sm font-medium hover:opacity-90 transition"
          >
            Imprimir etiqueta
          </button>
        </div>
      </div>

      {/* Lo que se imprime */}
      <div className="hidden print:block label-only">
        <Label product={product} />
      </div>

      <style>{`
        @media print {
          @page {
            size: 55mm 44mm;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body { margin: 0; padding: 0; background: white; }

          body.label-print-mode * {
            visibility: hidden !important;
          }
          body.label-print-mode .label-only,
          body.label-print-mode .label-only * {
            visibility: visible !important;
          }
          body.label-print-mode .label-only {
            position: fixed;
            top: 0;
            left: 0;
          }
        }
      `}</style>
    </>
  );
}

function Label({ product }) {
  const battery = product.battery_health ? `${product.battery_health}%` : null;
  const condition = product.condition_type || null;
  const cosmetic = product.cosmetic_condition || null;

  const S = {
    wrap: {
      width: "55mm",
      height: "44mm",
      boxSizing: "border-box",
      background: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
      color: "#111",
      padding: "2mm 2.5mm",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      overflow: "hidden",
    },
    logoImg: {
      width: "8mm",
      height: "8mm",
      borderRadius: "2mm",
      filter: "grayscale(1)",
    },
    qrImg: {
      width: "22mm",
      height: "22mm",
      display: "block",
    },
    textBlock: {
      textAlign: "center",
      width: "100%",
    },
    model: {
      fontSize: "12pt",
      fontWeight: "700",
      letterSpacing: "-0.03em",
      lineHeight: 1,
      margin: "0 0 1mm",
    },
    subtitle: {
      fontSize: "7pt",
      color: "#555",
      margin: 0,
    },
    specsRow: {
      display: "flex",
      gap: "1.5mm",
      flexWrap: "wrap",
      justifyContent: "center",
      marginTop: "1mm",
    },
    specChip: {
      fontSize: "5.5pt",
      color: "#666",
      background: "#f3f3f4",
      borderRadius: "3px",
      padding: "0.5mm 1.5mm",
    },
  };

  const chips = [battery, condition, cosmetic].filter(Boolean);

  return (
    <div style={S.wrap}>
      {/* Logo arriba */}
      <img src={logo} alt="Xylo" style={S.logoImg} />

      {/* QR al medio */}
      <img
        src={`https://xylo-system-production.up.railway.app/products/${product.id}/qr`}
        alt="QR"
        style={S.qrImg}
      />

      {/* Nombre y specs abajo */}
      <div style={S.textBlock}>
        <p style={S.model}>{product.model || "iPhone"}</p>
        <p style={S.subtitle}>
          {[product.storage, product.color].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>
    </div>
  );
}
