import { useEffect, useRef, useState } from 'react';
import { useShow } from '../store';

/**
 * Shown while `entering`: a single-digit code field the kids fill in with the
 * remote's number buttons. The code is one digit, so we validate the instant a
 * number is pressed — no separate confirm/OK step. webOS sends the number
 * buttons as ordinary digit key events, so they type straight into the focused
 * input.
 */
export function CodeInput() {
  const submitCode = useShow((s) => s.submitCode);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the field focused so remote key presses always land in it.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="overlay overlay--bottom">
      <p className="prompt-text">Drücke den geheimen Code auf der Fernbedienung!</p>
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
        onChange={(e) => {
          const digit = e.target.value.replace(/\D/g, '').slice(-1);
          setValue(digit);
          // Single-digit code: check it as soon as a number is pressed.
          if (digit) submitCode(digit);
        }}
      />
    </div>
  );
}
