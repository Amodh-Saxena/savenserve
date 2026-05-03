import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.api_v1 import router as api_router

app = FastAPI(
    title="Food Redistribution System API",
    description="Connect food donors with NGOs and manage surplus food efficiently.",
    version="1.0.0",
)

# In production, set ALLOWED_ORIGINS to your Vercel domain (comma-separated).
# e.g. ALLOWED_ORIGINS="https://savenserve.vercel.app"
# Defaults to * for local development.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok"}
