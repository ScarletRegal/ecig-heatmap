// src/data.ts
import { scaleQuantile } from 'd3-scale';

// 1. Define a type for our data structure
export type SubstanceData = {
    [zip3: string]: number;
};

// 2. Create some mock data
export const mockData: SubstanceData = {
    '100': 95, '101': 80, '102': 75, '103': 30, '104': 22,
    '900': 88, '902': 92, '904': 60, '606': 78, '752': 55,
    '331': 85, '021': 70, // Add more data points as needed
};

// 3. Define the color scale for the heatmap
// scaleQuantile groups data into buckets with an equal number of data points
export const colorScale = scaleQuantile<string>()
    .domain(Object.values(mockData)) // Input data values
    .range([ // Output colors
        '#FFFFE0', // Lightest
        '#FFD07B',
        '#FF9E4A',
        '#F96D3A',
        '#E1422A',
        '#B41C1C', // Darkest
    ]);