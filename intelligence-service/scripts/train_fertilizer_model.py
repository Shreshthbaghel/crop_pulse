import pandas as pd
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

# --- CONFIGURATION ---
INPUT_PATH = "data/processed/fertilizer_encoded.csv"
MODEL_PATH = "models/fertilizer_recommender.pkl"
FERT_ENCODER_PATH = "models/fertilizer_label_encoder.pkl"
# ---------------------

def train_model():
    df = pd.read_csv(INPUT_PATH)
    X = df[['temperature', 'moisture', 'ec', 'soil_type_encoded']]
    y = df['fertilizer_encoded']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    model = RandomForestClassifier(
        n_estimators=200, max_depth=15, class_weight='balanced', random_state=42, n_jobs=-1
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    
    with open(FERT_ENCODER_PATH, 'rb') as f:
        le_fert = pickle.load(f)

    print("--- MODEL EVALUATION (WITH EC) ---")
    print(f"Test accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print("\n--- CLASSIFICATION REPORT ---")
    print(classification_report(y_test, y_pred, target_names=le_fert.classes_))

    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    print(f"SUCCESS: Model saved.")

if __name__ == "__main__":
    train_model()
