"""
CropPulse ML Models
===================
Optimized for real-time agricultural telemetry.
Model 1: SoilStressClassifier  - 6-class RandomForest (9 features)
Model 2: AnomalyDetector        - IsolationForest trained on Normal data
Model 3: MoistureForecaster     - LinearRegression sliding-window predictor
Model 4: FertilizerRecommender  - Pre-trained RF for specific soil profiles
"""

import random
import numpy as np
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
import pickle
import os
from typing import List, Dict, Any, Optional, Tuple

np.random.seed(42)
random.seed(42)

CLASS_NAMES = [
    "Normal",
    "Water Deficiency",
    "Salinity Stress",
    "Over-Fertilization",
    "Nutrient Imbalance",
    "Heat Stress",
]

FEATURE_NAMES = [
    "moisture",
    "temperature",
    "ec",
    "moisture_rate_of_change",
    "ec_rate_of_change",
    "temp_rate_of_change",
    "moisture_rolling_mean_6h",
    "ec_rolling_mean_6h",
    "hour_of_day",
]

MOISTURE_CRITICAL_THRESHOLD = 25.0


def _rnd(lo: float, hi: float) -> float:
    return random.uniform(lo, hi)


def _rnd_i(lo: int, hi: int) -> int:
    return random.randint(lo, hi)


def generate_training_data() -> Tuple[List[List[float]], List[int]]:
    """Synthesize domain-knowledge-labelled training rows."""
    X: List[List[float]] = []
    y: List[int] = []

    def add(n: int, label: int, m_lo, m_hi, t_lo, t_hi,
            ec_lo, ec_hi, mrc_lo, mrc_hi, erc_lo, erc_hi,
            trc_lo, trc_hi, h_lo=0, h_hi=23):
        for _ in range(n):
            m   = _rnd(m_lo, m_hi)
            t   = _rnd(t_lo, t_hi)
            ec  = _rnd(ec_lo, ec_hi)
            mrc = _rnd(mrc_lo, mrc_hi)
            erc = _rnd(erc_lo, erc_hi)
            trc = _rnd(trc_lo, trc_hi)
            mrm = max(0, m + _rnd(-4, 4))
            erm = max(0, ec + _rnd(-0.15, 0.15))
            hr  = _rnd_i(h_lo, h_hi)
            X.append([m, t, ec, mrc, erc, trc, mrm, erm, hr])
            y.append(label)

    add(150, 0, 40, 70, 20, 34, 1.0, 3.2, -0.4, 0.4, -0.08, 0.08, -0.2, 0.2)
    add(100, 1, 5, 25,  26, 42, 0.5, 2.5, -2.0, -0.3, -0.1, 0.15, 0.3, 1.5)
    add(100, 2, 20, 70, 20, 35, 4.5, 9.0, -0.5, 0.5,  0.1, 0.6,  -0.3, 0.3)
    add(100, 3, 40, 80, 18, 30, 3.2, 4.5, -0.2, 0.8,  0.1, 0.7,  -0.2, 0.2)
    add(200, 4, 30, 95, 18, 35, 0.05, 1.0, -0.3, 0.3, -0.06, 0.06, -0.15, 0.15)
    add(100, 5, 15, 55, 38, 55, 0.5, 3.0, -1.8, -0.2, -0.1, 0.3,  0.8, 2.5, 10, 18)

    return X, y


# ---------------------------------------------------------------------------
# Model 1 — Soil Stress Classifier (Random Forest)
# ---------------------------------------------------------------------------

class SoilClassifier:
    def __init__(self):
        self._model: Optional[RandomForestClassifier] = None
        self.training_accuracy: float = 0.0
        self._importances: List[float] = [0.0] * 9

    def train(self) -> None:
        X, y = generate_training_data()
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        self._model = RandomForestClassifier(
            n_estimators=100,
            max_features="sqrt",
            max_depth=12,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
            class_weight='balanced' # Improved calibration for imbalanced data
        )
        self._model.fit(X_train, y_train)
        self.training_accuracy = float(self._model.score(X_test, y_test))
        self._importances = self._model.feature_importances_.tolist()
        print(f"[CropPulse Classifier] Calibrated. Test accuracy: {self.training_accuracy:.2%}")

    def predict(self, features: List[float]) -> Tuple[int, List[float]]:
        if self._model is None:
            raise RuntimeError("Model not trained yet")
        arr = np.array(features).reshape(1, -1)
        predicted_class = int(self._model.predict(arr)[0])
        probabilities = self._model.predict_proba(arr)[0].tolist()
        return predicted_class, probabilities

    def feature_importances(self) -> Dict[str, float]:
        return {name: round(imp, 4) for name, imp in zip(FEATURE_NAMES, self._importances)}


# ---------------------------------------------------------------------------
# Model 2 — Anomaly Detector (Isolation Forest)
# ---------------------------------------------------------------------------

class AnomalyDetector:
    def __init__(self):
        self._model: Optional[IsolationForest] = None

    def train(self) -> None:
        X, y = generate_training_data()
        normal_X = [x[:3] for x, label in zip(X, y) if label == 0]
        self._model = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42,
        )
        self._model.fit(normal_X)
        print("[CropPulse AnomalyDetector] Online.")

    def score(self, features_3: List[float]) -> float:
        if self._model is None:
            raise RuntimeError("Anomaly detector not trained")
        arr = np.array(features_3[:3]).reshape(1, -1)
        raw = float(self._model.decision_function(arr)[0])
        return max(-1.0, min(1.0, raw))


# ---------------------------------------------------------------------------
# Model 3 — Moisture Forecaster (Linear Regression)
# ---------------------------------------------------------------------------

class MoistureForecaster:
    def predict(self, history: List[Dict[str, Any]]) -> Dict[str, Any]:
        if len(history) < 3:
            return {
                "t1h": None, "t2h": None, "t4h": None,
                "timeToThresholdMinutes": None,
                "message": "Insufficient data window",
            }

        recent = history[-20:]
        t0 = recent[0]["timestamp_ms"]

        X = np.array([(r["timestamp_ms"] - t0) / 60_000 for r in recent]).reshape(-1, 1)
        ys = np.array([r["moisture"] for r in recent])

        model = LinearRegression()
        model.fit(X, ys)

        now_ms = recent[-1]["timestamp_ms"]
        now_min = (now_ms - t0) / 60_000

        def predict_at(delta_min: float) -> float:
            val = float(model.predict([[now_min + delta_min]])[0])
            return round(max(0, min(100, val)), 1)

        t1h = predict_at(60)
        t2h = predict_at(120)
        t4h = predict_at(240)

        slope = float(model.coef_[0])
        intercept = float(model.intercept_)
        current_moisture = ys[-1]

        time_to_threshold: Optional[float] = None
        if slope < -0.005 and current_moisture > MOISTURE_CRITICAL_THRESHOLD:
            time_at_threshold = (MOISTURE_CRITICAL_THRESHOLD - intercept) / slope
            delta = time_at_threshold - now_min
            if 0 < delta < 1440:
                time_to_threshold = round(delta)

        return {
            "t1h": t1h, "t2h": t2h, "t4h": t4h,
            "timeToThresholdMinutes": time_to_threshold,
            "slope": round(slope, 4),
            "method": "LinearExtrapolation",
        }

# ---------------------------------------------------------------------------
# Model 4 — Fertilizer Recommender (Ensemble)
# ---------------------------------------------------------------------------

class FertilizerRecommender:
    def __init__(self, model_dir: str = "../../models"):
        self.model_dir = model_dir
        self._model = None
        self._le_soil = None
        self._le_fert = None
        self.is_loaded = False

    def load(self) -> bool:
        try:
            base_path = os.path.dirname(__file__)
            model_path = os.path.join(base_path, self.model_dir, "fertilizer_recommender.pkl")
            soil_enc_path = os.path.join(base_path, self.model_dir, "soil_type_encoder.pkl")
            fert_enc_path = os.path.join(base_path, self.model_dir, "fertilizer_label_encoder.pkl")

            with open(model_path, "rb") as f: self._model = pickle.load(f)
            with open(soil_enc_path, "rb") as f: self._le_soil = pickle.load(f)
            with open(fert_enc_path, "rb") as f: self._le_fert = pickle.load(f)
            
            self.is_loaded = True
            print("[CropPulse Recommender] Models loaded.")
            return True
        except: return False

    def predict(self, temperature: float, moisture: float, ec: float, soil_type: str) -> Dict[str, Any]:
        if not self.is_loaded: raise RuntimeError("Model not loaded")

        soil_type_norm = soil_type.strip().title()
        if soil_type_norm not in self._le_soil.classes_:
            raise ValueError(f"Invalid soil: {soil_type_norm}")

        soil_idx = self._le_soil.transform([soil_type_norm])[0]
        X_input = np.array([[temperature, moisture, soil_idx]])

        # Confidence Calibration via Probability Voting
        probs = self._model.predict_proba(X_input)[0]
        top_indices = np.argsort(probs)[-3:][::-1]
        
        return {
            "fertilizer_recommendation": self._le_fert.classes_[top_indices[0]],
            "confidence": round(float(probs[top_indices[0]]) * 100, 2),
            "top_3": [{"fertilizer": self._le_fert.classes_[idx], "probability": round(float(probs[idx]) * 100, 2)} for idx in top_indices]
        }
