import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-API-Key'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const OPENAQ_API_KEY = process.env.VITE_OPENAQ_API_KEY;
    
    if (!OPENAQ_API_KEY) {
      return res.status(500).json({ error: 'OpenAQ API key not configured' });
    }

    // Forward the request to OpenAQ
    const response = await fetch(url, {
      headers: {
        'X-API-Key': OPENAQ_API_KEY,
      },
    });

    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
}
