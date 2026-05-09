import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

export default function AccessoryLabelPage() {
  const { id } = useParams();
  const [accessory, setAccessory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.classList.add("label-print-mode");
    return () => document.body.classList.remove("label-print-mode");
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/accessories/");
        const found = res.data.find((a) => String(a.id) === String(id));
        setAccessory(found || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <p style={{ padding: 24 }}>Cargando etiqueta...</p>;
  if (!accessory) return <p style={{ padding: 24 }}>Accesorio no encontrado.</p>;

  return (
    <>
      <div className="print:hidden flex flex-col justify-center items-center min-h-screen bg-[#f5f5f7]">
        <div style={{ marginBottom: "20px" }}>
          <Label accessory={accessory} />
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-2xl bg-black text-white px-5 py-3 text-sm font-medium hover:opacity-90 transition"
        >
          Imprimir etiqueta
        </button>
      </div>

      <div className="hidden print:block label-only">
        <Label accessory={accessory} />
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

          body.label-print-mode * { visibility: hidden !important; }
          body.label-print-mode .label-only,
          body.label-print-mode .label-only * { visibility: visible !important; }
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

function Label({ accessory }) {
  const S = {
    wrap: {
      width: "55mm",
      height: "44mm",
      boxSizing: "border-box",
      background: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
      color: "#111",
      padding: "2.5mm 3mm",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      overflow: "hidden",
    },
    brand: {
      fontSize: "7pt",
      fontWeight: "700",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "#111",
      margin: 0,
    },
    center: {
      textAlign: "center",
      width: "100%",
    },
    name: {
      fontSize: accessory.name.length > 22 ? "8.5pt" : "10.5pt",
      fontWeight: "800",
      letterSpacing: "-0.02em",
      lineHeight: 1.1,
      margin: "0 0 1.5mm",
      textAlign: "center",
    },
    category: {
      fontSize: "7pt",
      color: "#555",
      margin: "0 0 1mm",
      textAlign: "center",
    },
    priceRow: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "center",
      gap: "1mm",
    },
    priceCurrency: {
      fontSize: "7pt",
      fontWeight: "600",
      color: "#333",
    },
    priceAmount: {
      fontSize: "15pt",
      fontWeight: "800",
      letterSpacing: "-0.04em",
      color: "#111",
      lineHeight: 1,
    },
    divider: {
      width: "20mm",
      height: "0.3mm",
      background: "#ddd",
      margin: "0 auto",
    },
    bottom: {
      textAlign: "center",
    },
    bottomText: {
      fontSize: "6pt",
      color: "#888",
      margin: 0,
      letterSpacing: "0.04em",
    },
  };

  const price = Number(accessory.sale_price_usd);
  const hasPrice = price > 0;
  const brand = accessory.brand ? accessory.brand.toUpperCase() : null;

  return (
    <div style={S.wrap}>
      {/* Top: Xylo */}
      <p style={S.brand}>Xylo</p>

      {/* Center: nombre + categoría */}
      <div style={S.center}>
        <p style={S.name}>{accessory.name}</p>
        <p style={S.category}>
          {[brand, accessory.category].filter(Boolean).join(" · ")}
        </p>
        <div style={S.divider} />
      </div>

      {/* Bottom: precio */}
      <div style={S.bottom}>
        {hasPrice ? (
          <div style={S.priceRow}>
            <span style={S.priceCurrency}>USD</span>
            <span style={S.priceAmount}>
              {price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}
            </span>
          </div>
        ) : (
          <p style={S.bottomText}>Sin precio definido</p>
        )}
      </div>
    </div>
  );
}
