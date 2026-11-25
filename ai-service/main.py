"""
SpaceSense AI Processing Service
Phase 1 Foundation: FastAPI service skeleton with health endpoint.
"""
import os
from datetime import datetime, timezone
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="SpaceSense AI Service",
    description="Computer vision, object detection, spatial analysis, and layout recommendation service.",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    """Verify that the AI service is running."""
    return {
        "status": "ok",
        "service": "spacesense-ai-service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
