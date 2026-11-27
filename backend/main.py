import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Ensure backend directory is in sys.path so modules import reliably
_BACKEND_DIR = Path(__file__).resolve().parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import db
import ml_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML models
    ml_service.load_models()
    err_ml = ml_service.load_error() or ""
    print(f"ML models loaded: {ml_service.is_loaded()} {err_ml}".strip(), flush=True)

    # Check Supabase connection (app must still start even if Supabase fails)
    try:
        ok, err_db = db.check()
        err_msg = f" {err_db}" if err_db else ""
        print(f"Supabase connected: {ok}{err_msg}", flush=True)
    except Exception as exc:
        print(f"Supabase connected: False {exc}", flush=True)

    yield


app = FastAPI(title="SludgeTrace API", lifespan=lifespan)

# Allow frontend dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"app": "SludgeTrace API", "health": "/health", "docs": "/docs"}


@app.get("/health")
def health():
    ok, err = db.check()
    return {
        "status": "ok",
        "ml_loaded": ml_service.is_loaded(),
        "ml_error": ml_service.load_error(),
        "supabase_connected": ok,
        "supabase_error": err,
    }


@app.get("/plants")
def list_plants():
    try:
        return db.get_client().table("plants").select("*").execute().data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)[:200]}",
        )


class PredictIn(BaseModel):
    model_config = {"extra": "forbid"}

    Influent_BOD_mgL: float = Field(ge=0, description="Influent BOD (mg/L)")
    Influent_COD_mgL: float = Field(ge=0, description="Influent COD (mg/L)")
    Influent_TSS_mgL: float = Field(ge=0, description="Influent TSS (mg/L)")
    Influent_NH4_mgL: float = Field(ge=0, description="Influent NH4 (mg/L)")
    Aeration_Tank_DO_mgL: float = Field(ge=0, description="Aeration Tank DO (mg/L)")
    Aeration_Tank_Temp_C: float = Field(description="Aeration Tank Temperature (°C)")
    Air_Flow_km3h: float = Field(ge=0, description="Air Flow (km³/h)")
    pH: float = Field(ge=0, le=14, description="pH (0-14)")
    ORP_mV: float = Field(description="Oxidation-Reduction Potential (mV)")


@app.get("/ml/info")
def ml_info():
    if not ml_service.is_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model not available",
        )
    return ml_service.info()


@app.post("/ml/predict")
def ml_predict(body: PredictIn):
    if not ml_service.is_loaded():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model not available",
        )
    try:
        data = body.model_dump() if hasattr(body, "model_dump") else body.dict()
        return ml_service.predict(data)
    except ml_service.MLValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
