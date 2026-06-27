/**
 * Shown while `waiting`: the OK-gated pause after the C0 prologue. The kids go
 * find the treasure chest and carry it into the living room; once it stands in
 * front of the sofa a grown-up presses OK/Enter on the remote and Coco reveals
 * the four locks. The remote handling lives in `useRemote` (OK → continueShow);
 * this is just the on-screen cue so nobody wonders why the show is paused.
 */
export function WaitPrompt() {
  return (
    <div className="overlay overlay--bottom">
      <p className="prompt-text">
        🧰 Bringt die Schatztruhe ins Wohnzimmer — dann <strong>OK</strong> drücken! 🦜
      </p>
    </div>
  );
}
