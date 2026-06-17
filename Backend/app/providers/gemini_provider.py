import os
from typing import AsyncGenerator
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig

# Configuración del proyecto GCP
GCP_PROJECT = os.getenv("GCP_PROJECT_ID", "enci-intel-b48da")
GCP_LOCATION = os.getenv("GCP_LOCATION", "us-central1")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

SYSTEM_PROMPT = """
Eres el Consultor Veterinario IA de ENCI-INTEL, plataforma de inteligencia competitiva
de Encipharm, empresa líder en salud y nutrición animal en Chile.

Tu rol es responder consultas técnicas veterinarias con base en:
- Farmacología veterinaria (dosis, principios activos, interacciones)
- Protocolos clínicos por especie (bovino, porcino, aviar, canino, felino, equino, peces)
- Normativa regulatoria chilena (SAG, ISP, MINAGRI)
- Inteligencia competitiva del mercado veterinario chileno

Cuando sea relevante, compara productos de Encipharm con los de la competencia
(Zoetis, Drag Pharma, Agrovet, Virbac) usando el contexto de mercado proporcionado.

Reglas:
- Responde siempre en español
- Sé preciso, conciso y cita fuentes cuando sea posible
- Si no tienes certeza, indícalo claramente
- No inventes dosis ni normativas; si no sabes, recomienda consultar al médico veterinario
- Incluye comparaciones de mercado solo cuando el contexto lo permita
""".strip()

_vertexai_initialized = False


def _init_vertexai():
    global _vertexai_initialized
    if not _vertexai_initialized:
        vertexai.init(project=GCP_PROJECT, location=GCP_LOCATION)
        _vertexai_initialized = True


async def stream_gemini_response(
    question: str,
    context: str = "",
    species: str | None = None,
    category: str | None = None,
) -> AsyncGenerator[str, None]:
    """
    Llama a Gemini 1.5 Pro con streaming y retorna un async generator de tokens.
    """
    _init_vertexai()

    model = GenerativeModel(
        model_name=GEMINI_MODEL,
        system_instruction=SYSTEM_PROMPT,
    )

    # Construir el prompt enriquecido con contexto dinámico
    prompt_parts = []

    if species and species.lower() not in ("todas", "all", "null"):
        prompt_parts.append(f"Especie objetivo: {species}")

    if category:
        prompt_parts.append(f"Categoría terapéutica: {category}")

    if context:
        prompt_parts.append(f"\n--- Contexto de mercado (alertas y productos recientes) ---\n{context}")

    prompt_parts.append(f"\nConsulta: {question}")

    full_prompt = "\n".join(prompt_parts)

    generation_config = GenerationConfig(
        temperature=0.3,
        max_output_tokens=1024,
        top_p=0.8,
    )

    responses = await model.generate_content_async(
        full_prompt,
        generation_config=generation_config,
        stream=True,
    )

    async for chunk in responses:
        if chunk.text:
            yield chunk.text
