import pandas as pd
import numpy as np
import os

def engineer_features():
    # 1. Load the merged dataset
    input_path = 'CropPulse-ml/data/processed/final_dataset.csv'
    if not os.path.exists(input_path):
        print(f"ERROR: {input_path} not found. Run Step 6 first.")
        return
        
    df = pd.read_csv(input_path)
    print(f"Loaded {len(df)} rows for feature engineering.")

    # 2. Add Engineered Features
    df['moisture_ec_ratio'] = df['moisture'] / (df['ec'] + 0.001)
    df['temp_moisture_product'] = df['temperature'] * (1 - df['moisture'] / 100.0)
    df['ec_normalized'] = df['ec'] / 10.0
    df['moisture_normalized'] = df['moisture'] / 100.0
    df['stress_index'] = (df['temperature'] / 45.0) * (1 - df['moisture'] / 100.0) * (df['ec'] / 10.0)

    # 3. Final Feature Selection and Order
    feature_columns = [
        "moisture", "temperature", "ec", 
        "moisture_ec_ratio", "temp_moisture_product", 
        "ec_normalized", "moisture_normalized", "stress_index"
    ]
    
    # Ensure all features exist and handle labels
    final_df = df[feature_columns + ['label']]

    # 4. Correlation Analysis
    print("\nCorrelation with Numeric Label Representation:")
    corr_df = final_df.copy()
    corr_df['label_num'] = pd.factorize(corr_df['label'])[0]
    print(corr_df.drop('label', axis=1).corr()['label_num'].sort_values(ascending=False))

    # 5. Save
    output_path = 'CropPulse-ml/data/processed/featured_dataset.csv'
    final_df.to_csv(output_path, index=False)
    
    print("\nFinal Feature List (Order Verified):")
    print(final_df.columns[:-1].tolist()) # Exclude 'label'
    print(f"\nSaved {len(final_df)} rows to: {output_path}")

if __name__ == "__main__":
    engineer_features()

