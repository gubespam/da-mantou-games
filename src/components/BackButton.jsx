import { useNavigate } from 'react-router-dom';
import './BackButton.css';

function BackButton({ to = '/da-mantou-games' }) {
  const navigate = useNavigate();

  return (
    <button type="button" className="back" onClick={() => navigate(to)}>
      ← Back
    </button>
  );
}

export default BackButton;
