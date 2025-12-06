
import './App.css';
import { Link, Routes, Route } from 'react-router-dom';
import mantouLogo from './images/mantou.png';


function App() {
  return (
    <div className="App">
      <Routes>
        <Route
          path="/da-mantou-games"
          element={
            <div className="menu-container">
              <img src={mantouLogo} alt="Mantou Logo" className="mantou-logo" />
              <h1>Da Mantou Games</h1>
              <p className="subtitle">Little games by the bigger mantou</p>
              <nav className="vertical-menu">
                <Link className="menu-item" to="/da-mantou-games/reversible">Reversible</Link>
              </nav>
            </div>
          }
        />
        <Route path="/da-mantou-games/reversible" element={<Reversible />} />
      </Routes>
    </div>
  );
}

export default App
