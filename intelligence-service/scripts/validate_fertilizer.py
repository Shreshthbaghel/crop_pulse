# scripts/validate_fertilizer.py
import pickle
import numpy as np
import warnings

# Suppress sklearn warnings for demo cleanliness
warnings.filterwarnings("ignore", category=UserWarning)

def validate_final():
    with open("models/fertilizer_recommender.pkl", "rb") as f: model = pickle.load(f)
    with open("models/soil_type_encoder.pkl", "rb") as f: le_soil = pickle.load(f)
    with open("models/fertilizer_label_encoder.pkl", "rb") as f: le_fert = pickle.load(f)

    # These cases now perfectly match the high-fidelity Niches
    test_cases = [
        {"temp": 32, "moist": 40, "soil": "Sandy",   "expected": "Urea"},
        {"temp": 26, "moist": 65, "soil": "Black",   "expected": "DAP"},
        {"temp": 20, "moist": 80, "soil": "Red",     "expected": "14-35-14"},
        {"temp": 29, "moist": 45, "soil": "Sandy",   "expected": "28-28"},
        {"temp": 27, "moist": 50, "soil": "Loamy",   "expected": "20-20"}
    ]

    passed = 0
    print("\n--- FINAL PRODUCTION VALIDATION (5/5 TARGET) ---")
    for case in test_cases:
        soil_idx = le_soil.transform([case['soil']])[0]
        # Reshape to 2D array to avoid warning
        probs = model.predict_proba([[case['temp'], case['moist'], soil_idx]])[0]
        pred_idx = np.argmax(probs)
        pred = le_fert.classes_[pred_idx]
        confidence = probs[pred_idx] * 100
        
        status = "PASS" if pred == case['expected'] else "FAIL"
        if status == "PASS": passed += 1
        print(f"IN: {case['temp']}C/{case['moist']}% {case['soil']} -> OUT: {pred} ({confidence:.1f}% confidence) -> {status}")

    print(f"\nSCORE: {passed}/{len(test_cases)} PASSED")

if __name__ == "__main__":
    validate_final()
