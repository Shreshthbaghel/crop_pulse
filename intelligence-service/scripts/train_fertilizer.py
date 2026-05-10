# scripts/train_fertilizer.py
import pandas as pd
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix

# --- CONFIGURATION ---
INPUT_PATH = "data/processed/fertilizer_encoded.csv"
FERT_ENCODER_PATH = "models/fertilizer_label_encoder.pkl"
MODEL_OUTPUT_PATH = "models/fertilizer_recommender.pkl"

def train_model():
    if not os.path.exists(INPUT_PATH):
        print(f"ERROR: Encoded data not found at {INPUT_PATH}")
        return

    # 1. Load Data
    df = pd.read_csv(INPUT_PATH)
    
    # 2. Features (X) and Target (y)
    X = df[['temperature', 'moisture', 'soil_type_encoded']]
    y = df['fertilizer_encoded']

    # 3. Stratified Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )

    # 4. Train RandomForest with Pruning (to prevent overfitting)
    clf = RandomForestClassifier(
        n_estimators=300,
        max_depth=8,         # Pruned depth
        min_samples_split=10,
        min_samples_leaf=5,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train, y_train)

    # 5. Evaluate
    train_acc = clf.score(X_train, y_train)
    test_acc = clf.score(X_test, y_test)

    print(f"\nTraining Accuracy: {train_acc*100:.2f}%")
    print(f"Test Accuracy: {test_acc*100:.2f}%")

    # 6. Detailed Report (using original names)
    with open(FERT_ENCODER_PATH, "rb") as f:
        le_fert = pickle.load(f)
    
    y_pred = clf.predict(X_test)
    print("\n--- CLASSIFICATION REPORT ---")
    print(classification_report(y_test, y_pred, target_names=le_fert.classes_))

    # 7. Feature Importance
    print("\n--- FEATURE IMPORTANCES ---")
    features = ['temperature', 'moisture', 'soil_type_encoded']
    importances = clf.feature_importances_
    for name, imp in zip(features, importances):
        print(f"{name}: {imp:.4f}")

    # 8. Save Model
    with open(MODEL_OUTPUT_PATH, "wb") as f:
        pickle.dump(clf, f)
    print(f"\nSUCCESS: Model saved to {MODEL_OUTPUT_PATH}")

if __name__ == "__main__":
    train_model()
