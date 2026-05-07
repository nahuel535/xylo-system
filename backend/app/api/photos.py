import httpx
import base64
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

router = APIRouter(prefix="/photos", tags=["Photos"])

FOTOS_DIR = Path(__file__).parent.parent.parent.parent / "fotos"
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".heic", ".webp"}


@router.get("/local-gallery")
def get_local_gallery():
    if not FOTOS_DIR.exists():
        return {"models": []}
    models = []
    for model_dir in sorted(FOTOS_DIR.iterdir()):
        if not model_dir.is_dir():
            continue
        photos = []
        for photo_file in sorted(model_dir.iterdir()):
            if photo_file.suffix.lower() in IMAGE_EXTS:
                photos.append({
                    "filename": photo_file.name,
                    "url": f"/photos/local-file/{model_dir.name}/{photo_file.name}",
                    "name": photo_file.stem,
                })
        if photos:
            models.append({"model": model_dir.name, "photos": photos})
    return {"models": models}


@router.get("/local-file/{model}/{filename}")
def get_local_file(model: str, filename: str):
    file_path = FOTOS_DIR / model / filename
    if not file_path.exists() or file_path.suffix.lower() not in IMAGE_EXTS:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(str(file_path))

GEMINI_API_KEY = "AIzaSyDizOJJUOJWEymaggyD7Oxu07jkukdKoXY"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key={GEMINI_API_KEY}"

class GenerateRequest(BaseModel):
    model: str = ""
    color: str = ""
    storage: str = ""

@router.post("/generate")
async def generate_photo(data: GenerateRequest):
    try:
        prompt = (
            f"Professional product photography of an {data.model} {data.storage} in {data.color}. "
            f"Clean pure white background, studio lighting, sharp focus, Apple Store aesthetic, "
            f"premium tech product photo, centered composition, no shadows, photorealistic, 4k quality."
        )

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(GEMINI_URL, json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
            })

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Error de Gemini: {response.text}")

        result = response.json()

        for part in result["candidates"][0]["content"]["parts"]:
            if "inlineData" in part:
                image_data = part["inlineData"]["data"]
                mime_type = part["inlineData"]["mimeType"]
                return {
                    "image_base64": image_data,
                    "mime_type": mime_type,
                }

        raise HTTPException(status_code=500, detail="Gemini no devolvió imagen")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando imagen: {str(e)}")