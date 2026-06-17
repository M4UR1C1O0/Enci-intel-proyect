from typing import AsyncGenerator, Optional
from app.repositories.chat_repository import (
    get_recent_alerts,
    get_recent_products,
    create_session,
    save_message,
)
from app.providers.gemini_provider import stream_gemini_response


def _build_context(alerts: list[dict], products: list[dict]) -> str:
    """
    Construye el bloque de contexto dinámico que se inyecta al prompt de Gemini.
    Usa las últimas alertas y productos de Firestore.
    """
    lines = []

    if alerts:
        lines.append("=== ALERTAS COMPETITIVAS RECIENTES ===")
        for a in alerts[:10]:
            title = a.get("title", "")
            competitor = a.get("competitor", "")
            priority = a.get("priority", "")
            created = a.get("created_at", "")
            lines.append(f"- [{priority.upper()}] {title} | Competidor: {competitor} | Fecha: {created}")

    if products:
        lines.append("\n=== PRODUCTOS ENCIPHARM MONITOREADOS ===")
        for p in products[:5]:
            name = p.get("name", "")
            category = p.get("category", "")
            price = p.get("price_clp", "")
            competitor_price = p.get("competitor_price_clp", "")
            lines.append(
                f"- {name} ({category}) | Precio Encipharm: ${price} CLP | "
                f"Precio competencia: ${competitor_price} CLP"
            )

    return "\n".join(lines)


async def handle_chat_query(
    question: str,
    user_id: str,
    species: Optional[str] = None,
    category: Optional[str] = None,
    session_id: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Orquesta el flujo completo del Consultor IA:
    1. Obtiene contexto dinámico desde Firestore
    2. Crea sesión si no existe
    3. Persiste pregunta del usuario
    4. Llama a Gemini con streaming
    5. Acumula la respuesta para persistirla al finalizar
    """
    # 1. Obtener contexto
    alerts = await get_recent_alerts(limit=10)
    products = await get_recent_products(limit=5)
    context = _build_context(alerts, products)

    # 2. Crear sesión si no viene una
    active_session_id = session_id
    if not active_session_id:
        title = question[:60] + "..." if len(question) > 60 else question
        active_session_id = await create_session(user_id, title)

    # 3. Persistir pregunta del usuario
    await save_message(
        session_id=active_session_id,
        user_id=user_id,
        role="user",
        content=question,
        species=species,
    )

    # 4. Streaming desde Gemini + acumular respuesta
    full_response = ""

    async def _stream_and_persist() -> AsyncGenerator[str, None]:
        nonlocal full_response
        async for token in stream_gemini_response(
            question=question,
            context=context,
            species=species,
            category=category,
        ):
            full_response += token
            yield token

        # 5. Persistir respuesta del asistente al finalizar el stream
        await save_message(
            session_id=active_session_id,
            user_id=user_id,
            role="assistant",
            content=full_response,
            species=species,
        )

    return _stream_and_persist(), active_session_id
