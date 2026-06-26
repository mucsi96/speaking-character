import { FormEvent, useEffect, useRef, useState } from 'react';
import { useShow } from '../store';

/**
 * Shown while `entering`: a single-digit code field the kids fill in with the
 * remote's number buttons, then confirm with OK/Enter (or the on-screen button)
 * to have Käpten Coco check it. webOS sends the number buttons as ordinary
 * digit key events, so they type straight into the focused input.
 */
export function CodeInput() {
  const submitCode = useShow((s) => s.submitCode);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the field focused so remote key presses always land in it.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value === '') return;
    submitCode(value);
    setValue('');
  };

  return (
    <form className="overlay overlay--bottom" onSubmit={onSubmit}>
      <p className="prompt-text">Gib den geheimen Code ein und drücke OK!</p>
      <div className="code-row">
        <input
          ref={inputRef}
          className="code-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          autoFocus
          aria-label="Geheimer Code"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 1))}
        />
        <button type="submit" className="start-button">
          Prüfen
        </button>
      </div>
    </form>
  );
}
