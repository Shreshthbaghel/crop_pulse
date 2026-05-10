import pandas as pd
import numpy as np
import os

def apply_rules(row):
    m, t, tds = row['moisture'], row['temperature'], row['tds']
    
    # 1. Salinity Stress (Very high TDS)
    if tds > 2500 and m > 25: return "Salinity Stress"
    # 2. Over-Fertilization (High TDS)
    if tds > 1800 and m > 40 and t < 33: return "Over-Fertilization"
    # 3. Water Deficiency (Low moisture)
    if m < 20 and t > 29: return "Water Deficiency"
    # 4. Heat Stress (Extreme temp)
    if t > 38 and m < 40: return "Heat Stress"
    # 5. Nutrient Imbalance (Low TDS)
    if tds < 500 and m > 30 and t < 36: return "Nutrient Imbalance"
    # 6. Normal (Strictly within optimal ranges)
    if 40 <= m <= 70 and 20 <= t <= 35 and 600 <= tds <= 1600: return "Normal"
    
    return "Discard"

def generate_data():
    print("Generating base synthetic dataset...")
    data = {
        'moisture': np.random.uniform(5, 100, 15000),
        'temperature': np.random.uniform(15, 45, 15000),
        'tds': np.random.uniform(20, 3000, 15000)
    }
    df = pd.DataFrame(data)
    df['label'] = df.apply(apply_rules, axis=1)
    df = df[df['label'] != "Discard"]
    
    # STEP 4: EXTREME LOW TDS reinforcement (50–300 ppm)
    print("Adding 500 extreme LOW TDS reinforcement rows...")
    low_tds_data = {
        'moisture': np.random.uniform(30, 80, 500),
        'temperature': np.random.uniform(20, 35, 500),
        'tds': np.random.uniform(50, 300, 500),
        'label': ['Nutrient Imbalance'] * 500
    }
    df = pd.concat([df, pd.DataFrame(low_tds_data)])

    # STEP 4: EXTREME HIGH MOISTURE reinforcement (80–100%)
    print("Adding 300 extreme HIGH MOISTURE reinforcement rows...")
    high_m_data = {
        'moisture': np.random.uniform(80, 100, 300),
        'temperature': np.random.uniform(20, 35, 300),
        'tds': np.random.uniform(50, 400, 300),
        'label': ['Nutrient Imbalance'] * 300
    }
    df = pd.concat([df, pd.DataFrame(high_m_data)])

    # STEP 4: NORMAL RANGE reinforcement (700–1400 ppm)
    print("Adding 300 NORMAL RANGE reinforcement rows...")
    normal_data = {
        'moisture': np.random.uniform(45, 65, 300),
        'temperature': np.random.uniform(22, 32, 300),
        'tds': np.random.uniform(700, 1400, 300),
        'label': ['Normal'] * 300
    }
    df = pd.concat([df, pd.DataFrame(normal_data)])

    print("\nClass Distribution after Reinforcement:")
    print(df['label'].value_counts())
    
    # Final Balancing
    final_dfs = []
    classes = ["Normal", "Water Deficiency", "Salinity Stress", "Over-Fertilization", "Heat Stress", "Nutrient Imbalance"]
    for cls in classes:
        cls_df = df[df['label'] == cls]
        if len(cls_df) > 1200:
            final_dfs.append(cls_df.sample(1200, random_state=42))
        else:
            final_dfs.append(cls_df)
    
    final_df = pd.concat(final_dfs).sample(frac=1).reset_index(drop=True)
    
    # Map 'tds' back to 'ec' name for feature pipeline compatibility
    final_df.rename(columns={'tds': 'ec'}, inplace=True)
    
    os.makedirs('CropPulse-ml/data/processed', exist_ok=True)
    final_df.to_csv('CropPulse-ml/data/processed/synthetic_data.csv', index=False)
    
    print("\nFinal Balanced Dataset Summary:")
    print(final_df['label'].value_counts())
    print(f"Saved to: CropPulse-ml/data/processed/synthetic_data.csv")

if __name__ == "__main__":
    generate_data()

