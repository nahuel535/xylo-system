const CLOUD_NAME = "dwk9judcg"; // lo encontrás en el dashboard de Cloudinary
const UPLOAD_PRESET = "xylo_products"; // lo creás en Cloudinary (paso abajo)

export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "xylo/products");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Error subiendo imagen");
  const data = await res.json();
  return data.secure_url;
}