import pandas as pd
import os

# --- CONFIGURATION ---
INPUT_PATH = "data/raw/fertilizer_data.csv"
OUTPUT_PATH = "data/processed/fertilizer_cleaned.csv"
# ---------------------

def clean_data():
    if not os.path.exists(INPUT_PATH):
        print(f"ERROR: Raw data not found at {INPUT_PATH}")
        return

    df = pd.read_csv(INPUT_PATH)
    initial_count = len(df)

    # 1. Select and Rename
    # Note: Using the confirmed misspelled 'Temparature'
    columns_map = {
        'Temparature': 'temperature',
        'Moisture': 'moisture',
        'Soil Type': 'soil_type',
        'Fertilizer Name': 'fertilizer_label'
    }
    
    # Filter only existing columns from map to avoid errors
    existing_cols = [c for c in columns_map.keys() if c in df.columns]
    df = df[existing_cols].rename(columns=columns_map)

    # 2. Drop Nulls
    df = df.dropna()

    # 3. Filter Ranges
    if 'temperature' in df.columns:
        df = df[(df['temperature'] >= 0) & (df['temperature'] <= 60)]
    if 'moisture' in df.columns:
        df = df[(df['moisture'] >= 0) & (df['moisture'] <= 100)]

    final_count = len(df)

    # Output stats
    print(f"--- CLEANING SUMMARY ---")
    print(f"Rows before: {initial_count}")
    print(f"Rows after:  {final_count}")
    print(f"\nUnique Soil Types: {df['soil_type'].unique().tolist()}")
    print(f"\nFertilizer Value Counts:\n{df['fertilizer_label'].value_counts()}")

    # 4. Save
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"\nSUCCESS: Cleaned data saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    clean_data()
