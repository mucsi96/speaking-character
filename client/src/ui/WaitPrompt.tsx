/**
 * Shown while `waiting`: any codeless, OK-gated scene. Coco has finished
 * speaking (the C0 chest-fetch prologue, a lock's unlock celebration or a
 * break) and the show holds until a grown-up presses OK/Enter on the remote —
 * so the crew can change rooms, carry the chest or take a snack at their own
 * pace. The remote handling lives in `useRemote` (OK → continueShow); this is
 * just the on-screen cue so nobody wonders why the show is paused.
 */
export function WaitPrompt() {
  return (
    <div className="overlay overlay--bottom">
      <p className="prompt-text">
        Wenn ihr bereit seid, drückt <strong>OK</strong>! 🦜
      </p>
    </div>
  );
}
