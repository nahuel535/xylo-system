import { useEffect, useState } from "react";
import { X, Search, ImageOff } from "lucide-react";
import api from "../services/api";

const BASE_URL = api.defaults.baseURL;

export default function LocalGalleryPicker({ open, onClose, onSelect, multiSelect = false }) {
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setSearch("");
    setLoading(true);
    api.get("/photos/local-gallery")
      .then((res) => setGallery(res.data.models || []))
      .catch(() => setGallery([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const filtered = search.trim()
    ? gallery.filter((m) => m.model.toLowerCase().includes(search.toLowerCase()))
    : gallery;

  function toggleSelect(url) {
    if (!multiSelect) {
      onSelect([url]);
      onClose();
      return;
    }
    setSelected((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  }

  function confirmMulti() {
    if (selected.length) onSelect(selected);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl bg-base-card border border-base-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-border shrink-0">
          <div>
            <p className="font-semibold text-base-text">Galería del sistema</p>
            <p className="text-xs text-base-muted mt-0.5">
              {multiSelect ? "Seleccioná una o más fotos" : "Elegí una foto para el equipo"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-base-subtle text-base-muted hover:text-base-text transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-base-border shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-muted" />
            <input
              type="text"
              placeholder="Buscar modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-base-subtle border border-base-border rounded-lg text-base-text placeholder:text-base-muted focus:outline-none focus:border-xylo-500/50"
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-2 border-xylo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-base-muted">
              <ImageOff size={32} className="mb-3 opacity-40" />
              <p className="text-sm">No se encontraron fotos</p>
            </div>
          )}

          {!loading && filtered.map((group) => (
            <div key={group.model}>
              <p className="text-xs font-semibold text-base-muted uppercase tracking-wider mb-3">
                {group.model}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {group.photos.map((photo) => {
                  const fullUrl = `${BASE_URL}${photo.url}`;
                  const isSelected = selected.includes(fullUrl);
                  return (
                    <button
                      key={photo.url}
                      type="button"
                      onClick={() => toggleSelect(fullUrl)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition focus:outline-none
                        ${isSelected
                          ? "border-xylo-500 ring-2 ring-xylo-500/30"
                          : "border-base-border hover:border-xylo-500/50"
                        }`}
                    >
                      <img
                        src={fullUrl}
                        alt={photo.name}
                        className="w-full h-full object-contain bg-white p-1"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-xylo-500/20 flex items-end justify-end p-1.5">
                          <div className="w-5 h-5 rounded-full bg-xylo-500 flex items-center justify-center">
                            <svg viewBox="0 0 12 9" fill="none" className="w-3 h-3">
                              <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      )}
                      <p className="absolute bottom-0 inset-x-0 text-center text-[10px] bg-black/40 text-white py-0.5 truncate px-1">
                        {photo.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer (multi-select only) */}
        {multiSelect && (
          <div className="px-5 py-3 border-t border-base-border shrink-0 flex items-center justify-between">
            <p className="text-sm text-base-muted">
              {selected.length > 0 ? `${selected.length} seleccionada${selected.length > 1 ? "s" : ""}` : "Ninguna seleccionada"}
            </p>
            <button
              type="button"
              onClick={confirmMulti}
              disabled={selected.length === 0}
              className="px-4 py-1.5 text-sm font-medium rounded-lg bg-xylo-500 text-white disabled:opacity-40 hover:bg-xylo-600 transition"
            >
              Agregar {selected.length > 0 ? `(${selected.length})` : ""}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
