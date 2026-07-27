import { useEffect, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import logo from "../assets/logo.png";


export default function PrintQuotePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/quotes/${id}`)
      .then(({ data }) => setQuote(data))
      .catch(() => setError("No se pudo cargar el presupuesto."));
  }, [id]);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!quote) return <p className="text-sm text-base-muted">Preparando presupuesto...</p>;

  return (
    <div className="quote-print-shell">
      <style>{`
        @media print {
          body { background: white !important; }
          aside, nav, .quote-print-actions { display: none !important; }
          main { padding: 0 !important; }
          .quote-print-shell { padding: 0 !important; }
          .quote-document { box-shadow: none !important; border: 0 !important; max-width: none !important; }
        }
      `}</style>

      <div className="quote-print-actions flex items-center justify-between mb-5">
        <button onClick={() => navigate("/presupuestos")} className="flex items-center gap-2 text-sm text-base-muted hover:text-base-text">
          <ArrowLeft size={15} /> Volver
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-xylo-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold">
          <Printer size={15} /> Imprimir / Guardar PDF
        </button>
      </div>

      <article className="quote-document max-w-3xl mx-auto bg-white text-gray-900 border border-gray-200 rounded-2xl shadow-card p-7 md:p-10">
        <header className="flex items-start justify-between gap-6 pb-7 border-b border-gray-200">
          <div>
            <img src={logo} alt="XYLO" className="h-12 w-auto object-contain mb-3" />
            <p className="text-xs text-gray-500">Tecnología seleccionada · Atención personalizada</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-gray-500">Presupuesto</p>
            <p className="text-2xl font-bold mt-1">#{quote.id}</p>
            <p className="text-xs text-gray-500 mt-2">{formatDate(quote.created_at)}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-6 py-7">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">Cliente</p>
            <p className="font-semibold">{quote.client_name}</p>
            {quote.client_phone && <p className="text-sm text-gray-600 mt-1">{quote.client_phone}</p>}
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">Validez</p>
            <p className="font-semibold">{quote.valid_until ? `Hasta ${formatDate(quote.valid_until)}` : "Sin vencimiento"}</p>
            <p className="text-sm text-gray-600 mt-1 capitalize">Estado: {statusLabel(quote.status)}</p>
          </div>
        </section>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-gray-200 text-left text-[11px] uppercase tracking-wider text-gray-500">
              <th className="py-3">Descripción</th>
              <th className="py-3 text-center">Cant.</th>
              <th className="py-3 text-right">Precio</th>
              <th className="py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {(quote.items || []).map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-4 font-medium">{item.description}</td>
                <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                <td className="py-4 text-right text-gray-600">USD {money(item.unit_price_usd)}</td>
                <td className="py-4 text-right font-medium">USD {money(item.subtotal_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="ml-auto max-w-xs mt-6 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>USD {money(quote.subtotal_usd)}</span>
          </div>
          {Number(quote.discount_usd) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Descuento</span><span>− USD {money(quote.discount_usd)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-3">
            <span>Total</span><span>USD {money(quote.total_usd)}</span>
          </div>
        </section>

        {quote.notes && (
          <section className="mt-8 rounded-xl bg-gray-50 p-4">
            <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">Notas y condiciones</p>
            <p className="text-sm whitespace-pre-wrap">{quote.notes}</p>
          </section>
        )}

        <footer className="mt-10 pt-5 border-t border-gray-200 text-center text-xs text-gray-500">
          Gracias por elegir XYLO.
        </footer>
      </article>
    </div>
  );
}

function money(value) {
  return Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  const raw = String(value).slice(0, 10);
  return new Date(`${raw}T12:00:00`).toLocaleDateString("es-AR");
}

function statusLabel(status) {
  return {
    draft: "Borrador",
    sent: "Enviado",
    accepted: "Aceptado",
    rejected: "Rechazado",
    expired: "Vencido",
  }[status] || status;
}
