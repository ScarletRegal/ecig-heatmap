import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { type LatLngExpression, type Layer, type StyleFunction } from 'leaflet';
import { type FeatureCollection } from 'geojson';
import { scaleQuantile } from 'd3-scale';

import './ChoroplethMap.css';
import 'leaflet/dist/leaflet.css';

// --- Type Definitions for our data structures ---
type SubstanceData = { [substance: string]: number | null };
type AggregatedData = { [zip3: string]: SubstanceData };

const ChoroplethMap = () => {
    // --- State Management ---
    const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);
    const [aggregatedData, setAggregatedData] = useState<AggregatedData | null>(null);
    const [substances, setSubstances] = useState<string[]>([]);
    const [quarters, setQuarters] = useState<string[]>([]);
    const [startQuarter, setStartQuarter] = useState<string>('');
    const [endQuarter, setEndQuarter] = useState<string>('');
    const [selectedSubstance, setSelectedSubstance] = useState<string>('OXYCODONE');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Map's initial position
    const position: LatLngExpression = [39.8283, -98.5795];

    // --- Data Loading Effects ---

    // This effect runs only once to fetch the static map shapes and the list of quarters.
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch the list of available quarters to populate dropdowns
                const quartersRes = await fetch('data/quarters_list.json');
                const quartersData = await quartersRes.json();
                setQuarters(quartersData);
                // Set default date range to be the full range
                setStartQuarter(quartersData[0]);
                setEndQuarter(quartersData[quartersData.length - 1]);

                // Fetch the geographic shapes for the map
                const shapesRes = await fetch('data/zip3-shapes.json');
                const shapesData = await shapesRes.json();
                setGeoJsonData(shapesData);

            } catch (error) {
                console.error("Failed to fetch initial map data:", error);
            }
        };
        fetchInitialData();
    }, []); // Empty array means this runs only on component mount.

    // This effect runs whenever the date range (start/end quarter) changes.
    // It fetches only the required quarterly data files and aggregates them.
    useEffect(() => {
        // Don't run if the initial list of quarters isn't loaded yet
        if (quarters.length === 0) return;

        const aggregateData = async () => {
            setIsLoading(true);

            const startIndex = quarters.indexOf(startQuarter);
            const endIndex = quarters.indexOf(endQuarter);

            // Ensure the date range is valid
            if (startIndex > endIndex) {
                setEndQuarter(startQuarter); // Or handle as an error
                return;
            }

            const quartersToFetch = quarters.slice(startIndex, endIndex + 1);

            // Create an array of fetch promises for each file in the selected range
            const promises = quartersToFetch.map(q =>
                fetch(`data/${q}.json`).then(res => res.json())
            );

            try {
                // Wait for all selected files to download in parallel
                const datasets = await Promise.all(promises);

                // Aggregate the results by summing the values
                const newAggregatedData: AggregatedData = {};
                for (const quarterlyData of datasets) {
                    for (const zip3 in quarterlyData) {
                        if (!newAggregatedData[zip3]) newAggregatedData[zip3] = {};
                        for (const substance in quarterlyData[zip3]) {
                            if (!newAggregatedData[zip3][substance]) {
                                newAggregatedData[zip3][substance] = 0;
                            }
                            const value = quarterlyData[zip3][substance];
                            if (value !== null) {
                                newAggregatedData[zip3][substance]! += value;
                            }
                        }
                    }
                }
                setAggregatedData(newAggregatedData);
                // Dynamically create the substance list from the first aggregated record
                if (Object.keys(newAggregatedData).length > 0) {
                    setSubstances(Object.keys(newAggregatedData[Object.keys(newAggregatedData)[0]]));
                }
            } catch (error) {
                console.error("Failed to fetch or aggregate quarterly data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        aggregateData();
    }, [startQuarter, endQuarter, quarters]); // Re-run this logic when the date range or quarter list changes

    // --- Render Logic & Visualization ---

    // Show a loading screen until the initial data is ready
    if (!geoJsonData || !aggregatedData || substances.length === 0) {
        return <div className="loading-overlay">Loading Map Data...</div>;
    }

    // Create the dynamic color scale based on the currently selected data
    const dataValues = Object.values(aggregatedData).map(d => d[selectedSubstance] || 0).filter(v => v > 0);
    const colorScale = scaleQuantile<string>().domain(dataValues).range(['#FFFFE0', '#FFD07B', '#FF9E4A', '#F96D3A', '#E1422A', '#B41C1C']);

    // Helper function to robustly get the ZIP3 key from a map feature
    const getZipFromFeature = (feature: any): string | null => {
        if (!feature || !feature.properties) return null;
        const rawZip = feature.properties['3dig_zip'];
        return rawZip ? String(rawZip) : null;
    };

    // Function to style each ZIP3 area based on its aggregated data
    const styleFeature: StyleFunction = (feature) => {
        const zip3 = getZipFromFeature(feature);
        const record = zip3 ? aggregatedData[zip3] : null;
        const value = record ? record[selectedSubstance] : null;
        return {
            fillColor: value && value > 0 ? colorScale(value) : '#CCCCCC',
            weight: 0.5, opacity: 1, color: 'white', fillOpacity: 0.7,
        };
    };

    // Function to add an informative popup to each ZIP3 area
    const onEachFeature = (feature: any, layer: Layer) => {
        const zip3 = getZipFromFeature(feature);
        if (zip3) {
            const dataForZip = aggregatedData[zip3];
            let popupContent = `<b>ZIP3: ${zip3}</b><br/><hr/><i>Aggregated from ${startQuarter} to ${endQuarter}</i><br/><br/>`;
            if (dataForZip) {
                for (const substance of substances) {
                    const value = dataForZip[substance];
                    popupContent += `${substance}: ${value !== null ? value.toFixed(2) : 'N/A'}<br/>`;
                }
            } else {
                popupContent += 'No data available for this ZIP3.';
            }
            layer.bindPopup(popupContent);
        }
    };

    // Dynamically filter the end date dropdown based on the selected start date
    const endQuarterOptions = quarters.slice(quarters.indexOf(startQuarter));

    return (
        <div className="map-wrapper">
            <div className="controls-container">
                <div className="field">
                    <label>Substance</label>
                    <select value={selectedSubstance} onChange={(e) => setSelectedSubstance(e.target.value)}>
                        {substances.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                </div>
                <div className="quarter-container">
                    <div className="field">
                        <label>Start Quarter</label>
                        <select value={startQuarter} onChange={(e) => setStartQuarter(e.target.value)}>
                            {quarters.map((q) => <option key={q} value={q}>{q}</option>)}
                        </select>
                    </div>
                    <div className="field">
                        <label>End Quarter</label>
                        <select value={endQuarter} onChange={(e) => setEndQuarter(e.target.value)}>
                            {endQuarterOptions.map((q) => <option key={q} value={q}>{q}</option>)}
                        </select>
                    </div>
                </div>

            </div>

            {isLoading && <div className="loading-overlay">Aggregating New Date Range...</div>}

            <div className="map-container">
                <MapContainer center={position} zoom={4} style={{ height: '100%', width: '100%', maxWidth: 1000 }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                    <GeoJSON key={`${selectedSubstance}-${startQuarter}-${endQuarter}`} data={geoJsonData} style={styleFeature} onEachFeature={onEachFeature} />
                </MapContainer>
            </div>

        </div>
    );
};

export default ChoroplethMap;