"""
TerraSense ML Models
====================
Model 1: SoilStressClassifier  - 6-class RandomForest (9 features)
Model 2: AnomalyDetector        - IsolationForest trained on Normal data
Model 3: MoistureForecaster     - LinearRegression sliding-window predictor
"""

import random
import numpy as np
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
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

MOISTURE_CRITICAL_THRESHOLD = 25.0  # % - used for time-to-threshold


def _rnd(lo: float, hi: float) -> float:
    return random.uniform(lo, hi)


def _rnd_i(lo: int, hi: int) -> int:
    return random.randint(lo, hi)


def generate_training_data() -> Tuple[List[List[float]], List[int]]:
    """
    Synthesise domain-knowledge-labelled training rows.
    Each row: [m, t, ec, mrc, erc, trc, mrm, erm, hour]
    """
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

    # Class 0 – Normal
    add(80, 0, 35, 65, 18, 30, 0.8, 2.0, -0.4, 0.4, -0.08, 0.08, -0.2, 0.2)

    # Class 1 – Water Deficiency (low moisture, rising temp, mrc negative)
    add(60, 1, 5, 19,  26, 42, 0.5, 2.5, -2.0, -0.3, -0.1, 0.15, 0.3, 1.5)

    # Class 2 – Salinity Stress (EC > 4)
    add(60, 2, 20, 70, 20, 35, 4.1, 9.0, -0.5, 0.5,  0.1, 0.6,  -0.3, 0.3)

    # Class 3 – Over-Fertilization (EC 2.5-4, moisture high)
    add(55, 3, 40, 80, 18, 30, 2.6, 4.0, -0.2, 0.8,  0.1, 0.7,  -0.2, 0.2)

    # Class 4 – Nutrient Imbalance (EC very low)
    add(55, 4, 30, 60, 18, 28, 0.05, 0.49, -0.3, 0.3, -0.06, 0.06, -0.15, 0.15)

    # Class 5 – Heat Stress (temp > 38, moisture falling)
    add(55, 5, 15, 55, 38, 55, 0.5, 3.0, -1.8, -0.2, -0.1, 0.3,  0.8, 2.5, 10, 18)

    return X, y


# ---------------------------------------------------------------------------
# Model 1 — Soil Stress Classifier
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
        )
        self._model.fit(X_train, y_train)
        self.training_accuracy = float(self._model.score(X_test, y_test))
        self._importances = self._model.feature_importances_.tolist()
        print(f"[Classifier] Trained. Test accuracy: {self.training_accuracy:.2%}")

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
    """
    Trained exclusively on Normal soil readings (class 0).
    Returns a score: higher = more normal, lower (negative) = anomalous.
    Threshold: score < -0.1 → flag as anomaly.
    """

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
        print("[AnomalyDetector] Trained on Normal class data.")

    def score(self, features_3: List[float]) -> float:
        """features_3 = [moisture, temperature, ec]"""
        if self._model is None:
            raise RuntimeError("Anomaly detector not trained")
        arr = np.array(features_3[:3]).reshape(1, -1)
        raw = float(self._model.decision_function(arr)[0])
        # Normalise to [-1, 1] range for display purposes
        return max(-1.0, min(1.0, raw))


# ---------------------------------------------------------------------------
# Model 3 — Moisture Forecaster (Linear Regression)
# ---------------------------------------------------------------------------

class MoistureForecaster:
    """
    Simple linear regression on a sliding window of historical readings.
    Predicts moisture at T+1h, T+2h, T+4h.
    """

    def predict(self, history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        history: list of dicts with keys 'moisture' and 'timestamp_ms'
        """
        if len(history) < 3:
            return {
                "t1h": None, "t2h": None, "t4h": None,
                "timeToThresholdMinutes": None,
                "message": "Need at least 3 readings for forecasting",
            }

        # Use last 20 readings
        recent = history[-20:]
        t0 = recent[0]["timestamp_ms"]

        # X = elapsed minutes, y = moisture
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

        # Time until moisture hits critical threshold (25%)
        slope = float(model.coef_[0])
        intercept = float(model.intercept_)
        current_moisture = ys[-1]

        time_to_threshold: Optional[float] = None
        if slope < -0.005 and current_moisture > MOISTURE_CRITICAL_THRESHOLD:
            # threshold = slope * time + intercept  =>  time = (threshold - intercept) / slope
            time_at_threshold = (MOISTURE_CRITICAL_THRESHOLD - intercept) / slope
            delta = time_at_threshold - now_min
            if 0 < delta < 1440:  # within 24 hours
                time_to_threshold = round(delta)

        return {
            "t1h": t1h,
            "t2h": t2h,
            "t4h": t4h,
            "timeToThresholdMinutes": time_to_threshold,
            "slope": round(slope, 4),
            "message": "Forecast computed via linear regression",
        }
