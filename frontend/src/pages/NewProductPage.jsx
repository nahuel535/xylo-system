import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import { uploadToCloudinary } from "../services/cloudinary";
import { Mic, MicOff, X, CheckCircle, SkipForward, ChevronRight } from "lucide-react";
import {
  CATEGORY_OPTIONS, CONDITION_OPTIONS, COSMETIC_CONDITION_OPTIONS,
  FUNCTIONAL_CONDITION_OPTIONS, SIM_TYPE_OPTIONS, SUPPLIER_OPTIONS,
  MODEL_OPTIONS, IPHONE_OPTIONS,
} from "../data/productOptions";

const initialState = {
  category: "iPhone", brand: "Apple", model: "", storage: "", color: "",
  imei: "", serial_number: "", battery_health: "", cosmetic_condition: "",
  functional_condition: "", sim_type: "", condition_type: "", purchase_date: "",
  purchase_price_usd: "", suggested_sale_price_usd: "", supplier: "",
  notes: "", status: "in_stock", photo_url: "", created_by: "",
};

// Campos que se dictan en el modo guiado
const VOICE_FIELDS = [
  { key: "imei", label: "IMEI", hint: "Dictá los 15 dígitos del IMEI", type: "number" },
  { key: "serial_number", label: "Número de serie", hint: "Dictá el número de serie", type: "text" },
  { key: "battery_health", label: "Salud de batería", hint: "Decí el porcentaje, por ejemplo: ochenta y nueve", type: "number" },
  { key: "purchase_price_usd", label: "Costo en dólares", hint: "Decí el precio de costo, por ejemplo: trescientos cincuenta", type: "number" },
  { key: "suggested_sale_price_usd", label: "Precio de venta en dólares", hint: "Decí el precio de venta sugerido", type: "number" },
  { key: "notes", label: "Observaciones", hint: "Describí el estado del equipo, accesorios, etc.", type: "text" },
];

// Convierte texto a número limpio
function transcriptToNumber(text) {
  const map = {
    "cero": 0, "uno": 1, "una": 1, "dos": 2, "tres": 3, "cuatro": 4,
    "cinco": 5, "seis": 6, "siete": 7, "ocho": 8, "nueve": 9, "diez": 10,
    "once": 11, "doce": 12, "trece": 13, "catorce": 14, "quince": 15,
    "dieciséis": 16, "diecisiete": 17, "dieciocho": 18, "diecinueve": 19,
    "veinte": 20, "veintiuno": 21, "veintidós": 22, "veintitrés": 23,
    "veinticuatro": 24, "veinticinco": 25, "veintiséis": 26, "veintisiete": 27,
    "veintiocho": 28, "veintinueve": 29, "treinta": 30, "cuarenta": 40,
    "cincuenta": 50, "sesenta": 60, "setenta": 70, "ochenta": 80, "noventa": 90,
    "cien": 100, "ciento": 100, "doscientos": 200, "trescientos": 300,
    "cuatrocientos": 400, "quinientos": 500, "seiscientos": 600,
    "setecientos": 700, "ochocientos": 800, "novecientos": 900,
    "mil": 1000,
  };

  // Primero intentar extraer número directo
  const directNumber = text.replace(/[^0-9]/g, "");
  if (directNumber.length > 0) return directNumber;

  // Intentar convertir palabras
  const words = text.toLowerCase().trim().split(/\s+/);
  let total = 0;
  let current = 0;
  for (const word of words) {
    const n = map[word];
    if (n !== undefined) {
      if (n === 1000) {
        current = current === 0 ? 1000 : current * 1000;
        total += current;
        current = 0;
      } else if (n >= 100) {
        current += n;
      } else {
        current += n;
      }
    } else if (word === "y") {
      continue;
    }
  }
  total += current;
  return total > 0 ? String(total) : text;
}

export default function NewProductPage() {
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const [form, setForm] = useState(initialState);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [listeningField, setListeningField] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Modo dictado guiado
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStep, setVoiceStep] = useState(0);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceConfirming, setVoiceConfirming] = useState(false);
  const [voiceDone, setVoiceDone] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await api.get("/users/");
        setUsers(response.data);
        if (response.data.length > 0) {
          setForm((prev) => ({ ...prev, created_by: String(response.data[0].id) }));
        }
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      }
    }
    loadUsers();
  }, []);

  const availableStorages = useMemo(() => {
    if (!form.model || !IPHONE_OPTIONS[form.model]) return [];
    return IPHONE_OPTIONS[form.model].storages;
  }, [form.model]);

  const availableColors = useMemo(() => {
    if (!form.model || !IPHONE_OPTIONS[form.model]) return [];
    return IPHONE_OPTIONS[form.model].colors;
  }, [form.model]);

  function speak(text) {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-AR";
    utterance.rate = 0.95;
    synthRef.current.speak(utterance);
  }

  function stopSpeaking() {
    synthRef.current?.cancel();
  }

  // ── Modo dictado guiado ───────────────────────────
  function startVoiceMode() {
    setVoiceMode(true);
    setVoiceStep(0);
    setVoiceTranscript("");
    setVoiceConfirming(false);
    setVoiceDone(false);
    setTimeout(() => speakField(0), 300);
  }

  function speakField(step) {
    const field = VOICE_FIELDS[step];
    if (!field) return;
    speak(`${field.label}. ${field.hint}`);
    setTimeout(() => startVoiceListening(step), 2500);
  }

  function startVoiceListening(step) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current?.stop();
    const recognition = new SpeechRecognition();
    recognition.lang = "es-AR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognitionRef.current = recognition;
    setVoiceListening(true);

    recognition.onresult = (event) => {
      const field = VOICE_FIELDS[step];
      let raw = event.results[0][0].transcript;

      // Limpiar según tipo
      const processed = field.type === "number" ? transcriptToNumber(raw) : raw;

      setVoiceTranscript(processed);
      setVoiceListening(false);
      setVoiceConfirming(true);
      speak(`Escuché: ${processed}. ¿Es correcto?`);
    };

    recognition.onerror = () => {
      setVoiceListening(false);
      speak("No te escuché bien. Intentá de nuevo.");
      setTimeout(() => startVoiceListening(step), 1500);
    };

    recognition.onend = () => setVoiceListening(false);
    recognition.start();
  }

  function confirmVoiceField() {
    const field = VOICE_FIELDS[voiceStep];
    setForm((prev) => ({ ...prev, [field.key]: voiceTranscript }));
    setVoiceConfirming(false);
    setVoiceTranscript("");

    const nextStep = voiceStep + 1;
    if (nextStep >= VOICE_FIELDS.length) {
      setVoiceDone(true);
      speak("¡Listo! Revisá los datos y guardá el producto.");
    } else {
      setVoiceStep(nextStep);
      setTimeout(() => speakField(nextStep), 500);
    }
  }

  function rejectVoiceField() {
    setVoiceConfirming(false);
    setVoiceTranscript("");
    speak("Bien, repetilo.");
    setTimeout(() => startVoiceListening(voiceStep), 1000);
  }

  function skipVoiceField() {
    setVoiceConfirming(false);
    setVoiceTranscript("");
    const nextStep = voiceStep + 1;
    if (nextStep >= VOICE_FIELDS.length) {
      setVoiceDone(true);
      speak("¡Listo! Revisá los datos y guardá el producto.");
    } else {
      setVoiceStep(nextStep);
      setTimeout(() => speakField(nextStep), 300);
    }
  }

  function closeVoiceMode() {
    stopSpeaking();
    recognitionRef.current?.stop();
    setVoiceMode(false);
    setVoiceListening(false);
    setVoiceConfirming(false);
    setVoiceTranscript("");
    setVoiceDone(false);
  }

  // ── Dictado campo individual ──────────────────────
  function handleVoice(fieldName) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Tu navegador no soporta dictado por voz. Usá Chrome."); return; }
    if (listeningField === fieldName) { recognitionRef.current?.stop(); setListeningField(null); return; }
    recognitionRef.current?.stop();
    const recognition = new SpeechRecognition();
    recognition.lang = "es-AR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    setListeningField(fieldName);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setForm((prev) => ({ ...prev, [fieldName]: transcript }));
      setListeningField(null);
    };
    recognition.onerror = () => setListeningField(null);
    recognition.onend = () => setListeningField(null);
    recognition.start();
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm((prev) => ({ ...prev, photo_url: url }));
      setPhotoPreview(url);
    } catch {
      setMessage("Error subiendo la foto. Intentá de nuevo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "model") { updated.storage = ""; updated.color = ""; }
      return updated;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      await api.post("/products/", {
        ...form,
        battery_health: form.battery_health ? Number(form.battery_health) : null,
        purchase_price_usd: Number(form.purchase_price_usd || 0),
        suggested_sale_price_usd: Number(form.suggested_sale_price_usd || 0),
        photo_url: form.photo_url || null,
        created_by: form.created_by ? Number(form.created_by) : null,
      });
      navigate("/products");
    } catch (error) {
      setMessage(error?.response?.data?.detail || "Error al crear el producto.");
    } finally {
      setSaving(false);
    }
  }

  const currentField = VOICE_FIELDS[voiceStep];

  return (
    <div>
      <Header title="Nuevo producto" subtitle="Alta guiada de equipo Apple" />

      {/* ── Modal modo dictado ── */}
      {voiceMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-base-card border border-base-border rounded-3xl p-8 w-full max-w-md shadow-elevated">

            {/* Header modal */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-xylo-500 rounded-xl flex items-center justify-center">
                  <Mic size={16} className="text-white" />
                </div>
                <p className="font-semibold text-base-text">Modo dictado</p>
              </div>
              <button onClick={closeVoiceMode} className="p-2 rounded-xl text-base-muted hover:bg-base-subtle transition">
                <X size={18} />
              </button>
            </div>

            {/* Progreso */}
            <div className="flex gap-1.5 mb-6">
              {VOICE_FIELDS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    i < voiceStep ? "bg-xylo-500" :
                    i === voiceStep ? "bg-xylo-300" :
                    "bg-base-subtle"
                  }`}
                />
              ))}
            </div>

            {voiceDone ? (
              /* Pantalla final */
              <div className="text-center">
                <div className="w-16 h-16 bg-xylo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-xylo-500" />
                </div>
                <p className="text-lg font-semibold text-base-text mb-2">¡Dictado completo!</p>
                <p className="text-sm text-base-muted mb-6">Revisá los campos y guardá el producto.</p>
                <button
                  onClick={closeVoiceMode}
                  className="w-full bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl px-4 py-3 font-medium transition"
                >
                  Revisar y guardar
                </button>
              </div>
            ) : (
              <>
                {/* Campo actual */}
                <div className="bg-base-subtle rounded-2xl p-5 mb-5">
                  <p className="text-xs font-medium text-base-muted uppercase tracking-wide mb-1">
                    Campo {voiceStep + 1} de {VOICE_FIELDS.length}
                  </p>
                  <p className="text-xl font-semibold text-base-text mb-1">{currentField?.label}</p>
                  <p className="text-sm text-base-muted">{currentField?.hint}</p>
                </div>

                {/* Estado */}
                {voiceListening && (
                  <div className="flex flex-col items-center py-4 mb-4">
                    <div className="relative mb-3">
                      <div className="w-16 h-16 bg-xylo-500/10 rounded-full flex items-center justify-center">
                        <Mic size={28} className="text-xylo-500" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-xylo-400 animate-ping opacity-40" />
                    </div>
                    <p className="text-sm text-base-muted">Escuchando...</p>
                  </div>
                )}

                {voiceConfirming && (
                  <div className="mb-4">
                    <p className="text-xs text-base-muted mb-2">Escuché:</p>
                    <div className="bg-xylo-500/5 border border-xylo-500/20 rounded-xl px-4 py-3 mb-4">
                      <p className="text-lg font-semibold text-xylo-600 text-center">{voiceTranscript}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={confirmVoiceField}
                        className="flex-1 flex items-center justify-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl px-4 py-3 font-medium transition"
                      >
                        <CheckCircle size={16} /> Correcto
                      </button>
                      <button
                        onClick={rejectVoiceField}
                        className="flex-1 flex items-center justify-center gap-2 bg-base-subtle hover:bg-base-border text-base-text rounded-xl px-4 py-3 font-medium transition"
                      >
                        <MicOff size={16} /> Repetir
                      </button>
                    </div>
                  </div>
                )}

                {!voiceListening && !voiceConfirming && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => startVoiceListening(voiceStep)}
                      className="w-full flex items-center justify-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl px-4 py-3 font-medium transition"
                    >
                      <Mic size={16} /> Dictar este campo
                    </button>
                    <button
                      onClick={skipVoiceField}
                      className="w-full flex items-center justify-center gap-2 bg-base-subtle hover:bg-base-border text-base-muted rounded-xl px-4 py-2.5 text-sm transition"
                    >
                      <SkipForward size={15} /> Saltar campo
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-base-card border border-base-border rounded-2xl p-6 space-y-6 shadow-card">

        {/* Botón modo dictado */}
        <div className="flex items-center justify-between pb-4 border-b border-base-border">
          <p className="text-sm text-base-muted">Completá los campos manualmente o usá el modo dictado</p>
          <button
            type="button"
            onClick={startVoiceMode}
            className="flex items-center gap-2 bg-xylo-500 hover:bg-xylo-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition shadow-sm"
          >
            <Mic size={15} />
            Modo dictado
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <SelectField label="Categoría" name="category" value={form.category} onChange={handleChange} options={CATEGORY_OPTIONS} />
          <Field label="Marca" name="brand" value={form.brand} onChange={handleChange} onVoice={handleVoice} listening={listeningField === "brand"} />
          <SelectField label="Modelo" name="model" value={form.model} onChange={handleChange} options={MODEL_OPTIONS} required placeholder="Seleccionar modelo" />
          <SelectField label="Capacidad" name="storage" value={form.storage} onChange={handleChange} options={availableStorages} placeholder={form.model ? "Seleccionar capacidad" : "Elegí modelo primero"} disabled={!form.model} />
          <SelectField label="Color" name="color" value={form.color} onChange={handleChange} options={availableColors} placeholder={form.model ? "Seleccionar color" : "Elegí modelo primero"} disabled={!form.model} />
          <Field label="IMEI" name="imei" value={form.imei} onChange={handleChange} onVoice={handleVoice} listening={listeningField === "imei"} required />
          <Field label="Número de serie" name="serial_number" value={form.serial_number} onChange={handleChange} onVoice={handleVoice} listening={listeningField === "serial_number"} />
          <Field label="Batería (%)" name="battery_health" value={form.battery_health} onChange={handleChange} onVoice={handleVoice} listening={listeningField === "battery_health"} type="number" />
          <SelectField label="Estado estético" name="cosmetic_condition" value={form.cosmetic_condition} onChange={handleChange} options={COSMETIC_CONDITION_OPTIONS} placeholder="Seleccionar estado" />
          <SelectField label="Estado funcional" name="functional_condition" value={form.functional_condition} onChange={handleChange} options={FUNCTIONAL_CONDITION_OPTIONS} placeholder="Seleccionar estado" />
          <SelectField label="Tipo de SIM" name="sim_type" value={form.sim_type} onChange={handleChange} options={SIM_TYPE_OPTIONS} placeholder="Seleccionar tipo" />
          <SelectField label="Condición" name="condition_type" value={form.condition_type} onChange={handleChange} options={CONDITION_OPTIONS} placeholder="Seleccionar condición" />
          <Field label="Fecha de compra" name="purchase_date" value={form.purchase_date} onChange={handleChange} type="date" />
          <Field label="Costo USD" name="purchase_price_usd" value={form.purchase_price_usd} onChange={handleChange} onVoice={handleVoice} listening={listeningField === "purchase_price_usd"} type="number" step="0.01" required />
          <Field label="Precio sugerido USD" name="suggested_sale_price_usd" value={form.suggested_sale_price_usd} onChange={handleChange} onVoice={handleVoice} listening={listeningField === "suggested_sale_price_usd"} type="number" step="0.01" required />
          <SelectField label="Proveedor" name="supplier" value={form.supplier} onChange={handleChange} options={SUPPLIER_OPTIONS} placeholder="Seleccionar proveedor" />

          {/* Foto */}
          <div className="md:col-span-2 xl:col-span-3">
            <p className="text-sm text-base-muted mb-2">Foto del equipo</p>
            <label className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer transition
              ${uploadingPhoto ? "opacity-50 pointer-events-none" : "hover:border-xylo-500/50 hover:bg-base-subtle"}
              ${photoPreview ? "border-xylo-500/40" : "border-base-border"}
            `}>
              {photoPreview ? (
                <div className="relative w-full">
                  <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 hover:opacity-100 transition">
                    <p className="text-white text-sm font-medium">Cambiar foto</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  {uploadingPhoto ? (
                    <>
                      <div className="w-8 h-8 border-2 border-xylo-500 border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-sm text-base-muted">Subiendo foto...</p>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-base-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <p className="text-sm text-base-muted">Tocá para subir una foto</p>
                      <p className="text-xs text-base-muted mt-1">JPG, PNG o HEIC</p>
                    </>
                  )}
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
            </label>
          </div>

          <SelectField
            label="Usuario creador"
            name="created_by"
            value={form.created_by}
            onChange={handleChange}
            options={users.map((user) => ({ value: String(user.id), label: `${user.name} (${user.role})` }))}
            placeholder="Seleccionar usuario"
          />
        </div>

        <div>
          <p className="text-sm text-base-muted mb-2">Observaciones</p>
          <div className="relative">
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Detalle del equipo, caja, accesorios, estado, etc."
              className="w-full min-h-[130px] bg-base-subtle border border-base-border rounded-xl px-4 py-3 pr-12 text-base-text outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
            />
            <MicButton listening={listeningField === "notes"} onClick={() => handleVoice("notes")} className="absolute top-3 right-3" />
          </div>
        </div>

        {message && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{message}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-xylo-500 hover:bg-xylo-600 disabled:opacity-60 transition text-white rounded-xl px-6 py-3 font-medium shadow-sm">
            {saving ? "Guardando..." : "Guardar producto"}
          </button>
          <button type="button" onClick={() => { setForm(initialState); setPhotoPreview(null); }} className="bg-base-subtle hover:bg-base-border transition text-base-muted rounded-xl px-6 py-3">
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
}

function MicButton({ listening, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded-lg transition ${
        listening ? "bg-xylo-500/10 text-xylo-500 animate-pulse" : "text-base-muted hover:text-base-text hover:bg-base-subtle"
      } ${className}`}
      title={listening ? "Escuchando... (click para cancelar)" : "Dictar por voz"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1.5 14.93A7.001 7.001 0 0 1 5 9H3a9 9 0 0 0 8 8.94V20H8v2h8v-2h-3v-2.07A9 9 0 0 0 21 9h-2a7 7 0 0 1-5.5 6.93z"/>
      </svg>
    </button>
  );
}

function Field({ label, name, value, onChange, onVoice, listening = false, type = "text", required = false, placeholder = "", step }) {
  return (
    <div>
      <p className="text-sm text-base-muted mb-2">{label}</p>
      <div className="relative">
        <input
          name={name} value={value} onChange={onChange} type={type}
          required={required} placeholder={listening ? "Escuchando..." : placeholder} step={step}
          className={`w-full border rounded-xl px-4 py-3 pr-10 text-base-text outline-none transition ${
            listening
              ? "border-xylo-400 bg-xylo-500/5"
              : "bg-base-subtle border-base-border focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500"
          }`}
        />
        {onVoice && <MicButton listening={listening} onClick={() => onVoice(name)} className="absolute right-2 top-1/2 -translate-y-1/2" />}
      </div>
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, required = false, placeholder = "Seleccionar", disabled = false }) {
  const normalizedOptions = options.map((o) => typeof o === "string" ? { value: o, label: o } : o);
  return (
    <div>
      <p className="text-sm text-base-muted mb-2">{label}</p>
      <select
        name={name} value={value} onChange={onChange} required={required} disabled={disabled}
        className="w-full bg-base-subtle border border-base-border rounded-xl px-4 py-3 text-base-text outline-none disabled:opacity-50 focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
      >
        <option value="">{placeholder}</option>
        {normalizedOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}