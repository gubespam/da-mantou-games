import './ToggleSlide.css';

function ToggleSlide({ checked, onChange, ariaLabel = 'Toggle option' }) {
  return (
    <button
      type="button"
      className={`toggle-slide${checked ? ' is-on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-slide-thumb" />
    </button>
  );
}

export default ToggleSlide;