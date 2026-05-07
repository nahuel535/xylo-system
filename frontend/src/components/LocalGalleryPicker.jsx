import { useState } from "react";
import { X, Search, ImageOff } from "lucide-react";
import galleryData from "../data/gallery.json";

const MODELS = Object.entries(galleryData).map(([model, photos]) => ({ model, photos }));

export default function LocalGalleryPicker({ open, onClose, onSelect }) {
  const [search, setSearch] = useState("");

  if (!open) return null;

  const filtered = search.trim()
    ? MODELS.filter((m) => m.model.toLowerCase().includes(search.toLowerCase()))
    : MODELS;

  function pick(url) {
    onSelect([url]);
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
            <p className="text-xs text-base-muted mt-0.5">Elegí una foto para el equipo</p>
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
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-base-muted">
              <ImageOff size={32} className="mb-3 opacity-40" />
              <p className="text-sm">No se encontraron fotos</p>
            </div>
          )}

          {filtered.map((group) => (
            <div key={group.model}>
              <p className="text-xs font-semibold text-base-muted uppercase tracking-wider mb-3">
                {group.model}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {group.photos.map((photo) => (
                  <button
                    key={photo.url}
                    type="button"
                    onClick={() => pick(photo.url)}
                    className="relative aspect-square rounded-xl overflow-hidden border-2 border-base-border hover:border-xylo-500/60 transition focus:outline-none group"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-full object-contain bg-white p-1"
                      loading="lazy"
                    />
                    <p className="absolute bottom-0 inset-x-0 text-center text-[10px] bg-black/40 text-white py-0.5 truncate px-1 opacity-0 group-hover:opacity-100 transition">
                      {photo.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
