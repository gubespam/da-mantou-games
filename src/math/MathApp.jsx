import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import MathMenu from './MathMenu.jsx';
import PracticeGame from './PracticeGame.jsx';
import SpeedDrillRacer from './SpeedDrillRacer.jsx';

export default function MathApp() {
  const [activeOperations, setActiveOperations] = useState(() => {
    try {
      const saved = localStorage.getItem('dmg.math.activeOperations');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore and fall back to defaults
    }
    return {
      add: false,
      subtract: false,
      multiply: false,
      divide: false,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('dmg.math.activeOperations', JSON.stringify(activeOperations));
    } catch (e) {
      // ignore storage errors
    }
  }, [activeOperations]);

  return (
    <Routes>
      <Route
        index
        element={
          <MathMenu
            activeOperations={activeOperations}
            setActiveOperations={setActiveOperations}
          />
        }
      />
      <Route
        path="practice"
        element={<PracticeGame activeOperations={activeOperations} />}
      />
      <Route
        path="speed-drill"
        element={<SpeedDrillRacer activeOperations={activeOperations} />}
      />
    </Routes>
  );
}