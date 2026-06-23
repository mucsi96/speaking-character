# 3D Models

Place the two GLB assets here. They are **not** committed (large binaries) and
the app falls back to procedural placeholders if they are missing.

| File                 | Source                                                                                          | License |
| -------------------- | ----------------------------------------------------------------------------------------------- | ------- |
| `pirate-parrot.glb`  | "Pirate Parrot" by Lautaro Masseroni — https://sketchfab.com/3d-models/pirate-parrot-7b0cc05bac3e47629ba96cbac25e78c9 | CC BY   |
| `island.glb`         | island from "pirate parrots" — https://sketchfab.com/3d-models/pirate-parrots-9f2071086f9844d08a5a98813e9cfab6        | verify before use |

## How to add them

1. Open the Sketchfab page, click **Download 3D Model**, choose
   **glTF / GLB (.glb)**.
2. Rename to `pirate-parrot.glb` / `island.glb` and drop them in this folder.
3. Restart `npm run dev` (or rebuild). The real models replace the placeholders.

> **Attribution:** both models are CC BY — keep the author credit shown in the
> app footer and in the project README. Confirm the island model's exact license
> on download; if it is not redistributable, substitute a free island asset.
