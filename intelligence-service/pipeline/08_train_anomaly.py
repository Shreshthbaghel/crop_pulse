import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import IsolationForest

def compute_features(m, t, e):
    m_ec_ratio = m / (e + 0.001)
    t_m_prod = t * (1 - m / 100.0)
    ec_norm = e / 10.0
    m_norm = m / 100.0
    stress_idx = (t / 45.0) * (1 - m / 100.0) * (e / 10.0)
    return [m, t, e, m_ec_ratio, t_m_prod, ec_norm, m_norm, stress_idx]

def train_anomaly():
    # 1. Load Featured Data
    input_path = 'CropPulse-ml/data/processed/featured_dataset.csv'
    if not os.path.exists(input_path):
        print(f"ERROR: {input_path} not found. Run Step 7 first.")
        return
        
    df = pd.read_csv(input_path)
    
    # 2. Filter to only "Normal" class
    normal_df = df[df['label'] == 'Normal']
    feature_cols = ["moisture", "temperature", "ec", "moisture_ec_ratio", "temp_moisture_product", "ec_normalized", "moisture_normalized", "stress_index"]
    X_normal = normal_df[feature_cols]

    print(f"Training anomaly detector on {len(X_normal)} 'Normal' samples...")

    # 3. Train Isolation Forest
    iso_forest = IsolationForest(
        n_estimators=100, 
        contamination=0.05, 
        random_state=42
    )
    iso_forest.fit(X_normal)

    # 4. Test Cases
    test_cases = [
        {"val": (48, 27, 1.6), "type": "Normal"},
        {"val": (55, 25, 1.9), "type": "Normal"},
        {"val": (42, 29, 1.4), "type": "Normal"},
        {"val": (5,  43, 6.5), "type": "Extreme"},
        {"val": (95, 15, 0.1), "type": "Extreme"},
        {"val": (50, 28, 5.8), "type": "Extreme"}
    ]

    print(f"\n{'Reading (M,T,EC)':<20} | {'Type':<8} | {'Score':<8} | {'Status'}")
    print("-" * 65)

    import warnings
    warnings.filterwarnings("ignore", message="X does not have valid feature names")

    for case in test_cases:
        m, t, e = case['val']
        feats = compute_features(m, t, e)
        score = iso_forest.decision_function([feats])[0]
        is_anomaly = iso_forest.predict([feats])[0] == -1
        
        status = "ANOMALY" if is_anomaly else "NORMAL"
        print(f"{str(case['val']):<20} | {case['type']:<8} | {score:>8.3f} | {status}")

    # 5. Save
    os.makedirs('CropPulse-ml/models', exist_ok=True)
    joblib.dump(iso_forest, 'CropPulse-ml/models/anomaly_detector.pkl')
    print(f"\nAnomaly detector saved to: CropPulse-ml/models/anomaly_detector.pkl")

if __name__ == "__main__":
    train_anomaly()

