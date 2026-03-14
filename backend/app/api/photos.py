import httpx
import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/photos", tags=["Photos"])

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