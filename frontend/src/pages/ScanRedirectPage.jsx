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
        console.error("Error resolviendo QR:", error);
        setMessage("No se pudo abrir el producto.");
      }
    }

    resolveScan();
  }, [id, navigate]);

  return (
    <div className="min-h-screen bg-base-bg text-base-text flex items-center justify-center">
      <div className="bg-base-card border border-base-border rounded-xl px-6 py-5">
        {message}
      </div>
    </div>
  );
}