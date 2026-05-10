import pandas as pd
import os

# Configuration based on researched Kaggle column names
DATA_A_PATH = 'CropPulse-ml/data/raw/dataset_a.csv'
DATA_B_PATH = 'CropPulse-ml/data/raw/dataset_b.csv'

def inspect_dataset(file_path, name):
    print(f"\n{'='*20} {name} {'='*20}")
    if not os.path.exists(file_path):
        print(f"ERROR: File not found at {file_path}. Please download and place it there.")
        return None

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        print(f"ERROR reading file: {e}")
        return None
    
    print(f"Shape: {df.shape}")
    print(f"\nColumns & Dtypes:")
    print(df.dtypes)
    
    print(f"\nFirst 5 Rows:")
    print(df.head())
    
    print(f"\nNull Values per Column:")
    print(df.isnull().sum())
    
    # Identify relevant columns for sensor mapping
    numeric_cols = df.select_dtypes(include=['float64', 'int64']).columns
    print(f"\nSummary Statistics (Numeric Columns):")
    if not numeric_cols.empty:
        print(df[numeric_cols].describe().loc[['min', 'max', 'mean']])
    else:
        print("No numeric columns found.")
    
    # Label counts
    label_candidates = ['label', 'Fertilizer Name', 'Crop Type']
    label_col = next((c for c in label_candidates if c in df.columns), None)
    
    if label_col:
        print(f"\nValue Counts for '{label_col}':")
        print(df[label_col].value_counts().head(10))
    
    return df

if __name__ == "__main__":
    df_a = inspect_dataset(DATA_A_PATH, "Dataset A (Crop Recommendation)")
    df_b = inspect_dataset(DATA_B_PATH, "Dataset B (Soil/Fertilizer Analysis)")

