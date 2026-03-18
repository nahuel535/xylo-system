import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

export default function ScanRedirectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Verificando producto...");

  useEffect(() => {
    async function resolveScan() {
      try {
        const response = await api.get(`/products/${id}`);
        const product = response.data;
        if (product.status === "in_stock") {
          navigate(`/products/${id}/sell`);
        } else {
          navigate(`/products/${id}`);
        }
      } catch (error) {
        setMessage("No se pudo abrir el producto.");
      }
    }
    resolveScan();
  }, [id, navigate]);

  return (
    <div className="min-h-screen bg-base-bg text-base-text flex items-center justify-center">
      <div className="bg-base-card border border-base-border rounded-2xl px-8 py-6 shadow-card flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-xylo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-base-muted">{message}</p>
      </div>
    </div>
  );
}