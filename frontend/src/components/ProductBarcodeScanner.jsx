import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, CheckCircle, Keyboard, ScanBarcode, X } from "lucide-react";
import {
  createEmptyProductLabelData,
  mergeProductLabelData,
  parseProductBarcode,
} from "../utils/productBarcode";

const FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

const FIELD_LABELS = {
  imei: "IMEI",
  imei2: "IMEI 2",
  serial_number: "Número de serie",
  ean: "EAN / UPC",
  part_number: "Código de producto Apple",
  model: "Modelo",
  storage: "Capacidad",
  color: "Color",
};

export default function ProductBarcodeScanner({ open, onClose, onApply }) {
  const scannerRef = useRef(null);
  const inputRef = useRef(null);
  const lastScanRef = useRef({ value: "", at: 0 });
  const forcedTypeRef = useRef("auto");
  const [labelData, setLabelData] = useState(createEmptyProductLabelData);
  const [manualValue, setManualValue] = useState("");
  const [forcedType, setForcedType] = useState("auto");
  const [cameraRunning, setCameraRunning] = useState(false);
  const [status, setStatus] = useState("Escaneá cada código de la etiqueta; los datos se acumulan.");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 150);
    return () => window.clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    async function cleanup() {
      try {
        if (scanner.isScanning) await scanner.stop();
        scanner.clear();
      } catch {
        // El navegador puede haber liberado la cámara antes del desmontaje.
      }
    }
    cleanup();
  }, []);

  function addCode(rawValue) {
    const value = String(rawValue || "").trim();
    if (!value) return;

    const now = Date.now();
    if (lastScanRef.current.value === value && now - lastScanRef.current.at < 1500) return;
    lastScanRef.current = { value, at: now };

    const parsed = parseProductBarcode(value, forcedTypeRef.current);
    setLabelData((current) => mergeProductLabelData(current, parsed));
    setManualValue("");
    setError("");

    if (parsed.detected.length === 0) {
      setStatus("Código leído, pero no pude clasificarlo. Elegí el tipo y volvé a escanearlo.");
    } else if (parsed.fields.imei && parsed.imeiValid === false) {
      setStatus("Leí un IMEI de 15 dígitos, pero no pasó la validación. Revisalo antes de aplicar.");
    } else {
      setStatus(`Dato leído: ${parsed.detected.map((key) => FIELD_LABELS[key]).join(", ")}.`);
    }
  }

  async function startCamera() {
    setError("");
    setStatus("Solicitando acceso a la cámara...");
    try {
      const scanner = new Html5Qrcode("xylo-product-barcode-reader", { formatsToSupport: FORMATS });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 290, height: 150 }, aspectRatio: 1.7778 },
        (decodedText) => addCode(decodedText),
        () => {},
      );
      setCameraRunning(true);
      setStatus("Cámara activa. Acercá un código por vez.");
    } catch {
      try {
        scannerRef.current?.clear();
      } catch {
        // El lector puede no haberse inicializado por completo.
      }
      scannerRef.current = null;
      setCameraRunning(false);
      setError("No se pudo abrir la cámara. Revisá los permisos o usá un lector USB.");
      setStatus("Cámara no disponible.");
    }
  }

  async function stopCamera() {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      await scanner.clear();
    } catch {
      // El lector puede haber sido detenido por el navegador al cerrar el modal.
    }
    scannerRef.current = null;
    setCameraRunning(false);
    setStatus("Cámara detenida. Podés seguir con el lector USB.");
  }

  async function closeScanner() {
    await stopCamera();
    onClose();
  }

  async function applyData() {
    await stopCamera();
    onApply(labelData);
  }

  function handleManualSubmit(event) {
    event.preventDefault();
    addCode(manualValue);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  if (!open) return null;

  const detectedData = Object.entries(labelData).filter(([key, value]) => key !== "raw_codes" && Boolean(value));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm">
      <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-base-border bg-base-card p-5 shadow-elevated sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-xylo-500 text-white">
              <ScanBarcode size={20} />
            </div>
            <div>
              <p className="font-semibold text-base-text">Escanear etiqueta del equipo</p>
              <p className="text-xs text-base-muted">Compatible con cámara y lectores USB/Bluetooth.</p>
            </div>
          </div>
          <button type="button" onClick={closeScanner} className="rounded-xl p-2 text-base-muted transition hover:bg-base-subtle">
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 rounded-2xl border border-base-border bg-base-subtle p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-xylo-500" />
              <p className="text-sm font-medium text-base-text">Cámara</p>
            </div>
            <button
              type="button"
              onClick={cameraRunning ? stopCamera : startCamera}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${cameraRunning ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-xylo-500 text-white hover:bg-xylo-600"}`}
            >
              {cameraRunning ? "Detener cámara" : "Abrir cámara"}
            </button>
          </div>
          <div id="xylo-product-barcode-reader" className={`overflow-hidden rounded-xl bg-black ${cameraRunning ? "min-h-52" : "h-0"}`} />
          <p className="mt-3 text-xs text-base-muted">{status}</p>
          {error && <p className="mt-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        </div>

        <form onSubmit={handleManualSubmit} className="mb-5 rounded-2xl border border-base-border p-4">
          <div className="mb-3 flex items-center gap-2">
            <Keyboard size={16} className="text-xylo-500" />
            <p className="text-sm font-medium text-base-text">Lector USB/Bluetooth o ingreso manual</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[150px_1fr_auto]">
            <select
              value={forcedType}
              onChange={(event) => {
                forcedTypeRef.current = event.target.value;
                setForcedType(event.target.value);
              }}
              className="rounded-xl border border-base-border bg-base-subtle px-3 py-2.5 text-sm text-base-text outline-none"
            >
              <option value="auto">Detectar solo</option>
              <option value="imei">IMEI</option>
              <option value="serial">Número de serie</option>
              <option value="ean">EAN / UPC</option>
              <option value="part_number">Código Apple</option>
            </select>
            <input
              ref={inputRef}
              value={manualValue}
              onChange={(event) => setManualValue(event.target.value)}
              placeholder="Escaneá y presioná Enter"
              autoComplete="off"
              className="rounded-xl border border-base-border bg-base-subtle px-4 py-2.5 font-mono text-sm text-base-text outline-none focus:border-xylo-500 focus:ring-2 focus:ring-xylo-500/20"
            />
            <button type="submit" className="rounded-xl bg-base-text px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90">
              Leer
            </button>
          </div>
        </form>

        <div className="mb-5 rounded-2xl border border-base-border p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-base-text">Datos detectados</p>
            <p className="text-xs text-base-muted">{labelData.raw_codes.length} código{labelData.raw_codes.length === 1 ? "" : "s"} leído{labelData.raw_codes.length === 1 ? "" : "s"}</p>
          </div>
          {detectedData.length === 0 ? (
            <p className="text-sm text-base-muted">Todavía no se detectaron datos.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {detectedData.map(([key, value]) => (
                <div key={key} className="rounded-xl bg-base-subtle px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-base-muted">{FIELD_LABELS[key]}</p>
                  <p className="break-all font-mono text-sm text-base-text">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={closeScanner} className="rounded-xl bg-base-subtle px-5 py-2.5 text-sm text-base-muted transition hover:bg-base-border">
            Cancelar
          </button>
          <button
            type="button"
            onClick={applyData}
            disabled={detectedData.length === 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-xylo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-xylo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle size={15} /> Aplicar datos
          </button>
        </div>
      </div>
    </div>
  );
}
