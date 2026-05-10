import pandas as pd
import numpy as np
import os
import glob

# Reuse the labeling rules from Step 5
def apply_rules(row):
    m, t, e = row['moisture'], row['temperature'], row['ec']
    if e > 4.0 and m > 25: return "Salinity Stress"
    if e > 3.0 and m > 40 and t < 33: return "Over-Fertilization"
    if m < 20 and t > 29: return "Water Deficiency"
    if t > 38 and m < 40: return "Heat Stress"
    if e < 0.5 and m > 30 and t < 36: return "Nutrient Imbalance"
    if 35 <= m <= 70 and 20 <= t <= 34 and 0.8 <= e <= 2.5: return "Normal"
    return "Discard"

def merge_and_balance():
    # 1. Load Synthetic Data
    synth_path = 'CropPulse-ml/data/processed/synthetic_data.csv'
    if os.path.exists(synth_path):
        df_synth = pd.read_csv(synth_path)
        print(f"Loaded {len(df_synth)} rows from synthetic data.")
    else:
        print("Warning: Synthetic data not found. Will rely on real data only.")
        df_synth = pd.DataFrame()

    # 2. Search for Real Data in raw folder
    raw_files = glob.glob('CropPulse-ml/data/raw/*.csv')
    real_data_list = []

    for file in raw_files:
        print(f"Processing real data: {file}")
        try:
            temp_df = pd.read_csv(file)
            
            # Standardize columns
            if 'humidity' in temp_df.columns:
                temp_df = temp_df.rename(columns={'humidity': 'moisture'})
            if 'Moisture' in temp_df.columns:
                temp_df = temp_df.rename(columns={'Moisture': 'moisture'})
            if 'Temparature' in temp_df.columns:
                temp_df = temp_df.rename(columns={'Temparature': 'temperature'})
            if 'Temperature' in temp_df.columns:
                temp_df = temp_df.rename(columns={'Temperature': 'temperature'})
                
            # Derive EC if missing
            if 'ec' not in temp_df.columns:
                if all(c in temp_df.columns for c in ['N', 'P', 'K']):
                    temp_df['ec'] = (temp_df['N'] + temp_df['P'] + temp_df['K']) / 100.0
                elif all(c in temp_df.columns for c in ['Nitrogen', 'Potassium', 'Phosphorous']):
                    temp_df['ec'] = (temp_df['Nitrogen'] + temp_df['Potassium'] + temp_df['Phosphorous']) / 100.0
                else:
                    print(f"Warning: Could not derive EC for {file}. Looking for N/P/K or Nitrogen/Potassium/Phosphorous.")
                    continue

            # Keep only necessary columns
            temp_df = temp_df[['moisture', 'temperature', 'ec']]
            temp_df['label'] = temp_df.apply(apply_rules, axis=1)
            temp_df = temp_df[temp_df['label'] != "Discard"]
            real_data_list.append(temp_df)
        except Exception as e:
            print(f"Error processing {file}: {e}")

    # 3. Merge
    if real_data_list:
        df_real = pd.concat(real_data_list)
        print(f"Added {len(df_real)} labeled rows from real data.")
        df_final = pd.concat([df_synth, df_real]) if not df_synth.empty else df_real
    else:
        print("No compatible real data found in 'CropPulse-ml/data/raw/'. Using synthetic data only.")
        df_final = df_synth

    if df_final.empty:
        print("ERROR: No data available to merge. Run Step 5 first.")
        return

    # 4. Class Balancing
    print("\nClass distribution before balancing:")
    print(df_final['label'].value_counts())

    balanced_dfs = []
    for cls in df_final['label'].unique():
        cls_df = df_final[df_final['label'] == cls]
        # Ensure at least 1000 rows (simple oversampling if needed, though synthetic should have enough)
        if len(cls_df) > 2000:
            cls_df = cls_df.sample(2000, random_state=42)
        balanced_dfs.append(cls_df)
    
    df_final = pd.concat(balanced_dfs).sample(frac=1).reset_index(drop=True)

    # 5. Save
    output_path = 'CropPulse-ml/data/processed/final_dataset.csv'
    df_final.to_csv(output_path, index=False)
    
    print("\nFinal Balanced Class Distribution:")
    print(df_final['label'].value_counts())
    print(f"Total rows: {len(df_final)}")
    print(f"Saved to: {output_path}")

if __name__ == "__main__":
    merge_and_balance()

