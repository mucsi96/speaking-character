# speaking-character 🦜

A talking cartoon **pirate parrot** that hosts a kids' birthday **Schatzsuche**
(treasure hunt). Built with **react-three-fiber** + TypeScript on the front end
and a small **Node/Express** back end that proxies **ElevenLabs** German
text-to-speech. Designed to run full-screen on an **LG webOS smart TV** and be
driven by the remote's colored buttons.

## How the show works

1. **Start** (click or remote OK) → the parrot appears on its island.
2. Coco speaks a short German **lead-in** before each challenge — he sets the
   scene but **never explains the task itself**: the actual puzzle is printed on
   the challenge's **printable sheet**. Then a **code field** appears.
3. The kids solve the printed task, find its secret number in the real world and
   press it on the remote's **number buttons** — it's checked the instant they
   press it.
4. Right code → Coco **celebrates** and **navigates to the next challenge**.
   Wrong code → Coco **shakes his head** and they try again.
5. Repeats through all challenges until the treasure is found.

Each challenge scene has a single-digit `code` — hide the matching number as a
physical clue in your play area.

## Admin UI & live state

The server owns the script **and** the live show state (current phase + scene)
and persists both to a JSON file (`STATE_FILE`, default `./data/state.json`),
seeded on first run from [`server/src/scenes.ts`](server/src/scenes.ts).

Open **`/admin`** (e.g. http://localhost:5173/admin in dev) to:

- **Edit the script** on the fly — scene text, single-digit codes, and the
  random praise / "try again" lines — then **Save**.
- **Drive the screen** live — jump to any scene or set the phase (start screen,
  speaking, code entry, celebrate, reject, end).

Changes are pushed to every connected client over **Server-Sent Events**
(`GET /api/events`), so the TV display updates **without reloading**. Saving a
script also re-warms the TTS cache for the new lines in the background.

**Reload behaviour:** if the TV display is reloaded it always shows the
**Start / Weiter (resume)** screen first — a deliberate gate (the OK press is
also what unlocks audio in the TV browser). *Start* begins from scene 1;
*Weiter* resumes from the scene the server last saved. Only after that gesture
does the display follow the admin's live show-state changes.

State is read over `GET /api/state` (`{ script, show, rev }`); `GET /api/script`
is kept for backwards compatibility. The server still pre-renders all TTS on
startup (see below).

## Parent guide (`/script`)

The printable host's playbook — *"Coco & die 4 Schlösser"*, the bilingual
treasure-hunt guide (originally a hand-written static `script.html`) — is a
**dynamic page at `/script`** (e.g. http://localhost:5173/script in dev).

Its content lives as a **structured markdown directory** under
[`client/src/script/content/`](client/src/script/content):

```
content/
  index.md              # hero, top nav, footer
  sections/             # overview, secret codes, game flow, TV script, printables intro
  challenges/<id>/      # one folder per challenge (c1 … c13):
                        #   challenge.md  — Coco's lead-in + parent notes
                        #   <sheet>.md    — its printable cut-out(s)
```

The challenges are a **flat list** — there are no zone folders. The hunt's four
colored locks ride along as metadata on the challenge that **opens** each
(`lock:` — header + Coco's intro); a `break:` scene sits between locks. The kids
set each lock's dials digit by digit as they solve its challenges, so there is
no separate unlock scene — Coco's praise on the final digit is the celebration.
Coco's lead-in sets the scene but never poses the task; the puzzle lives
entirely on the challenge's printable sheet in the same folder.

Each file is YAML frontmatter (structured data) plus a markdown body (prose).
The files are bundled at build time (`import.meta.glob`) and rendered by React
components in [`client/src/script/`](client/src/script) that reuse the original
look & feel (see `script.css`). To change task text, codes, hints or printables,
edit the markdown — no component changes needed. The route is lazy-loaded, so
its bundle and parchment styles never reach the TV display or `/admin`.

## Project layout

```
client/   React + react-three-fiber app (Vite); /script renders the parent guide from client/src/script/content/
server/   Express server: /api/tts proxy + serves the built client
scripts/  Deployment & local smoke-test helpers (deploy.sh, pod_up.sh, …)
test/     Local container smoke-test pod manifest
Dockerfile
```

## Local development

```bash
cp .env.example .env        # add your ElevenLabs key + voice id
npm install                 # installs all workspaces
npm run dev                 # client on :5173, server on :3000 (proxied)
```

In dev the server runs in **ephemeral mode** (`EPHEMERAL_STATE=1`, set by its
`dev` script): it never reads or writes `data/state.json`, so the script is
always seeded fresh from the markdown content and a restart reflects the latest
edits. Runtime admin changes live only in memory. (Production — `npm start` —
persists to `STATE_FILE` as before.)

Open http://localhost:5173. Without ElevenLabs configured the visuals still
work; narration just won't play.

The parrot is a Blender model, [`client/public/models/coco.glb`](client/public/models),
loaded with `useGLTF`. Its `jaw_close` and `wings_down` shape keys are driven by
the narration amplitude for lip-sync and wing flapping (see
[`client/src/three/Parrot.tsx`](client/src/three/Parrot.tsx)). The island is
built from geometry primitives in [`client/src/three/`](client/src/three).

## ElevenLabs / voice

The server holds the API key (never the browser). Configure via env:

| Variable              | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `ELEVENLABS_API_KEY`  | Your API key (required)                                  |
| `ELEVENLABS_VOICE_ID` | A German-capable voice (required)                        |
| `ELEVENLABS_MODEL_ID` | `eleven_multilingual_v2` (default) or `eleven_flash_v2_5` |

Generated MP3s are cached on disk (`CACHE_DIR`) keyed by text+voice+model, so
each line is only synthesized once.

**Startup cache preheat.** ElevenLabs has noticeable latency the first time a
line is synthesized. To keep the live show smooth, the server pre-renders every
line it can speak (scene tasks plus the random correct/wrong reactions, see
`allSpeech` in [`server/src/scenes.ts`](server/src/scenes.ts)) **on startup** —
sequentially, so ElevenLabs isn't hammered — and logs progress to its console:

```
[precache] starting warm-up of 11 clip(s)
[precache] 1/11 generated: "Ahoi, ihr tapferen kleinen Piraten! Ich bin Käpten..."
...
[precache] finished: 11 total, 4 already cached, 7 generated, 0 failed
```

By the time the show runs, every line is a cache HIT with no ElevenLabs latency.
The warm-up runs in the background, so the server starts serving immediately; if
ElevenLabs isn't configured it's skipped with a log line.

## Production build & Docker

```bash
npm run build
docker build -t speaking-character .
docker run -p 8080:8080 --env-file .env speaking-character
# → http://localhost:8080
```

The container listens on `8080` and exposes `/health` (probe) and `/metrics`.

### Local container smoke test

Builds the image and runs it as a pod with Podman, then waits for `/health`:

```bash
scripts/pod_up.sh     # build + run, polls http://localhost:8080/health
scripts/pod_down.sh   # tear down
```

## Kubernetes

The app is deployed with the reusable
[`node-app`](https://github.com/mucsi96/k8s-helm-charts#node_app) Helm chart,
following the same pattern as
[skeleton-app](https://github.com/mucsi96/skeleton-app): images are published to
Docker Hub by the CI pipeline and rolled out by [`scripts/deploy.sh`](scripts/deploy.sh).

```bash
scripts/deploy.sh
```

`deploy.sh` pulls the kubeconfig and runtime secrets from Azure Key Vault, then
runs `helm upgrade --install speaking-character mucsi96/node-app` with the latest
published image. It expects these environment variables (provided by the
pipeline) and Key Vault secrets:

| Source        | Name                                         | Purpose                                  |
| ------------- | -------------------------------------------- | ---------------------------------------- |
| Env           | `AZURE_KEYVAULT_NAME`                         | Key Vault holding deploy config          |
| Env           | `DOCKERHUB_USERNAME`                          | Docker Hub namespace for the image       |
| Key Vault     | `k8s-config`                                  | Cluster kubeconfig                       |
| Key Vault     | `hostname`                                    | Public host for the HTTPRoute            |
| Key Vault     | `api-client-id`                               | Azure workload-identity client id        |
| Key Vault     | `elevenlabs-api-key` / `elevenlabs-voice-id`  | ElevenLabs credentials                   |

### Persistent audio cache

The ElevenLabs MP3 cache (`CACHE_DIR=/app/cache`) is backed by a
`PersistentVolumeClaim` so it survives redeploys and image upgrades — without it
every rollout would start with an empty cache and re-synthesize the whole show
against ElevenLabs on the next warm-up. `deploy.sh` provisions one claim via the
`node-app` chart's `persistentVolumeClaims` value (chart `>= 19.0.0`):

| Field              | Value             |
| ------------------ | ----------------- |
| `name`             | `party-pvc`       |
| `accessMode`       | `ReadWriteOnce`   |
| `volumeName`       | `party-app`       |
| `mountPath`        | `/app/cache`      |
| `storageClassName` | `""` (static)     |
| `storage`          | `1Gi`             |

The empty `storageClassName` plus `volumeName` statically bind the claim to the
pre-provisioned `party-app` PersistentVolume (no dynamic provisioning).

The whole flow (smoke test → publish image → deploy) runs automatically on push
to `main` via [`.github/workflows/pipeline.yml`](.github/workflows/pipeline.yml).

Open the deployed host in the LG TV browser; press OK to start and use the
number buttons to enter each task's secret code.

## On the TV remote

**Enter/OK** starts the show (and restarts it at the end). Between scenes a
**number button (0–9)** enters the secret code, which the parrot checks the
moment it's pressed.

## Credits

- 3D model generation by **[Tripo AI](https://www.tripo3d.ai/)** — the textured
  parrot mesh was created from a colored reference image with its Image-to-3D
  workflow (see [`MODEL.md`](MODEL.md)).
- Voice synthesis by **ElevenLabs**.
