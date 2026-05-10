import pandas as pd
import numpy as np
import joblib
import os

def compute_features(m, t, e):
    # Formulas must match Step 7 exactly
    m_ec_ratio = m / (e + 0.001)
    t_m_prod = t * (1 - m / 100.0)
    ec_norm = e / 10.0
    m_norm = m / 100.0
    stress_idx = (t / 45.0) * (1 - m / 100.0) * (e / 10.0)
    
    return [m, t, e, m_ec_ratio, t_m_prod, ec_norm, m_norm, stress_idx]

def validate_model():
    # 1. Load Model and Encoder
    model_path = 'CropPulse-ml/models/soil_classifier.pkl'
    le_path = 'CropPulse-ml/models/label_encoder.pkl'
    
    if not os.path.exists(model_path) or not os.path.exists(le_path):
        print("ERROR: Model or Label Encoder not found. Run Step 8 first.")
        return

    rf = joblib.load(model_path)
    le = joblib.load(le_path)

    # 2. Define Validation Cases (using your specific problem samples)
    cases = [
        {"m": 84, "t": 27.5, "e": 62, "expected": "Nutrient Imbalance", "name": "Sample 1 (Low TDS)"},
        {"m": 100, "t": 29, "e": 454, "expected": "Nutrient Imbalance", "name": "Sample 2 (High Moisture/Low TDS)"},
        {"m": 50, "t": 26, "e": 1000, "expected": "Normal", "name": "Standard Normal Case"}
    ]

    print(f"{'Case':<10} | {'Predicted':<20} | {'Confidence':<10} | {'Status'}")
    print("-" * 65)

    passed = 0
    for i, case in enumerate(cases, 1):
        # 3. Compute Features
        features = compute_features(case['m'], case['t'], case['e'])
        features_array = np.array(features).reshape(1, -1)
        
        # 4. Predict
        pred_idx = rf.predict(features_array)[0]
        pred_label = le.inverse_transform([pred_idx])[0]
        probs = rf.predict_proba(features_array)[0]
        confidence = probs[pred_idx] * 100
        
        match = pred_label == case['expected']
        if match: passed += 1
        status = "PASS" if match else "FAIL"
        
        print(f"Case {i:<5} | {pred_label:<20} | {confidence:>8.1f}% | {status}")

    print("-" * 65)
    print(f"OVERALL: {passed}/{len(cases)} cases passed.")

if __name__ == "__main__":
    validate_model()

