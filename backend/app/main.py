from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.session import AsyncSessionLocal


@asynccontextmanager
async def lifespan(app: FastAPI):
	async with AsyncSessionLocal() as session:
		await session.execute(text("SELECT 1"))
		await session.execute(text("UPDATE rooms SET status = 'AVAILABLE' WHERE status = 'MAINTENANCE'"))
		await session.commit()
	yield


settings = get_settings()
app = FastAPI(title="Guest House Management System", version="0.1.0", lifespan=lifespan)
app.add_middleware(
	CORSMiddleware,
	allow_origins=settings.cors_origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)
app.include_router(api_router)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
	return {"status": "ok"}
