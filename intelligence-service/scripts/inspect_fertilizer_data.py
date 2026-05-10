import pandas as pd
import os

# --- CONFIGURATION ---
DATA_PATH = "data/raw/fertilizer_data.csv" 
# ---------------------

def inspect_data():
    if not os.path.exists(DATA_PATH):
        print(f"ERROR: File not found at {DATA_PATH}")
        print(f"Please place your Kaggle CSV at: {DATA_PATH}")
        return

    # 1. Load the fertilizer CSV file
    df = pd.read_csv(DATA_PATH)

    print("--- 1. EXACT COLUMN NAMES ---")
    print(df.columns.tolist())
    print("\n")

    print("--- 2. DATASET SHAPE ---")
    print(df.shape)
    print("\n")

    print("--- 3. DATA TYPES ---")
    print(df.dtypes)
    print("\n")

    print("--- 4. FIRST 5 ROWS ---")
    print(df.head())
    print("\n")

    print("--- 5. NULL COUNT ---")
    print(df.isnull().sum())
    print("\n")

    # Column identification
    soil_col = [c for c in df.columns if 'soil' in c.lower()]
    fert_col = [c for c in df.columns if 'fertilizer' in c.lower() or 'target' in c.lower()]

    if soil_col:
        col = soil_col[0]
        print(f"--- 6. UNIQUE VALUES IN '{col}' ---")
        print(df[col].unique().tolist())
        print("\n")
    else:
        print("WARNING: Could not identify 'Soil Type' column.\n")

    if fert_col:
        col = fert_col[0]
        print(f"--- 7. UNIQUE VALUES IN '{col}' ---")
        print(df[col].unique().tolist())
        print("\n")

        print(f"--- 8. VALUE COUNTS FOR '{col}' ---")
        print(df[col].value_counts())
        print("\n")
    else:
        print("WARNING: Could not identify 'Fertilizer Name' column.\n")

if __name__ == "__main__":
    inspect_data()
