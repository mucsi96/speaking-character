import express, { type Request, type Response } from 'express';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
app.use(express.json({ limit: '64kb' }));

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

  const hash = createHash('sha256')
    .update(`${ELEVENLABS_VOICE_ID}:${ELEVENLABS_MODEL_ID}:${text}`)
    .digest('hex');
  const cachePath = join(CACHE_DIR, `${hash}.mp3`);

  try {
    if (await fileExists(cachePath)) {
      const cached = await readFile(cachePath);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('X-Cache', 'HIT');
      res.send(cached);
      return;
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
      console.error(`ElevenLabs error ${upstream.status}: ${detail}`);
      res.status(502).json({ error: 'TTS upstream failed.', status: upstream.status });
      return;
    }

    const audio = Buffer.from(await upstream.arrayBuffer());
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(cachePath, audio);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Cache', 'MISS');
    res.send(audio);
  } catch (err) {
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

app.listen(PORT, () => {
  console.log(`speaking-character server listening on :${PORT}`);
  console.log(`  client dist: ${CLIENT_DIST}`);
  console.log(`  cache dir:   ${CACHE_DIR}`);
  console.log(`  voice:       ${ELEVENLABS_VOICE_ID || '(not set)'}`);
  console.log(`  model:       ${ELEVENLABS_MODEL_ID}`);
});
