
import './App.css';
import { useState, useEffect } from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import mantouLogo from './images/mantou.png';
import Reversible from './Reversible.jsx';
import MathMenu from './MathMenu.jsx';
import PracticeGame from './math/PracticeGame.jsx';
import SpeedDrillRacer from './math/SpeedDrillRacer.jsx';
import TimelinePrototype from './TimelinePrototype.jsx';

function App() {
  const defaultOperations = {
    add: false,
    subtract: false,
    multiply: false,
    divide: false,
  };

  const [activeOperations, setActiveOperations] = useState(() => {
    try {
      const saved = localStorage.getItem('dmg.math.activeOperations');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore and fall back to defaults
    }
    return defaultOperations;
  });

  useEffect(() => {
    try {
      localStorage.setItem('dmg.math.activeOperations', JSON.stringify(activeOperations));
    } catch (e) {
      // ignore storage errors
    }
  }, [activeOperations]);

  return (
    <div className="App">
      <Routes>
        <Route
          path="/da-mantou-games"
          element={
            <div className="menu-container">
              <img src={mantouLogo} alt="Mantou Logo" className="mantou-logo" />
              <h1>Da Mantou Games</h1>
              <p className="subtitle">Bigger games by Daddy mantou</p>
              <nav className="vertical-menu">
                <Link className="menu-item" to="/da-mantou-games/math">Math</Link>
                <Link className="menu-item" to="/da-mantou-games/timeline-prototype">Timeline Prototype</Link>
                {/* <Link className="menu-item" to="/da-mantou-games#reversible">Reversible</Link> */}
              </nav>
            </div>
          }
        />
        <Route path="/da-mantou-games/math" element={<MathMenu activeOperations={activeOperations} setActiveOperations={setActiveOperations} />} />
        <Route path="/da-mantou-games/math/practice" element={<PracticeGame activeOperations={activeOperations} />} />
        <Route path="/da-mantou-games/math/speed-drill" element={<SpeedDrillRacer activeOperations={activeOperations} />} />
        <Route path="/da-mantou-games/timeline-prototype" element={<TimelinePrototype />} />
        {/* <Route path="/da-mantou-games#reversible" element={<Reversible />} /> */}
      </Routes>
    </div>
  );
}

export default App 
