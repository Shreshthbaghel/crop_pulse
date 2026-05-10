import pandas as pd
import pickle
import os
from sklearn.preprocessing import LabelEncoder

# --- CONFIGURATION ---
INPUT_PATH = "data/processed/fertilizer_with_synthetic.csv"
OUTPUT_DATA_PATH = "data/processed/fertilizer_encoded.csv"
MODEL_DIR = "models"
# ---------------------

def encode_data():
    if not os.path.exists(INPUT_PATH):
        print(f"ERROR: Synthetic data not found at {INPUT_PATH}")
        return

    df = pd.read_csv(INPUT_PATH)
    os.makedirs(MODEL_DIR, exist_ok=True)

    le_soil = LabelEncoder()
    df['soil_type_encoded'] = le_soil.fit_transform(df['soil_type'])
    
    le_fert = LabelEncoder()
    df['fertilizer_encoded'] = le_fert.fit_transform(df['fertilizer_label'])

    # Save Encoders
    with open(os.path.join(MODEL_DIR, 'soil_type_encoder.pkl'), 'wb') as f:
        pickle.dump(le_soil, f)
    with open(os.path.join(MODEL_DIR, 'fertilizer_label_encoder.pkl'), 'wb') as f:
        pickle.dump(le_fert, f)

    # Save Encoded Data - Now including 'ec'
    final_df = df[['temperature', 'moisture', 'ec', 'soil_type_encoded', 'fertilizer_encoded']]
    final_df.to_csv(OUTPUT_DATA_PATH, index=False)
    print(f"SUCCESS: Encoded data (including EC) saved to {OUTPUT_DATA_PATH}")

if __name__ == "__main__":
    encode_data()
