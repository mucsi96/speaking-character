# Animated Parrot — Model Creation Pipeline

A complete, beginner-friendly record of how this model was made, so you can
recreate a similar one (any creature) from scratch. Written for someone who is
**new to Blender** — every step says *where to click*, and every stage is
labelled with **how it was actually done**.

---

## How to read the labels

Each stage and step is tagged so you know what to repeat with MCP next time:

| Tag | Meaning |
|---|---|
| **[MCP]** | Done by **Claude Code driving Blender through the Blender MCP server**. This is what you will do with MCP again — you describe it in plain English and Claude runs the Blender Python for you. |
| **[MANUAL]** | Done **by hand in Blender's UI**. Either it can't be automated well (brush work) or it's a one-click add-on action. |
| **[EXTERNAL]** | Done **outside Blender** (the Tripo web app). |

> Many **[MANUAL]** steps below are *also* technically MCP-capable, but on this
> model they were hand-done — those are flagged inline. The big takeaway: on
> this project, **the rigging, the binding, the animation clips, and the export
> were all [MCP]**. The mesh creation, the bridge import, and the final
> weight-paint polish were not.

---

## 0. The pipeline at a glance

```
Colored image
     │
     ▼
[1] Tripo 3D ..................... [EXTERNAL]  AI generates a textured mesh
     │
     ▼
[2] Tripo DCC Bridge ............ [MANUAL]    Mesh imported into Blender
     │
     ▼
[3] Clean up the mesh ........... [MCP]       Apply transforms, center, orient
     │
     ▼
[4] Build the skeleton .......... [MCP]       Armature + bones via Claude Code
     │
     ▼
[5] Bind mesh to skeleton ....... [MCP]       Parent with automatic weights
     │
     ▼
[6] Fine-tune the rig ........... [MCP] + [MANUAL]
     │                                        bones/weights = MCP,
     │                                        weight-paint brush = MANUAL
     ▼
[7] Create animation clips ...... [MCP]       jaw_close, wings_down
     │
     ▼
[8] Export glTF (.glb) .......... [MCP]       NLA tracks as separate clips
```

---

## Reference: what THIS model ended up as

| Thing | Value |
|---|---|
| Blender version | 5.1.2 |
| Mesh object | `tripo_node_13246658` (2,162 verts) |
| Material | `tripo_mat_13246658.001` (from the AI texture) |
| Armature object | `Parrot_Rig` (data: `Parrot_Armature`) |
| Binding | one **Armature modifier** on the mesh |
| Frame rate | 24 fps |
| Animation clips | `jaw_close`, `wings_down` (1.0 s each, on NLA tracks) |

**Bone hierarchy** (parent → child):

```
root
└── spine
    ├── head
    │   └── jaw
    ├── wing.R
    └── wing.L
```

Each bone has a matching **vertex group** of the same name — that is how the
mesh knows which bone moves which vertices.

---

## ⚙️ Prerequisite for every [MCP] step: start the MCP server

**Nothing Claude Code does in Blender works until the MCP server is running.**
Do this once at the start of a session:

1. In Blender, make sure the **Blender MCP add-on** is enabled:
   **Edit → Preferences → Add-ons**, search for it, tick its checkbox.
2. In the 3D viewport press **N** to open the sidebar.
3. Find the **MCP** tab, click **Start Server**.
4. It now listens (default `localhost:9876`). Claude Code can read and edit your
   scene. If Claude says it "can't connect to Blender at localhost:9876", this
   server isn't running — go back to step 3.

> Keep Blender open and the server running the whole time you work with Claude.

---

## Blender survival kit (for the [MANUAL] bits)

You still need these for the hand-done steps.

- **Editor Type dropdown** — top-LEFT corner of every panel. Click it to turn a
  panel into the Timeline, Dope Sheet, NLA Editor, etc.
- **The N panel** — press **N** over the 3D viewport for a sidebar (also where
  the MCP "Start Server" button lives).
- **Switching modes** — top-LEFT of the viewport, the mode dropdown
  (*Object Mode* / **Edit Mode** / **Pose Mode** / **Weight Paint**). **Tab**
  toggles; **Ctrl+Tab** opens a pie menu. Pose Mode needs an **armature**
  selected; Weight Paint needs a **mesh**.
- **Select** = left-click. **All** = **A**. **None** = **Alt+A**.
- **Move / Rotate / Scale** = **G / R / S**, move mouse, left-click to confirm.
- **The Outliner** — top-right scene list. The **eye icon** hides/shows objects.
- **Undo** = **Ctrl+Z**. **Save** = **Ctrl+S** (save often!).

---

## [1] Generate the mesh in Tripo 3D — **[EXTERNAL]**

Done in the Tripo web app, not Blender.

1. Choose the **Image-to-3D** workflow.
2. Upload your **colored reference image** (subject facing forward, clean
   background works best).
3. Generate, pick the result, request the **textured** version (bakes the color
   image on as a material).
4. Keep the project for the bridge to pull in next.

> The AI gives you a *static* mesh only. Skeleton + animation are all added later
> in Blender (mostly via MCP).

---

## [2] Import with the Tripo DCC Bridge — **[MANUAL]**

A one-click Blender add-on action; done by hand.

1. Install once: **Edit → Preferences → Add-ons → Install…**, pick the bridge
   `.zip`, enable it.
2. Press **N** in the viewport → open the bridge's tab (or a "Tripo" menu),
   sign in if asked.
3. Find your model, click **Import**.
4. The textured mesh appears (here: `tripo_node_13246658`).

> Could this be MCP'd? Not really — it's the add-on's own button. So it stays
> manual.

---

## [3] Clean up the mesh — **[MCP]**

Apply transforms, center, and orient. Done by Claude Code via Python.

**Via MCP — what to ask Claude Code:**
> "Apply all transforms on the imported mesh, move it so its lowest point sits
> at the world origin, and make sure it faces +X (front view). Then show me a
> render to confirm."

What Claude runs under the hood: `bpy.ops.object.transform_apply(...)`, adjusts
location, and renders the viewport so you can eyeball it.

**Manual fallback (if you ever need it):** Object Mode → **Object → Apply → All
Transforms**; **G, Z** to move; **Numpad 1** for front view.

---

## [4] Build the skeleton — **[MCP]**

This is the core "rigged with MCP" step. Claude Code creates the armature, the
bones, the hierarchy, and the names — all in Blender's Python.

**Via MCP — what to ask Claude Code:**
> "Create an armature called `Parrot_Rig` for this mesh. Add bones with this
> hierarchy: `root` at the base → `spine` → `head` → `jaw`, plus `wing.R` and
> `wing.L` branching off `spine`. Position the jaw bone along the lower beak and
> each wing bone along its wing. Turn on 'In Front' so I can see them, and render
> a front view so I can check placement."

Tips for a good result:
- **Be specific about names** — Claude will reuse them as vertex-group names in
  the next step, and `.R` / `.L` enables mirroring.
- **Ask for a render** after, so you can verify bones sit inside the right body
  parts before binding.
- If a bone is off, just say *"move the jaw bone's tip down to the beak tip"* and
  Claude adjusts it.

**Manual fallback:** Add → Armature; **Edit Mode**; **E** to extrude bones;
rename each in the N panel → Item tab. (Slow and fiddly — MCP is much faster
here.)

---

## [5] Bind the mesh to the skeleton — **[MCP]**

Parent with automatic weights so each vertex follows the right bone(s).

**Via MCP — what to ask Claude Code:**
> "Parent the mesh to `Parrot_Rig` with automatic weights, then pose-test each
> bone a little and render so we can see the deformation."

Under the hood this is `parent_set(type='ARMATURE_AUTO')`, which also adds the
**Armature modifier** and fills the vertex groups.

**Manual fallback:** select mesh, Shift-select armature, **Ctrl+P → With
Automatic Weights**.

---

## [6] Fine-tune the rig — **[MCP] + [MANUAL]**

The iterative part. **Two of the three sub-steps are MCP; the final
weight-paint polish is manual.**

### 6a. Move / adjust bones — **[MCP]**
**Via MCP:**
> "The wing bone starts slightly outside the shoulder — move `wing.R`'s head to
> the shoulder joint and recalculate bone roll so it rotates cleanly. Render to
> confirm."

Claude edits bone head/tail positions and runs **Recalculate Roll** in Python.

### 6b. Reset the weights — **[MCP]**
**Via MCP:**
> "Re-bind the mesh to the armature with automatic weights to reset the weights
> from the new bone positions, then normalize all and clean the vertex groups."

Claude re-parents with auto weights and runs `vertex_group_normalize_all` /
`vertex_group_clean`.

### 6c. Weight-paint the fixes — **[MANUAL]**
This is the part you do **by hand**, because it's brush work that needs your eye.
(Claude *can* set numeric weights, but smoothing seams by feel is manual.)

1. Select the **mesh** → **Weight Paint** mode (Ctrl+Tab → Weight Paint). Mesh
   turns blue.
2. **Ctrl-click a bone** to choose whose influence you're painting.
3. Colors: **red = 1.0** (fully follows), **blue = 0.0** (ignores),
   green/yellow = partial.
4. Paint (left-drag). Set **Weight** (1.0 add / 0.0 remove) and a low
   **Strength** (0.1–0.3). Use the **Blur** brush to soften joint seams.
5. **Test:** jump to Pose Mode, rotate the bone, check the deform; jump back and
   fix. Repeat.

> Golden rule: each vertex's weights across all bones should sum to 1.0. If
> things look weird, ask Claude to **Normalize All** again (that part *is* MCP).

---

## [7] Create the animation clips — **[MCP]**

Both clips — **`jaw_close`** and **`wings_down`** — were authored by Claude Code
through MCP: keyframing the bones, then pushing each to its own NLA track so they
export as separate, named clips.

**Via MCP — what to ask Claude Code:**
> "Set the scene to 24 fps. Create an action `jaw_close` that keyframes the
> `jaw` bone from open at frame 0 to fully closed at frame 24. Create an action
> `wings_down` that keyframes `wing.R` and `wing.L` from up at frame 0 to down at
> frame 24. Each action should only touch its own bones. Push both to their own
> NLA tracks named after the action."

Why "only its own bones" matters: disjoint clips can be blended independently in
React Three Fiber (jaw driven by voice, wings on a separate channel) without
fighting each other.

**Preview — [MANUAL]:** press **Spacebar** to play. To watch one clip alone,
switch a panel's Editor Type to **Nonlinear Animation** and click the **solo
star** on that track.

---

## [8] Export for React Three Fiber (.glb) — **[MCP]**

**Via MCP — what to ask Claude Code:**
> "Export the scene as a GLB to `<path>` with materials and animation enabled,
> using Animation Mode = NLA Tracks so `jaw_close` and `wings_down` come out as
> two separate named clips."

Under the hood: `bpy.ops.export_scene.gltf(filepath=..., export_format='GLB',
export_animation_mode='NLA_TRACKS', ...)`.

> **The critical setting is Animation Mode = NLA Tracks.** Without it, your two
> clips get merged into one and you lose independent jaw/wing control in R3F.

**Manual fallback:** **File → Export → glTF 2.0**, set Format = glTF Binary,
Material = Export, Animation = on, **Animation Mode = NLA Tracks**, Export.

---

## Common beginner gotchas

- **"Claude can't connect to Blender."** The MCP server isn't running →
  N panel → MCP → **Start Server**.
- **"I rotate a bone and nothing moves."** You're in Object Mode or have the
  wrong object selected — bones pose in **Pose Mode** with the **armature**
  selected.
- **"A bone moves the wrong part of the mesh."** Weights problem → step 6.
- **"Only one animation after export."** Animation Mode wasn't **NLA Tracks** →
  step 8.
- **"Mesh explodes when posing."** Stray weights — ask Claude to Normalize All +
  Clean (6b), then hand-fix in weight paint (6c).
- **Save often.** **Ctrl+S**.

---

## Quick rebuild checklist (with tags)

- [ ] **[EXTERNAL]** Generate textured mesh in Tripo 3D from a colored image
- [ ] **[MANUAL]** Import via Tripo DCC Bridge
- [ ] **[MCP]** Start the MCP server (N panel → MCP → Start Server)
- [ ] **[MCP]** Apply transforms, center, face front
- [ ] **[MCP]** Build + name armature/bones (`root → spine → head → jaw`, `wing.R/L`)
- [ ] **[MCP]** Parent mesh to armature with automatic weights
- [ ] **[MCP]** Fine-tune: move bones, reset/normalize weights
- [ ] **[MANUAL]** Weight-paint the final deformation polish
- [ ] **[MCP]** Set 24 fps; author `jaw_close` and `wings_down`; push to NLA tracks
- [ ] **[MCP]** Export GLB with **Animation Mode = NLA Tracks**

---

## Appendix: working effectively with the Blender MCP server

A few habits that make the [MCP] steps go smoothly:

- **Always confirm the server is running first.** It's the #1 cause of "it's not
  working."
- **Ask Claude to render after big changes.** It can't see your screen — a
  render is how it (and you) verify bone placement and deformation.
- **Name things explicitly.** Bone names, action names, frame ranges. Precise
  names keep the rig, the vertex groups, and the exported clips all consistent.
- **Work in small, checkable steps.** "Build the bones, render" → "fix the wing,
  render" → "bind, pose-test, render" beats one giant request.
- **Keep weight-paint manual.** Let Claude reset/normalize weights, but do the
  final smoothing yourself in Weight Paint mode — it needs your eye.
- **Save the .blend yourself** (Ctrl+S) at milestones; MCP edits live in the
  open session.