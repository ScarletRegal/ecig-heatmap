import pandas as pd
import json
import math

try:
    # Load the dataset using the full file path
    df = pd.read_csv('2019Q1.csv')

    # --- Create the list of unique substances ---
    substances = sorted(df['substance'].unique().tolist())
    with open('substances_list.json', 'w') as f:
        json.dump(substances, f)
    print("✅ Successfully created substances_list.json")

    # --- Create the nested data structure ---
    # CRITICAL FIX: Convert zip3 to string WITHOUT padding
    df['zip3_str'] = df['zip3'].astype(str)

    # Pivot the table to get the desired nested structure
    df_pivot = df.pivot_table(
        index='zip3_str',
        columns='substance',
        values='gramsper100K'
    )

    # Convert to dictionary and manually replace NaN with None for valid JSON
    nested_data = df_pivot.round(2).to_dict('index')
    cleaned_data = {}
    for zip3, data in nested_data.items():
        cleaned_data[zip3] = {}
        for substance, value in data.items():
            if isinstance(value, float) and math.isnan(value):
                cleaned_data[zip3][substance] = None
            else:
                cleaned_data[zip3][substance] = value

    with open('2019Q1.json', 'w') as f:
        json.dump(cleaned_data, f, indent=2)
    print("✅ Successfully created 2019Q1.json")

except FileNotFoundError:
    print("❌ Error: Make sure '2019Q1.csv' is in the same directory as this script.")
except Exception as e:
    print(f"An error occurred: {e}")