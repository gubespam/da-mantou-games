
import './App.css';
import { Link, Routes, Route } from 'react-router-dom';
import mantouLogo from './images/mantou.png';
import Reversible from './reversible/Reversible.jsx';
import MasterMind from './mastermind/MasterMind.jsx';
import MathApp from './math/MathApp.jsx';
import TimelinePrototype from './TimelinePrototype.jsx';
import HistoryTimeline from './history/HistoryTimeline.jsx';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route
          path="/da-mantou-games"
          element={
            <div className="menu-container">
              <img src={mantouLogo} alt="Mantou Logo" className="mantou-logo" />
              <a class="cross-site" href="/xiao-mantou-games/">Go to Xiao Mantou Games</a>
              <h1>Da Mantou Games</h1>
              <p className="subtitle">Bigger games by Daddy mantou</p>
              <nav className="vertical-menu">
                <Link className="menu-item" to="/da-mantou-games/reversible">Reversible</Link>
                <Link className="menu-item" to="/da-mantou-games/mastermind">MasterMind</Link>
                <Link className="menu-item" to="/da-mantou-games/math">Math</Link>
                <Link className="menu-item" to="/da-mantou-games/history-timeline">History Timeline</Link>
                <Link className="menu-item" to="/da-mantou-games/timeline-prototype">Timeline Prototype</Link>
              </nav>
            </div>
          }
        />
        <Route path="/da-mantou-games/reversible" element={<Reversible />} />
        <Route path="/da-mantou-games/mastermind" element={<MasterMind />} />
        <Route path="/da-mantou-games/math/*" element={<MathApp />} />
        <Route path="/da-mantou-games/timeline-prototype" element={<TimelinePrototype />} />
        <Route path="/da-mantou-games/history-timeline" element={<HistoryTimeline />} />
      </Routes>
    </div>
  );
}

export default App 
