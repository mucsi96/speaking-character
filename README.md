# speaking-character 🦜

A talking cartoon **pirate parrot** that hosts a kids' birthday **Schatzsuche**
(treasure hunt). Built with **react-three-fiber** + TypeScript on the front end
and a small **Node/Express** back end that proxies **ElevenLabs** German
text-to-speech. Designed to run full-screen on an **LG webOS smart TV** and be
driven by the remote's colored buttons.

## How the show works

1. **Start** (click or remote OK) → the parrot appears on its island.
2. It speaks a German **intro + first task**, then disappears.
3. A prompt asks the kids to press a **colored button** on the remote.
4. Any color button → the parrot reappears with the **next task**.
5. Repeats through all scenes until the treasure is found.

Edit the whole German script in [`client/src/scenes.ts`](client/src/scenes.ts).

## Project layout

```
client/   React + react-three-fiber app (Vite)
server/   Express server: /api/tts proxy + serves the built client
k8s/      Kubernetes manifests (Deployment, Service, Ingress, Secret)
Dockerfile
```

## Local development

```bash
cp .env.example .env        # add your ElevenLabs key + voice id
npm install                 # installs all workspaces
npm run dev                 # client on :5173, server on :3000 (proxied)
```

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

## Production build & Docker

```bash
npm run build
docker build -t speaking-character .
docker run -p 3000:3000 --env-file .env speaking-character
# → http://localhost:3000
```

## Kubernetes

```bash
# 1. Create the secret (don't commit real keys):
kubectl create secret generic speaking-character-secrets \
  --from-literal=ELEVENLABS_API_KEY=sk_xxx \
  --from-literal=ELEVENLABS_VOICE_ID=your_voice_id

# 2. Apply manifests (edit image + ingress host first):
kubectl apply -f k8s/
```

Open the ingress host in the LG TV browser; press OK to start and use the
colored buttons to advance.

## On the TV remote

webOS maps the colored buttons to key codes **403 (red), 404 (green),
405 (yellow), 406 (blue)** — any of them advances the show. **Enter/OK** starts
it.

## Credits

- Voice synthesis by **ElevenLabs**.
