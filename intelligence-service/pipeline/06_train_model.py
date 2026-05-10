import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

def train_model():
    # 1. Load the featured dataset
    input_path = 'CropPulse-ml/data/processed/featured_dataset.csv'
    if not os.path.exists(input_path):
        print(f"ERROR: {input_path} not found. Run Step 7 first.")
        return
        
    df = pd.read_csv(input_path)
    
    # 2. Split into Features (X) and Label (y)
    feature_cols = [
        "moisture", "temperature", "ec", 
        "moisture_ec_ratio", "temp_moisture_product", 
        "ec_normalized", "moisture_normalized", "stress_index"
    ]
    X = df[feature_cols]
    y = df['label']

    # 3. Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    # 4. Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.20, stratify=y_encoded, random_state=42
    )

    # 5. Train Random Forest Classifier
    rf = RandomForestClassifier(
        n_estimators=200, 
        max_depth=20, 
        min_samples_split=4, 
        min_samples_leaf=2, 
        class_weight='balanced', 
        random_state=42, 
        n_jobs=-1
    )
    
    print("Training Random Forest model...")
    rf.fit(X_train, y_train)

    # 6. Evaluate
    y_pred = rf.predict(X_test)
    y_train_pred = rf.predict(X_train)
    
    train_acc = accuracy_score(y_train, y_train_pred)
    test_acc = accuracy_score(y_test, y_pred)
    
    print(f"\nTraining Accuracy: {train_acc:.4f}")
    print(f"Test Accuracy: {test_acc:.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    # 7. Feature Importances
    importances = pd.Series(rf.feature_importances_, index=feature_cols)
    print("\nTop 5 Feature Importances:")
    print(importances.sort_values(ascending=False).head(5))

    # 8. Save Model and Encoder
    os.makedirs('CropPulse-ml/models', exist_ok=True)
    joblib.dump(rf, 'CropPulse-ml/models/soil_classifier.pkl')
    joblib.dump(le, 'CropPulse-ml/models/label_encoder.pkl')
    
    print(f"\nModel saved to: CropPulse-ml/models/soil_classifier.pkl")
    print(f"Label encoder saved to: CropPulse-ml/models/label_encoder.pkl")

if __name__ == "__main__":
    train_model()

