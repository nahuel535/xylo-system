import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

export default function ScanRedirectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Buscando producto...");

  useEffect(() => {
    async function resolveProduct() {
      try {
        const response = await api.get(/products/${id});
        const product = response.data;

        if (product.status === "in_stock") {
          setMessage("Producto encontrado. Abriendo venta rápida...");
          navigate(/products/${id}/sell, { replace: true });
          return;
        }

        setMessage("Producto encontrado. Abriendo detalle...");
        navigate(/products/${id}, { replace: true });
      } catch (error) {
        console.error("Error resolviendo QR:", error);
        setMessage("No se encontró el producto o hubo un error.");
      }
    }

    if (id) {
      resolveProduct();
    }
  }, [id, navigate]);

  return (
    <div className="min-h-screen bg-base-bg text-base-text flex items-center justify-center p-6">
      <div className="bg-base-card border border-base-border rounded-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold mb-3">Procesando QR</h1>
        <p className="text-base-muted">{message}</p>
      </div>
    </div>
  );
}