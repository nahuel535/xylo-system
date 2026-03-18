import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import { uploadToCloudinary } from "../services/cloudinary";
import {
  CATEGORY_OPTIONS,
  CONDITION_OPTIONS,
  COSMETIC_CONDITION_OPTIONS,
  FUNCTIONAL_CONDITION_OPTIONS,
  SIM_TYPE_OPTIONS,
  SUPPLIER_OPTIONS,
  MODEL_OPTIONS,
  IPHONE_OPTIONS,
} from "../data/productOptions";

export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [productRes, usersRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get("/users/"),
        ]);

        const product = productRes.data;

        setUsers(usersRes.data);
        setForm({
          category: product.category || "iPhone",
          brand: product.brand || "Apple",
          model: product.model || "",
          storage: product.storage || "",
          color: product.color || "",
          imei: product.imei || "",
          serial_number: product.serial_number || "",
          battery_health: product.battery_health ?? "",
          cosmetic_condition: product.cosmetic_condition || "",
          functional_condition: product.functional_condition || "",
          sim_type: product.sim_type || "",
          condition_type: product.condition_type || "",
          purchase_date: product.purchase_date || "",
          purchase_price_usd: product.purchase_price_usd || "",
          suggested_sale_price_usd: product.suggested_sale_price_usd || "",
          supplier: product.supplier || "",
          notes: product.notes || "",
          status: product.status || "in_stock",
          photo_url: product.photo_url || "",
          created_by: product.created_by ? String(product.created_by) : "",
        });
      } catch (error) {
        console.error("Error cargando producto:", error);
        setMessage("No se pudo cargar el producto.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  const availableStorages = useMemo(() => {
    if (!form?.model || !IPHONE_OPTIONS[form.model]) return [];
    return IPHONE_OPTIONS[form.model].storages;
  }, [form?.model]);

  const availableColors = useMemo(() => {
    if (!form?.model || !IPHONE_OPTIONS[form.model]) return [];
    return IPHONE_OPTIONS[form.model].colors;
  }, [form?.model]);

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm((prev) => ({ ...prev, photo_url: url }));
    } catch {
      setMessage("Error subiendo la foto. Intentá de nuevo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (name === "model") {
        updated.storage = "";
        updated.color = "";
      }

      return updated;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      await api.put(`/products/${id}`, {
        ...form,
        battery_health: form.battery_health ? Number(form.battery_health) : null,
        purchase_price_usd: Number(form.purchase_price_usd || 0),
        suggested_sale_price_usd: Number(form.suggested_sale_price_usd || 0),
        photo_url: form.photo_url || null,
        created_by: form.created_by ? Number(form.created_by) : null,
      });

      navigate(`/products/${id}`);
    } catch (error) {
      console.error("Error editando producto:", error);
      setMessage(error?.response?.data?.detail || "Error al editar el producto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "¿Seguro que querés eliminar este producto? Esta acción no se puede deshacer."
    );

    if (!confirmed) return;

    setDeleting(true);
    setMessage("");

    try {
      await api.delete(`/products/${id}`);
      navigate("/products");
    } catch (error) {
      console.error("Error eliminando producto:", error);
      setMessage(error?.response?.data?.detail || "Error al eliminar el producto.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <p className="text-base-muted">Cargando producto...</p>;
  if (!form) return <p className="text-base-muted">Producto no encontrado.</p>;

  return (
    <div>
      <Header
        title="Editar producto"
        subtitle={`Equipo #${id}`}
      />

      <form
        onSubmit={handleSubmit}
        className="bg-base-card border border-base-border rounded-xl p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <SelectField
            label="Categoría"
            name="category"
            value={form.category}
            onChange={handleChange}
            options={CATEGORY_OPTIONS}
          />

          <Field
            label="Marca"
            name="brand"
            value={form.brand}
            onChange={handleChange}
          />

          <SelectField
            label="Modelo"
            name="model"
            value={form.model}
            onChange={handleChange}
            options={MODEL_OPTIONS}
            required
            placeholder="Seleccionar modelo"
          />

          <SelectField
            label="Capacidad"
            name="storage"
            value={form.storage}
            onChange={handleChange}
            options={availableStorages}
            placeholder={form.model ? "Seleccionar capacidad" : "Elegí modelo primero"}
            disabled={!form.model}
          />

          <SelectField
            label="Color"
            name="color"
            value={form.color}
            onChange={handleChange}
            options={availableColors}
            placeholder={form.model ? "Seleccionar color" : "Elegí modelo primero"}
            disabled={!form.model}
          />

          <Field
            label="IMEI"
            name="imei"
            value={form.imei}
            onChange={handleChange}
            required
          />

          <Field
            label="Número de serie"
            name="serial_number"
            value={form.serial_number}
            onChange={handleChange}
          />

          <Field
            label="Batería (%)"
            name="battery_health"
            value={form.battery_health}
            onChange={handleChange}
            type="number"
          />

          <SelectField
            label="Estado estético"
            name="cosmetic_condition"
            value={form.cosmetic_condition}
            onChange={handleChange}
            options={COSMETIC_CONDITION_OPTIONS}
            placeholder="Seleccionar estado"
          />

          <SelectField
            label="Estado funcional"
            name="functional_condition"
            value={form.functional_condition}
            onChange={handleChange}
            options={FUNCTIONAL_CONDITION_OPTIONS}
            placeholder="Seleccionar estado"
          />

          <SelectField
            label="Tipo de SIM"
            name="sim_type"
            value={form.sim_type}
            onChange={handleChange}
            options={SIM_TYPE_OPTIONS}
            placeholder="Seleccionar tipo"
          />

          <SelectField
            label="Condición"
            name="condition_type"
            value={form.condition_type}
            onChange={handleChange}
            options={CONDITION_OPTIONS}
            placeholder="Seleccionar condición"
          />

          <Field
            label="Fecha de compra"
            name="purchase_date"
            value={form.purchase_date}
            onChange={handleChange}
            type="date"
          />

          <Field
            label="Costo USD"
            name="purchase_price_usd"
            value={form.purchase_price_usd}
            onChange={handleChange}
            type="number"
            step="0.01"
            required
          />

          <Field
            label="Precio sugerido USD"
            name="suggested_sale_price_usd"
            value={form.suggested_sale_price_usd}
            onChange={handleChange}
            type="number"
            step="0.01"
            required
          />

          <SelectField
            label="Proveedor"
            name="supplier"
            value={form.supplier}
            onChange={handleChange}
            options={SUPPLIER_OPTIONS}
            placeholder="Seleccionar proveedor"
          />

          <div className="md:col-span-2 xl:col-span-3">
            <p className="text-sm text-base-muted mb-2">Foto del equipo</p>
            <label className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer transition
              ${uploadingPhoto ? "opacity-50 pointer-events-none" : "hover:border-xylo-500/50 hover:bg-base-subtle"}
              ${form.photo_url ? "border-xylo-500/40" : "border-base-border"}
            `}>
              {form.photo_url ? (
                <div className="relative w-full">
                  <img src={form.photo_url} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
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
            options={users.map((user) => ({
              value: String(user.id),
              label: `${user.name} (${user.role})`,
            }))}
            placeholder="Seleccionar usuario"
          />
        </div>

        <div>
          <p className="text-sm text-base-muted mb-2">Observaciones</p>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Detalle del equipo, caja, accesorios, estado, etc."
            className="w-full min-h-[130px] bg-base-subtle border border-base-border rounded-xl px-4 py-3 text-base-text outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
          />
        </div>

        {message && (
          <p className="text-sm text-red-300">{message}</p>
        )}

        <div className="flex gap-3 flex-wrap">
          <button
            type="submit"
            disabled={saving}
            className="bg-xylo-500 hover:bg-xylo-400 disabled:opacity-60 transition text-white rounded-xl px-5 py-3 font-medium"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-white/5 hover:bg-white/10 transition rounded-xl px-5 py-3"
          >
            Cancelars
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 transition rounded-xl px-5 py-3"
          >
            {deleting ? "Eliminando..." : "Eliminar producto"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  step,
}) {
  return (
    <div>
      <p className="text-sm text-base-muted mb-2">{label}</p>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        required={required}
        placeholder={placeholder}
        step={step}
        className="w-full bg-base-subtle border border-base-border rounded-xl px-4 py-3 text-base-text outline-none focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  placeholder = "Seleccionar",
  disabled = false,
}) {
  const normalizedOptions = options.map((option) =>
    typeof option === "string"
      ? { value: option, label: option }
      : option
  );

  return (
    <div>
      <p className="text-sm text-base-muted mb-2">{label}</p>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="w-full bg-base-subtle border border-base-border rounded-xl px-4 py-3 text-base-text outline-none disabled:opacity-50 focus:ring-2 focus:ring-xylo-500/20 focus:border-xylo-500 transition"
      >
        <option value="">{placeholder}</option>
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}