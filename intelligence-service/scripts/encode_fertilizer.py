# scripts/encode_fertilizer.py
import pandas as pd
import pickle
import os
from sklearn.preprocessing import LabelEncoder

# --- CONFIGURATION ---
INPUT_PATH = "data/processed/fertilizer_augmented.csv"
OUTPUT_DATA_PATH = "data/processed/fertilizer_encoded.csv"
MODELS_DIR = "models"

def encode_data():
    if not os.path.exists(INPUT_PATH):
        print(f"ERROR: Cleaned file not found at {INPUT_PATH}")
        return

    # 1. Load cleaned data
    df = pd.read_csv(INPUT_PATH)

    # 2. Encode Soil Type
    le_soil = LabelEncoder()
    df['soil_type_encoded'] = le_soil.fit_transform(df['soil_type'])
    
    print("\n--- SOIL TYPE ENCODING MAP ---")
    soil_map = dict(zip(le_soil.classes_, le_soil.transform(le_soil.classes_)))
    for name, val in soil_map.items():
        print(f"{name}: {val}")

    # 3. Encode Fertilizer Label
    le_fert = LabelEncoder()
    df['fertilizer_encoded'] = le_fert.fit_transform(df['fertilizer_label'])
    
    print("\n--- FERTILIZER LABEL ENCODING MAP ---")
    fert_map = dict(zip(le_fert.classes_, le_fert.transform(le_fert.classes_)))
    for name, val in fert_map.items():
        print(f"{name}: {val}")

    # 4. Save Encoders
    os.makedirs(MODELS_DIR, exist_ok=True)
    with open(os.path.join(MODELS_DIR, "soil_type_encoder.pkl"), "wb") as f:
        pickle.dump(le_soil, f)
    with open(os.path.join(MODELS_DIR, "fertilizer_label_encoder.pkl"), "wb") as f:
        pickle.dump(le_fert, f)
    print(f"\nSUCCESS: Encoders saved to {MODELS_DIR}")

    # 5. Save Encoded Dataset (Temperature, Moisture, Soil_Type_Encoded, Fertilizer_Encoded)
    final_df = df[['temperature', 'moisture', 'soil_type_encoded', 'fertilizer_encoded']]
    final_df.to_csv(OUTPUT_DATA_PATH, index=False)
    print(f"SUCCESS: Encoded dataset saved to {OUTPUT_DATA_PATH}")

    # 6. Preview first 5 rows
    print("\n--- FIRST 5 ROWS OF ENCODED DATA ---")
    print(final_df.head())

if __name__ == "__main__":
    encode_data()
