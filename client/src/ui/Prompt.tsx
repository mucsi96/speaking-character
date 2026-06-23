import { useShow } from '../store';

const COLORS = [
  { key: 'red', label: 'Rot', css: '#e23b3b' },
  { key: 'green', label: 'Grün', css: '#2ecc71' },
  { key: 'yellow', label: 'Gelb', css: '#f1c40f' },
  { key: 'blue', label: 'Blau', css: '#3498db' },
];

/**
 * Shown while waiting between scenes: tells the kids to press any colored
 * button on the remote to continue. Clickable too, for mouse-based testing.
 */
export function Prompt() {
  const advance = useShow((s) => s.advance);

  return (
    <div className="overlay overlay--bottom">
      <p className="prompt-text">Drücke eine bunte Taste auf der Fernbedienung!</p>
      <div className="color-buttons">
        {COLORS.map((c) => (
          <button
            key={c.key}
            className="color-button"
            style={{ background: c.css }}
            onClick={advance}
            aria-label={c.label}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
