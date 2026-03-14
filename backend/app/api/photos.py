import os
import fal_client
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/photos", tags=["Photos"])

FAL_KEY = "d8d91c72-4ac7-41cb-901a-2467b4d01d32:b0030a1a594c12926ebf298ed000df44"

class EnhanceRequest(BaseModel):
    image_url: str
    model: str = ""
    color: str = ""

@router.post("/enhance")
async def enhance_photo(data: EnhanceRequest):
    try:
        os.environ["FAL_KEY"] = FAL_KEY

        prompt = f"Professional product photography of an {data.model} {data.color} iPhone. Clean white background, studio lighting, sharp focus, Apple Store aesthetic, premium tech product photo, 4k"
        
        result = fal_client.run(
            "fal-ai/flux/schnell",
            arguments={
                "prompt": prompt,
                "image_url": data.image_url,
                "strength": 0.4,
                "num_inference_steps": 4,
                "image_size": "portrait_4_3",
            }
        )

        image_url = result["images"][0]["url"]
        return {"enhanced_url": image_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando imagen: {str(e)}")