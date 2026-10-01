import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, validateUpstreamUrl } from './_middleware/index';

const ALLOWED_HOSTS = [
  /^power\.larc\.nasa\.gov$/i,
  /^appeears\.earthdatacloud\.nasa\.gov$/i,
  /^api\.nasa\.gov$/i,
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) {
    return;
  }

  try {
    const { url } = req.query;
    const validation = validateUpstreamUrl(url, ALLOWED_HOSTS);

    if (!validation.valid || !validation.url) {
      return res.status(400).json({
        error: validation.error || 'Invalid NASA URL parameter',
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(validation.url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('[NASA Proxy Error]:', error);
    const isTimeout = error.name === 'AbortError';
    return res.status(isTimeout ? 504 : 500).json({
      error: isTimeout ? 'Gateway Timeout fetching NASA API' : error.message || 'NASA Proxy Failed',
    });
  }
}
