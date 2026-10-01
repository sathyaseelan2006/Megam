import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface MiddlewareContext {
  validatedUrl?: string;
}

export type ServerlessHandler = (
  req: VercelRequest,
  res: VercelResponse,
  ctx: MiddlewareContext
) => Promise<void | VercelResponse>;

export function applyCors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Key'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // handled preflight
  }
  return false;
}

export function validateUpstreamUrl(
  urlParam: unknown,
  allowedHostPatterns: RegExp[]
): { valid: boolean; url?: string; error?: string } {
  if (!urlParam || typeof urlParam !== 'string') {
    return { valid: false, error: 'URL parameter is required and must be a string' };
  }

  try {
    const parsed = new URL(urlParam);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, error: 'Invalid URL protocol' };
    }

    const hostMatches = allowedHostPatterns.some((pattern) => pattern.test(parsed.hostname));
    if (!hostMatches) {
      return { valid: false, error: `Host ${parsed.hostname} is not allowed for proxying` };
    }

    return { valid: true, url: parsed.toString() };
  } catch {
    return { valid: false, error: 'Malformed URL provided' };
  }
}
