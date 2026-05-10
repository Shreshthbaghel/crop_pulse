# scripts/augment_fertilizer.py
import pandas as pd
import numpy as np
import os

# --- CONFIGURATION ---
INPUT_PATH = "data/processed/fertilizer_cleaned.csv"
OUTPUT_PATH = "data/processed/fertilizer_augmented.csv"

def augment_data():
    if not os.path.exists(INPUT_PATH):
        print(f"ERROR: Cleaned data not found at {INPUT_PATH}")
        return

    df = pd.read_csv(INPUT_PATH)
    target_rows_per_class = 150 # Increased density
    augmented_rows = []

    for label in df['fertilizer_label'].unique():
        class_subset = df[df['fertilizer_label'] == label]
        current_count = len(class_subset)
        
        # Keep original data
        augmented_rows.append(class_subset)
        
        # Generate synthetic rows to reach target
        if current_count < target_rows_per_class:
            needed = target_rows_per_class - current_count
            for _ in range(needed):
                # Pick a random real row to "mutate"
                sample = class_subset.sample(n=1).iloc[0]
                
                # Tighter Gaussian noise to create clearer clusters
                new_temp = sample['temperature'] + np.random.normal(0, 0.5)
                new_moist = sample['moisture'] + np.random.normal(0, 1.0)
                
                # Clip to physical ranges
                new_temp = np.clip(new_temp, 0, 60)
                new_moist = np.clip(new_moist, 0, 100)
                
                augmented_rows.append(pd.DataFrame([{
                    'temperature': new_temp,
                    'moisture': new_moist,
                    'soil_type': sample['soil_type'],
                    'fertilizer_label': sample['fertilizer_label']
                }]))

    final_df = pd.concat(augmented_rows, ignore_index=True)
    print(f"--- Augmentation V2 Complete ---")
    print(f"Total Rows: {len(final_df)}")
    print(final_df['fertilizer_label'].value_counts())

    final_df.to_csv(OUTPUT_PATH, index=False)
    print(f"\nSUCCESS: High-fidelity augmented data saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    augment_data()
