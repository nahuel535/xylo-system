import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import Header from "../components/Header";

export default function ScannerPage() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const hasScannedRef = useRef(false);
  const [status, setStatus] = useState("Inicializando cámara...");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const elementId = "xylo-qr-reader";
    const scanner = new Html5Qrcode(elementId);
    scannerRef.current = scanner;

    async function startScanner() {
      try {
        setStatus("Solicitando acceso a cámara...");
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.3333 },
          (decodedText) => {
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;
            setStatus("QR detectado. Abriendo...");
            handleDecodedText(decodedText);
          },
          () => {}
        );
        setStatus("Apuntá la cámara al QR del producto.");
      } catch (error) {
        setErrorMessage("No se pudo acceder a la cámara. Revisá permisos del navegador.");
        setStatus("Error al iniciar escáner.");
      }
    }

    startScanner();

    return () => {
      async function cleanup() {
        try {
          if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop();
            await scannerRef.current.clear();
          }
        } catch {}
      }
      cleanup();
    };
  }, []);

  function handleDecodedText(text) {
    try {
      const url = new URL(text);
      if (url.pathname.startsWith("/scan/")) {
        navigate(`/scan/${url.pathname.split("/scan/")[1]}`);
        return;
      }
      if (url.pathname.startsWith("/products/")) {
        navigate(`/products/${url.pathname.split("/products/")[1]}`);
        return;
      }
      setErrorMessage("El QR no corresponde a una ruta válida del sistema.");
      hasScannedRef.current = false;
      setStatus("Apuntá la cámara al QR del producto.");
    } catch {
      setErrorMessage("El contenido del QR no es una URL válida.");
      hasScannedRef.current = false;
      setStatus("Apuntá la cámara al QR del producto.");
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Header title="Escanear producto" subtitle="Usá la cámara del celular para leer el QR" />
      <div className="bg-base-card border border-base-border rounded-2xl p-6 shadow-card">
        <div className="mb-4">
          <p className="text-sm text-base-muted">{status}</p>
          {errorMessage && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mt-2">{errorMessage}</p>
          )}
        </div>
        <div id="xylo-qr-reader" className="overflow-hidden rounded-xl border border-base-border bg-black" />
        <p className="mt-4 text-sm text-base-muted">
          Consejo: usalo desde el celular en Chrome o Safari, con buena luz y enfocando el QR de cerca.
        </p>
      </div>
    </div>
  );
}