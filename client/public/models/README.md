# 3D Models

## `coco.glb` — the talking parrot

Export your parrot from Blender as **glTF Binary (.glb)** and save it here as
`coco.glb`. It is committed to the repo and loaded at runtime from
`/models/coco.glb` by `client/src/three/Parrot.tsx`.

The model must expose these two **shape keys** (morph targets), used to drive the
animated speech:

| Shape key    | Drives                                                                 |
| ------------ | --------------------------------------------------------------------- |
| `jaw_close`  | Closes the beak. Base mesh is mouth-open, so the app sets it to `1 - mouthOpen` — beak rests closed and opens with the narration amplitude. |
| `wings_down` | Lowers the wings. Driven by a speech-energy envelope so the parrot flaps with rising excitement while it speaks, and settles when silent. |

> When exporting from Blender, make sure **Shape Keys** are enabled under the
> glTF export's *Mesh → Shape Keys* option, and keep the morph-target names
> exactly `jaw_close` and `wings_down`.
