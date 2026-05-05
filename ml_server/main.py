"""
TerraSense FastAPI ML Server
============================
Endpoints:
  POST /predict/classify  — 6-class soil stress + anomaly score
  POST /predict/forecast  — moisture forecast at T+1h, T+2h, T+4h
  GET  /model/info        — model metadata & feature importances
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from models import SoilClassifier, AnomalyDetector, MoistureForecaster, CLASS_NAMES, FEATURE_NAMES

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="TerraSense ML Server",
    description="Soil stress classification, anomaly detection and moisture forecasting",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Boot: train all models once at startup
# ---------------------------------------------------------------------------
print("[Boot] Training ML models...")
classifier = SoilClassifier()
anomaly_detector = AnomalyDetector()
forecaster = MoistureForecaster()

classifier.train()
anomaly_detector.train()
print("[Boot] All models ready.\n")


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class ClassifyRequest(BaseModel):
    moisture: float = Field(..., ge=0, le=100, description="Soil moisture %")
    temperature: float = Field(..., ge=-20, le=80, description="Soil temperature °C")
    ec: float = Field(..., ge=0, le=20, description="Electrical conductivity dS/m")
    moisture_rate_of_change: float = Field(0.0, description="Change from previous reading")
    ec_rate_of_change: float = Field(0.0)
    temp_rate_of_change: float = Field(0.0)
    moisture_rolling_mean_6h: Optional[float] = Field(None)
    ec_rolling_mean_6h: Optional[float] = Field(None)
    hour_of_day: int = Field(12, ge=0, le=23)


class HistoryPoint(BaseModel):
    moisture: float
    timestamp_ms: float


class ForecastRequest(BaseModel):
    reading_history: List[HistoryPoint] = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/", include_in_schema=False)
def root():
    return {"status": "ok", "service": "TerraSense ML Server v1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": True}


@app.post("/predict/classify")
def classify(req: ClassifyRequest) -> Dict[str, Any]:
    """
    Classify current soil condition into one of 6 stress classes,
    and compute an anomaly score via Isolation Forest.
    """
    # Fill optional rolling means with current values if not supplied
    mrm = req.moisture_rolling_mean_6h if req.moisture_rolling_mean_6h is not None else req.moisture
    erm = req.ec_rolling_mean_6h if req.ec_rolling_mean_6h is not None else req.ec

    features = [
        req.moisture,
        req.temperature,
        req.ec,
        req.moisture_rate_of_change,
        req.ec_rate_of_change,
        req.temp_rate_of_change,
        mrm,
        erm,
        req.hour_of_day,
    ]

    try:
        predicted_class, probabilities = classifier.predict(features)
        anomaly_score = anomaly_detector.score([req.moisture, req.temperature, req.ec])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")

    return {
        "class": predicted_class,
        "className": CLASS_NAMES[predicted_class],
        "confidence": round(max(probabilities), 4),
        "probabilities": {CLASS_NAMES[i]: round(p, 4) for i, p in enumerate(probabilities)},
        "anomalyScore": round(anomaly_score, 4),
        "isAnomaly": anomaly_score < -0.1,
        "features_used": dict(zip(FEATURE_NAMES, [round(f, 3) for f in features])),
    }


@app.post("/predict/forecast")
def forecast(req: ForecastRequest) -> Dict[str, Any]:
    """
    Predict soil moisture at T+1h, T+2h, T+4h using linear regression
    on the supplied reading history.
    """
    history = [{"moisture": p.moisture, "timestamp_ms": p.timestamp_ms} for p in req.reading_history]
    try:
        result = forecaster.predict(history)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {e}")
    return result


@app.get("/model/info")
def model_info() -> Dict[str, Any]:
    """Return model metadata, training accuracy, and feature importances."""
    return {
        "version": "1.0.0",
        "classifier": {
            "algorithm": "RandomForestClassifier",
            "n_estimators": 100,
            "n_classes": 6,
            "class_names": CLASS_NAMES,
            "n_features": 9,
            "feature_names": FEATURE_NAMES,
            "training_accuracy": round(classifier.training_accuracy, 4),
            "feature_importances": classifier.feature_importances(),
        },
        "anomaly_detector": {
            "algorithm": "IsolationForest",
            "trained_on": "Normal class only",
            "contamination": 0.1,
            "threshold": -0.1,
        },
        "forecaster": {
            "algorithm": "LinearRegression",
            "window_size": 20,
            "targets": ["T+1h", "T+2h", "T+4h"],
            "moisture_critical_threshold_pct": 25,
        },
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
