// src/App.tsx

import 'leaflet/dist/leaflet.css';
import './App.css';
import ChoroplethMap from './components/ChoroplethMap.tsx';

function App() {
    return (
        <div className="App">
            <ChoroplethMap />
        </div>
    );
}

export default App;