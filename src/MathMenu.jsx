import { useState } from 'react';
import { Link } from 'react-router-dom';
import './MathMenu.css';

export default function MathMenu() {
  const [activeOperations, setActiveOperations] = useState({
    add: false,
    subtract: false,
    multiply: false,
    divide: false,
  });

  const toggleOperation = (operation) => {
    setActiveOperations((prev) => ({
      ...prev,
      [operation]: !prev[operation],
    }));
  };

  return (
    <div className="math-menu-container">
      <h1 className="math-title">Math Mantou</h1>
      
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
        <Link to="/da-mantou-games/math/practice" className="menu-btn">
          Practice
        </Link>
        <Link to="/da-mantou-games/math/speed-drill" className="menu-btn">
          Speed Drill
        </Link>
      </div>
    </div>
  );
}
