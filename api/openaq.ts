import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, validateUpstreamUrl } from './_middleware/index';

const ALLOWED_HOSTS = [/^api\.openaq\.org$/i, /^.*\.openaq\.org$/i];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) {
    return;
  }

  try {
    const { url } = req.query;
    const validation = validateUpstreamUrl(url, ALLOWED_HOSTS);

    if (!validation.valid || !validation.url) {
      return res.status(400).json({
        error: validation.error || 'Invalid OpenAQ URL parameter',
      });
    }

    const OPENAQ_API_KEY = process.env.VITE_OPENAQ_API_KEY || process.env.OPENAQ_API_KEY;

    if (!OPENAQ_API_KEY) {
      return res.status(500).json({ error: 'OpenAQ API key is not configured on server' });
    }

    // Forward request with edge timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(validation.url, {
      headers: {
        'X-API-Key': OPENAQ_API_KEY,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('[OpenAQ Proxy Error]:', error);
    const isTimeout = error.name === 'AbortError';
    return res.status(isTimeout ? 504 : 500).json({
      error: isTimeout ? 'Gateway Timeout fetching OpenAQ' : error.message || 'OpenAQ Proxy Failure',
    });
  }
}
