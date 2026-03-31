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
          <div style={{ width: "80mm", margin: "0 auto 20px" }}>
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
            size: 80mm auto;
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
  const specs = [
    { label: "Batería", value: product.battery_health ? `${product.battery_health}%` : null },
    { label: "Condición", value: product.condition_type || null },
    { label: "Estado estético", value: product.cosmetic_condition || null },
    { label: "Estado funcional", value: product.functional_condition || null },
    { label: "Tipo de SIM", value: product.sim_type || null },
  ].filter((s) => s.value);

  const S = {
    wrap: {
      width: "80mm",
      boxSizing: "border-box",
      background: "white",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
      color: "#111",
      padding: "5mm",
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      marginBottom: "4mm",
    },
    logoImg: {
      width: "18px",
      height: "18px",
      borderRadius: "4px",
    },
    brand: {
      fontSize: "8pt",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: "#999",
      margin: 0,
    },
    model: {
      fontSize: "22pt",
      fontWeight: "600",
      letterSpacing: "-0.03em",
      lineHeight: 1,
      margin: "0 0 1.5mm",
    },
    subtitle: {
      fontSize: "11pt",
      color: "#555",
      margin: "0 0 4mm",
    },
    row: {
      display: "flex",
      gap: "3mm",
      alignItems: "stretch",
      marginBottom: "4mm",
    },
    specsBox: {
      flex: 1,
      background: "#f7f7f8",
      borderRadius: "8px",
      padding: "3mm",
    },
    specItem: {
      marginBottom: "2mm",
    },
    specLabel: {
      fontSize: "6.5pt",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "#999",
      margin: "0 0 0.5mm",
    },
    specValue: {
      fontSize: "9pt",
      fontWeight: "500",
      color: "#111",
      margin: 0,
    },
    priceBox: {
      width: "22mm",
      background: "#f7f7f8",
      borderRadius: "8px",
      padding: "3mm",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
    },
    priceCurrency: {
      fontSize: "6.5pt",
      textTransform: "uppercase",
      letterSpacing: "0.15em",
      color: "#999",
      margin: "0 0 2mm",
    },
    priceLine: {
      width: "100%",
      borderBottom: "1.5px solid #bbb",
      height: "8mm",
    },
    notes: {
      background: "#f7f7f8",
      borderRadius: "8px",
      padding: "3mm",
      marginBottom: "4mm",
    },
    notesLabel: {
      fontSize: "6.5pt",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "#999",
      margin: "0 0 1.5mm",
    },
    notesText: {
      fontSize: "8.5pt",
      color: "#444",
      lineHeight: 1.5,
      margin: 0,
    },
    footer: {
      borderTop: "1px solid #eee",
      paddingTop: "3mm",
      display: "flex",
      alignItems: "center",
      gap: "3mm",
    },
    qrWrap: {
      background: "white",
      border: "1px solid #eee",
      borderRadius: "8px",
      padding: "2mm",
      flexShrink: 0,
    },
    qrImg: {
      width: "22mm",
      height: "22mm",
      display: "block",
    },
    qrText: {
      fontSize: "7.5pt",
      color: "#666",
      lineHeight: 1.5,
      margin: 0,
    },
  };

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <img src={logo} alt="Xylo" style={S.logoImg} />
        <p style={S.brand}>Xylo Selection</p>
      </div>

      {/* Modelo */}
      <p style={S.model}>{product.model || "iPhone"}</p>
      <p style={S.subtitle}>
        {[product.storage, product.color].filter(Boolean).join(" · ") || "—"}
      </p>

      {/* Specs + precio */}
      <div style={S.row}>
        {specs.length > 0 && (
          <div style={S.specsBox}>
            {specs.map((s) => (
              <div key={s.label} style={S.specItem}>
                <p style={S.specLabel}>{s.label}</p>
                <p style={S.specValue}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div style={S.priceBox}>
          <p style={S.priceCurrency}>Precio USD</p>
          <div style={S.priceLine} />
        </div>
      </div>

      {/* Notas */}
      {product.notes && (
        <div style={S.notes}>
          <p style={S.notesLabel}>Observaciones</p>
          <p style={S.notesText}>{product.notes}</p>
        </div>
      )}

      {/* Footer QR */}
      <div style={S.footer}>
        <div style={S.qrWrap}>
          <img
            src={`https://xylobox.online/products/${product.id}/qr`}
            alt="QR producto"
            style={S.qrImg}
          />
        </div>
        <p style={S.qrText}>
          Escaneá este código para abrir el producto y acceder rápido a la venta.
        </p>
      </div>
    </div>
  );
}
