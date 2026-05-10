# scripts/clean_fertilizer.py
import pandas as pd
import os

# --- CONFIGURATION ---
INPUT_PATH = "data/raw/fertilizer_data.csv"
OUTPUT_PATH = "data/processed/fertilizer_cleaned.csv"

def clean_data():
    if not os.path.exists(INPUT_PATH):
        print(f"ERROR: Input file not found at {INPUT_PATH}")
        return

    # 1. Load the raw data
    df = pd.read_csv(INPUT_PATH)
    initial_count = len(df)
    print(f"--- Initial Row Count: {initial_count} ---")

    # 2. Select and Rename Columns using CONFIRMED names
    # Note: Using 'Temparature' as found in inspection
    df = df[['Temparature', 'Moisture', 'Soil Type', 'Fertilizer Name']]
    df.columns = ['temperature', 'moisture', 'soil_type', 'fertilizer_label']

    # 3. Drop rows with nulls
    df = df.dropna()
    print(f"Rows after dropping nulls: {len(df)}")

    # 4. Filter Temperature (0-60)
    df = df[(df['temperature'] >= 0) & (df['temperature'] <= 60)]
    print(f"Rows after temperature filter (0-60): {len(df)}")

    # 5. Filter Moisture (0-100)
    df = df[(df['moisture'] >= 0) & (df['moisture'] <= 100)]
    print(f"Rows after moisture filter (0-100): {len(df)}")

    # 6. Strip whitespace from text columns
    df['soil_type'] = df['soil_type'].str.strip()
    df['fertilizer_label'] = df['fertilizer_label'].str.strip()

    # 7. Final Output Info
    print(f"\n--- Final Row Count: {len(df)} ---")
    print(f"Unique Soil Types: {df['soil_type'].unique().tolist()}")
    print(f"Unique Fertilizer Labels: {df['fertilizer_label'].unique().tolist()}")
    
    print("\n--- Value Counts per Fertilizer ---")
    print(df['fertilizer_label'].value_counts())

    # 8. Save the cleaned file
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"\nSUCCESS: Cleaned data saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    clean_data()
