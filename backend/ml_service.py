import json
from pathlib import Path
from typing import Any, Dict

import joblib
import pandas as pd

MODEL_DIR = Path(__file__).resolve().parent / "models"
_state: Dict[str, Any] = {
    "loaded": False,
    "error": None,
    "meta": None,
    "reg": None,
    "iso": None,
}


class MLValidationError(ValueError):
    """Raised when prediction input has missing or extra keys (422 Unprocessable Entity)."""
    status_code: int = 422


def load_models():
    """Load models once at startup (lifespan). The app must still run if files are missing."""
    try:
        features_path = MODEL_DIR / "features.json"
        reg_path = MODEL_DIR / "model_regression.joblib"
        anomaly_path = MODEL_DIR / "model_anomaly.joblib"

        if not features_path.exists():
            raise FileNotFoundError(f"Missing model metadata file: {features_path.name}")
        if not reg_path.exists():
            raise FileNotFoundError(f"Missing regression model file: {reg_path.name}")
        if not anomaly_path.exists():
            raise FileNotFoundError(f"Missing anomaly model file: {anomaly_path.name}")

        meta = json.loads(features_path.read_text(encoding="utf-8"))
        reg = joblib.load(reg_path)
        iso = joblib.load(anomaly_path)

        _state.update(
            meta=meta,
            reg=reg,
            iso=iso,
            loaded=True,
            error=None,
        )
    except Exception as e:
        _state.update(
            meta=None,
            reg=None,
            iso=None,
            loaded=False,
            error=str(e),
        )


def is_loaded() -> bool:
    return bool(_state.get("loaded", False))


def load_error():
    return _state.get("error")


def info() -> dict:
    if not is_loaded():
        return {}
    meta = _state.get("meta") or {}
    return {
        "model": meta.get("best_model"),
        "features": meta.get("features"),
        "target": meta.get("target"),
        "metrics": meta.get("metrics"),
        "cv_time_split_5": meta.get("cv_time_split_5"),
        "versions": meta.get("versions"),
        "note": meta.get("note"),
    }


def predict(values: dict) -> dict:
    if not is_loaded():
        raise RuntimeError("ML model not available")

    meta = _state["meta"]
    features = meta.get("features", [])

    # Validate missing and extra keys
    input_keys = set(values.keys())
    expected_set = set(features)

    missing = [f for f in features if f not in input_keys]
    extra = [k for k in input_keys if k not in expected_set]

    if missing or extra:
        errors = []
        if missing:
            errors.append(f"Missing required feature(s): {missing}")
        if extra:
            errors.append(f"Extra/unexpected feature(s): {extra}")
        raise MLValidationError(f"Unprocessable Entity (422): {'; '.join(errors)}")

    # Build DataFrame with columns in the exact order of features.json
    row_data = {col: [values[col]] for col in features}
    X = pd.DataFrame(row_data, columns=features)

    anomaly_features = meta.get("anomaly_features", features)
    A = X[anomaly_features]

    estimate = float(_state["reg"].predict(X)[0])
    unusual = int(_state["iso"].predict(A)[0]) == -1

    return {
        "sludge_kg_per_m3_estimate": round(estimate, 5),
        "unusual_inputs": unusual,
        "model": meta.get("best_model"),
        "note": meta.get("note"),
    }
