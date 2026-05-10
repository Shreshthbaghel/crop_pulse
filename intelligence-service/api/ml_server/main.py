"""
CropPulse FastAPI ML Server
===========================
End-to-End Agriculture Intelligence with Optimized Inference.
Endpoints:
  POST /predict/classify  — 6-class soil stress + anomaly score (Optimized)
  POST /predict/forecast  — moisture forecast at T+1h, T+2h, T+4h
  POST /predict/fertilizer— optimized recommendations
  GET  /model/info        — model metadata & calibrated accuracy
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from models import SoilClassifier, AnomalyDetector, MoistureForecaster, FertilizerRecommender, CLASS_NAMES, FEATURE_NAMES

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="CropPulse Intelligence Server",
    description="Optimized soil stress classification and agricultural forecasting",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Inference-Time Initialization
# ---------------------------------------------------------------------------
print("[Boot] Initializing Optimized ML Models...")
classifier = SoilClassifier()
anomaly_detector = AnomalyDetector()
forecaster = MoistureForecaster()

# Train/Load models
classifier.train()
anomaly_detector.train()

fertilizer_recommender = FertilizerRecommender()
fertilizer_recommender.load()

print("[Boot] Inference Pipeline Calibrated & Ready.\n")


# ---------------------------------------------------------------------------
# Pydantic schemas (Input Preprocessing & Validation)
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


class FertilizerRequest(BaseModel):
    temperature: float = Field(..., description="Soil temperature °C")
    moisture: float = Field(..., ge=0, le=100, description="Soil moisture %")
    soil_type: str = Field(..., description="Soil type category")


# ---------------------------------------------------------------------------
# Output Post-Processing Layer (Optimizations)
# ---------------------------------------------------------------------------
def apply_rule_based_filters(features: Dict[str, Any], predicted_class_name: str) -> str:
    """
    Validation layer to catch known model failure patterns (hallucinations/out-of-context predictions).
    """
    moisture = features.get('moisture', 0)
    
    # Rule 1: Drought check
    if moisture > 40 and predicted_class_name == "Water Deficiency":
        return "Normal" # Conflict: High moisture cannot be drought
        
    # Rule 2: Heat Stress check
    if features.get('temperature', 0) < 30 and predicted_class_name == "Heat Stress":
        return "Normal"
        
    # Rule 3: Moisture capping
    if moisture < 5 and predicted_class_name == "Normal":
        return "Water Deficiency"
        
    return predicted_class_name


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/", include_in_schema=False)
def root():
    return {"status": "ok", "service": "CropPulse Intelligence Server v1.1.0"}


@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": True, "optimized": True}


@app.post("/predict/classify")
def classify(req: ClassifyRequest) -> Dict[str, Any]:
    """
    Classify soil condition with Inference-Time Optimization:
    - Rule-based filtering
    - Confidence thresholding
    - Input normalization
    """
    mrm = req.moisture_rolling_mean_6h if req.moisture_rolling_mean_6h is not None else req.moisture
    erm = req.ec_rolling_mean_6h if req.ec_rolling_mean_6h is not None else req.ec

    features_list = [
        req.moisture, req.temperature, req.ec,
        req.moisture_rate_of_change, req.ec_rate_of_change, req.temp_rate_of_change,
        mrm, erm, req.hour_of_day
    ]
    
    feature_map = dict(zip(FEATURE_NAMES, [round(f, 3) for f in features_list]))

    try:
        predicted_class, probabilities = classifier.predict(features_list)
        anomaly_score = anomaly_detector.score([req.moisture, req.temperature, req.ec])
        
        # Confidence thresholding (Inference Optimization)
        raw_confidence = max(probabilities)
        is_low_confidence = raw_confidence < 0.4
        
        # Initial Class
        predicted_class_name = CLASS_NAMES[predicted_class]
        
        # Output Validation Layer (Rule-based Filtering)
        final_class_name = apply_rule_based_filters(feature_map, predicted_class_name)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {e}")

    return {
        "class": predicted_class,
        "className": final_class_name,
        "raw_prediction": predicted_class_name,
        "confidence": round(raw_confidence, 4),
        "is_low_confidence": is_low_confidence,
        "probabilities": {CLASS_NAMES[i]: round(p, 4) for i, p in enumerate(probabilities)},
        "anomalyScore": round(anomaly_score, 4),
        "isAnomaly": anomaly_score < -0.1,
        "optimizations": ["RuleBasedFiltering", "ConfidenceThresholding"],
        "features_used": feature_map,
    }


@app.post("/predict/forecast")
def forecast(req: ForecastRequest) -> Dict[str, Any]:
    history = [{"moisture": p.moisture, "timestamp_ms": p.timestamp_ms} for p in req.reading_history]
    try:
        result = forecaster.predict(history)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {e}")
    return result


@app.post("/predict/fertilizer")
def predict_fertilizer(req: FertilizerRequest) -> Dict[str, Any]:
    try:
        result = fertilizer_recommender.predict(
            temperature=req.temperature,
            moisture=req.moisture,
            ec=0.0,
            soil_type=req.soil_type
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fertilizer prediction error: {e}")


@app.get("/model/info")
def model_info() -> Dict[str, Any]:
    return {
        "brand": "CropPulse",
        "version": "1.1.0",
        "optimizations_enabled": True,
        "classifier": {
            "algorithm": "RandomForestClassifier",
            "n_estimators": 100,
            "training_accuracy": round(classifier.training_accuracy, 4),
            "feature_importances": classifier.feature_importances(),
        },
        "forecaster": {
            "algorithm": "LinearRegression",
            "targets": ["T+1h", "T+2h", "T+4h"],
        }
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
