import pandas as pd
import json
import glob
import math
import os

try:
    # Find all CSV files in the current directory
    csv_files = sorted(glob.glob('????Q?.csv')) # Pattern to match files like 2019Q1.csv
    if not csv_files:
        raise FileNotFoundError("No CSV files found matching the pattern 'YYYYQ[1-4].csv'.")
    
    print(f"Found {len(csv_files)} CSV files to process...")

    all_quarters = []
    # Process each CSV file individually
    for file_path in csv_files:
        df = pd.read_csv(file_path)
        
        # Get the quarter string from the filename (e.g., "2019Q1")
        quarter_str = os.path.splitext(os.path.basename(file_path))[0]
        all_quarters.append(quarter_str)
        
        # --- Create the nested data structure for this quarter ---
        df['zip3_str'] = df['zip3'].astype(str)

        pivot_df = df.pivot_table(
            index='zip3_str',
            columns='substance',
            values='gramsper100K'
        )

        nested_data = pivot_df.round(2).to_dict('index')

        cleaned_data = {}
        for zip3, data in nested_data.items():
            cleaned_data[zip3] = {}
            for substance, value in data.items():
                if isinstance(value, float) and math.isnan(value):
                    cleaned_data[zip3][substance] = None
                else:
                    cleaned_data[zip3][substance] = value

        # Save the individual JSON file
        with open(f'{quarter_str}.json', 'w') as f:
            json.dump(cleaned_data, f)
        print(f"✅ Successfully created {quarter_str}.json")

    # --- Create the master list of all quarters ---
    with open('quarters_list.json', 'w') as f:
        json.dump(all_quarters, f, indent=2)
    print("✅ Successfully created quarters_list.json")

except Exception as e:
    print(f"An error occurred: {e}")