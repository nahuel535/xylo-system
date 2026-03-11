import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
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

const initialState = {
  category: "iPhone",
  brand: "Apple",
  model: "",
  storage: "",
  color: "",
  imei: "",
  serial_number: "",
  battery_health: "",
  cosmetic_condition: "",
  functional_condition: "",
  sim_type: "",
  condition_type: "",
  purchase_date: "",
  purchase_price_usd: "",
  suggested_sale_price_usd: "",
  supplier: "",
  notes: "",
  status: "in_stock",
  photo_url: "",
  created_by: "",
};

export default function NewProductPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialState);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await api.get("/users/");
        setUsers(response.data);

        if (response.data.length > 0) {
          setForm((prev) => ({
            ...prev,
            created_by: String(response.data[0].id),
          }));
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
      console.error("Error creando producto:", error);
      setMessage(error?.response?.data?.detail || "Error al crear el producto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Header
        title="Nuevo producto"
        subtitle="Alta guiada de equipo Apple"
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

          <Field
            label="Foto (URL por ahora)"
            name="photo_url"
            value={form.photo_url}
            onChange={handleChange}
          />

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
            className="w-full min-h-[130px] bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
          />
        </div>

        {message && (
          <p className="text-sm text-red-300">{message}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-xylo-500 hover:bg-xylo-400 disabled:opacity-60 transition text-white rounded-xl px-5 py-3 font-medium"
          >
            {saving ? "Guardando..." : "Guardar producto"}
          </button>

          <button
            type="button"
            onClick={() => setForm(initialState)}
            className="bg-white/5 hover:bg-white/10 transition rounded-xl px-5 py-3"
          >
            Limpiar
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
        className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none"
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
        className="w-full bg-white/5 border border-base-border rounded-xl px-4 py-3 text-white outline-none disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {normalizedOptions.map((option) => (
          <option key={option.value} value={option.value} className="text-black">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}