import express, { type Request, type Response } from 'express';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  allSpeechFor,
  getState,
  loadState,
  sanitizeScript,
  sanitizeShow,
  setScript,
  setShow,
  subscribe,
  type AppState,
} from './state.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT ?? 3000);
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? '';
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? '';
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID ?? 'eleven_multilingual_v2';
const CACHE_DIR = resolve(process.env.CACHE_DIR ?? join(process.cwd(), 'cache'));

// Static client build. In the Docker image the client lives next to the server
// dist; in local dev it is built into ../../client/dist relative to this file.
const CLIENT_DIST = resolve(
  process.env.CLIENT_DIST ?? join(__dirname, '../../client/dist')
);

const app = express();
app.use(express.json({ limit: '256kb' }));

/** Origin id of the client that made a write, so it can ignore its own echo. */
function originOf(req: Request): string | null {
  const fromBody = req.body?.origin;
  if (typeof fromBody === 'string' && fromBody) return fromBody;
  const header = req.header('x-client-id');
  return header ?? null;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function healthHandler(_req: Request, res: Response): void {
  res.json({ status: 'ok', voiceConfigured: Boolean(ELEVENLABS_VOICE_ID && ELEVENLABS_API_KEY) });
}

/** Thrown when ElevenLabs responds with a non-OK status. */
class TtsUpstreamError extends Error {
  constructor(public status: number, public detail: string) {
    super(`ElevenLabs error ${status}`);
    this.name = 'TtsUpstreamError';
  }
}

/** Cache path for a line, keyed by a hash of (voice + model + text). */
function cachePathFor(text: string): string {
  const hash = createHash('sha256')
    .update(`${ELEVENLABS_VOICE_ID}:${ELEVENLABS_MODEL_ID}:${text}`)
    .digest('hex');
  return join(CACHE_DIR, `${hash}.mp3`);
}

/**
 * Return the MP3 for `text`, generating it via ElevenLabs and caching it on disk
 * on a miss. `cached` reports whether the result came from the disk cache.
 */
async function synthesize(text: string): Promise<{ audio: Buffer; cached: boolean }> {
  const cachePath = cachePathFor(text);
  if (await fileExists(cachePath)) {
    return { audio: await readFile(cachePath), cached: true };
  }

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(ELEVENLABS_VOICE_ID)}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '');
    throw new TtsUpstreamError(upstream.status, detail);
  }

  const audio = Buffer.from(await upstream.arrayBuffer());
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cachePath, audio);
  return { audio, cached: false };
}

/**
 * Warm the disk cache for every line up front so the live show never waits on
 * ElevenLabs. Runs sequentially in the background and logs progress so the
 * warm-up can be followed in the server logs.
 */
async function runPrecache(texts: string[]): Promise<void> {
  const total = texts.length;
  let cachedCount = 0;
  let generatedCount = 0;
  let failedCount = 0;

  console.log(`[precache] starting warm-up of ${total} clip(s)`);
  for (let i = 0; i < total; i++) {
    const text = texts[i];
    const position = `${i + 1}/${total}`;
    const preview = text.length > 60 ? `${text.slice(0, 57)}...` : text;
    try {
      const { cached } = await synthesize(text);
      if (cached) cachedCount++;
      else generatedCount++;
      console.log(
        `[precache] ${position} ${cached ? 'already cached' : 'generated'}: "${preview}"`
      );
    } catch (err) {
      failedCount++;
      const reason = err instanceof Error ? err.message : String(err);
      console.error(`[precache] ${position} FAILED (${reason}): "${preview}"`);
    }
  }
  console.log(
    `[precache] finished: ${total} total, ${cachedCount} already cached, ` +
      `${generatedCount} generated, ${failedCount} failed`
  );
}

// Serve the show script (German text + codes) to the client. Kept for backwards
// compatibility; new clients use `GET /api/state` which also carries show state.
app.get('/api/script', (_req: Request, res: Response) => {
  res.json(getState().script);
});

// Full app state: the script plus the live show progress (phase + sceneIndex).
app.get('/api/state', (_req: Request, res: Response) => {
  res.json(getState());
});

// Replace the script. Validates the payload, persists + broadcasts the change,
// then re-warms the TTS cache for the new lines in the background.
app.put('/api/state/script', async (req: Request, res: Response) => {
  try {
    const script = sanitizeScript(req.body?.script);
    const next = await setScript(script, originOf(req));
    res.json({ ok: true, rev: next.rev });
    if (ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID) {
      void runPrecache(allSpeechFor(script));
    }
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid script.' });
  }
});

// Drive the show: set the current phase / scene. Used by the admin UI to update
// the screen on the fly, and by the display to report its own progress.
app.put('/api/state/show', async (req: Request, res: Response) => {
  try {
    const show = sanitizeShow(req.body?.show);
    const next = await setShow(show, originOf(req));
    res.json({ ok: true, rev: next.rev });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid show state.' });
  }
});

// Server-Sent Events stream: pushes the full state to every connected client on
// connect and on every change, so the display and admin UI update live.
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Disable proxy buffering (e.g. nginx) so events flush immediately.
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 3000\n\n');

  const send = (state: AppState, origin: string | null) => {
    res.write(`data: ${JSON.stringify({ state, origin })}\n\n`);
  };

  send(getState(), null); // initial snapshot
  const unsubscribe = subscribe(({ state, origin }) => send(state, origin));
  // Comment ping keeps idle connections (and intermediaries) from timing out.
  const keepAlive = setInterval(() => res.write(': ping\n\n'), 25_000);

  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
});

// `/health` is what the node_app Helm chart probes (liveness/startup); `/healthz`
// is kept for backwards compatibility with the local/dev manifests.
app.get('/health', healthHandler);
app.get('/healthz', healthHandler);

// Minimal Prometheus exposition for the chart's ServiceMonitor (`/metrics`).
app.get('/metrics', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(
    [
      '# HELP nodejs_up Whether the speaking-character server is up.',
      '# TYPE nodejs_up gauge',
      'nodejs_up 1',
      '# HELP process_uptime_seconds Process uptime in seconds.',
      '# TYPE process_uptime_seconds gauge',
      `process_uptime_seconds ${process.uptime().toFixed(0)}`,
      '',
    ].join('\n')
  );
});

/**
 * Text-to-speech proxy. Keeps the ElevenLabs API key server-side and caches the
 * generated MP3 on disk keyed by a hash of (text + voice + model), so repeated
 * scenes never hit the API twice.
 */
app.post('/api/tts', async (req: Request, res: Response) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) {
    res.status(400).json({ error: 'Missing "text" in request body.' });
    return;
  }
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
    res.status(503).json({
      error:
        'ElevenLabs is not configured. Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID.',
    });
    return;
  }

  try {
    const { audio, cached } = await synthesize(text);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Cache', cached ? 'HIT' : 'MISS');
    res.send(audio);
  } catch (err) {
    if (err instanceof TtsUpstreamError) {
      console.error(`ElevenLabs error ${err.status}: ${err.detail}`);
      res.status(502).json({ error: 'TTS upstream failed.', status: err.status });
      return;
    }
    console.error('TTS request failed:', err);
    res.status(500).json({ error: 'Internal error generating speech.' });
  }
});

// Serve the built client and fall back to index.html for SPA routing.
app.use(express.static(CLIENT_DIST));
app.get('*', async (_req: Request, res: Response) => {
  const indexHtml = join(CLIENT_DIST, 'index.html');
  if (await fileExists(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res
      .status(404)
      .send('Client build not found. Run "npm run build" before starting the server.');
  }
});

// Load the persisted state (script + show progress) before serving, then start.
await loadState();

app.listen(PORT, () => {
  console.log(`speaking-character server listening on :${PORT}`);
  console.log(`  client dist: ${CLIENT_DIST}`);
  console.log(`  cache dir:   ${CACHE_DIR}`);
  console.log(`  voice:       ${ELEVENLABS_VOICE_ID || '(not set)'}`);
  console.log(`  model:       ${ELEVENLABS_MODEL_ID}`);

  // Pre-render every line on startup so the live show is smooth. Runs in the
  // background; the server is already accepting requests while it warms up.
  if (ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID) {
    void runPrecache(allSpeechFor(getState().script));
  } else {
    console.log('[precache] skipped: ElevenLabs not configured');
  }
});
