# scripts/generate_fertilizer_synthetic.py
import pandas as pd
import numpy as np
import os

OUTPUT_PATH = "data/processed/fertilizer_augmented.csv"

def generate_niche_data():
    # Define distinct "Environmental Niches" for each fertilizer
    # Format: (Temp_Mean, Moist_Mean, Soil_Type)
    niches = {
        'Urea':     (32, 40, 'Sandy'),  # Hot, Dry, Sandy
        'DAP':      (26, 65, 'Black'),  # Moderate, Wet, Black
        '14-35-14': (20, 80, 'Red'),    # Cool, Very Wet, Red
        '28-28':    (29, 45, 'Sandy'),  # Warm, Dry, Sandy
        '17-17-17': (24, 55, 'Loamy'),  # Mild, Damp, Loamy
        '20-20':    (27, 50, 'Loamy'),  # Warm, Damp, Loamy
        '10-26-26': (18, 75, 'Clayey')  # Cold, Wet, Clayey
    }

    rows = []
    samples_per_class = 200

    for label, (t_mean, m_mean, soil) in niches.items():
        for _ in range(samples_per_class):
            # Create tight, distinct clusters
            temp = np.random.normal(t_mean, 1.0)
            moist = np.random.normal(m_mean, 1.5)
            
            rows.append({
                'temperature': np.clip(temp, 0, 60),
                'moisture': np.clip(moist, 0, 100),
                'soil_type': soil,
                'fertilizer_label': label
            })

    df = pd.DataFrame(rows)
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"SUCCESS: Generated {len(df)} rows with unique environmental niches.")

if __name__ == "__main__":
    generate_niche_data()
