import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MathMenu.css';

export default function MathMenu({ activeOperations, setActiveOperations }) {
  const [showWarning, setShowWarning] = useState(false);
  const navigate = useNavigate();

  const toggleOperation = (operation) => {
    const newOps = { ...activeOperations, [operation]: !activeOperations[operation] };
    setActiveOperations(newOps);
    if (Object.values(newOps).some(Boolean)) setShowWarning(false);
  };

  useEffect(() => {
    if (Object.values(activeOperations).some(Boolean)) setShowWarning(false);
  }, [activeOperations]);

  const handleStart = (path) => {
    if (Object.values(activeOperations).some(Boolean)) {
      navigate(path);
    } else {
      setShowWarning(true);
    }
  };

  return (
    <div className="math-menu-container">
      <h1 className="math-title">Math Mantou</h1>
      
      {showWarning && (
        <div className="warning-message" style={{ textAlign: 'center', marginBottom: '12px', color: 'red' }} role="alert">
          Please select at least one operation (add, substract, etc.).
        </div>
      )}

      <div className="toggle-options">
        <button
          className={`toggle-btn ${activeOperations.add ? 'active' : ''}`}
          onClick={() => toggleOperation('add')}
        >
          Add
        </button>
        <button
          className={`toggle-btn ${activeOperations.subtract ? 'active' : ''}`}
          onClick={() => toggleOperation('subtract')}
        >
          Subtract
        </button>
        <button
          className={`toggle-btn ${activeOperations.multiply ? 'active' : ''}`}
          onClick={() => toggleOperation('multiply')}
        >
          Multiply
        </button>
        <button
          className={`toggle-btn ${activeOperations.divide ? 'active' : ''}`}
          onClick={() => toggleOperation('divide')}
        >
          Divide
        </button>
      </div>

      <div className="main-menu">
        <button className="menu-btn" onClick={() => handleStart('/da-mantou-games/math/practice')}>
          Practice
        </button>
        <button className="menu-btn" onClick={() => handleStart('/da-mantou-games/math/speed-drill')}>
          Speed Drill
        </button>
      </div>
    </div>
  );
}
