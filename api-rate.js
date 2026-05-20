export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SCRIPT_URL = process.env.APPS_SCRIPT_URL;
  if (!SCRIPT_URL) return res.status(500).json({ error: 'Missing APPS_SCRIPT_URL' });

  const { tripId, rating } = req.body;
  if (!tripId || !rating) return res.status(400).json({ error: 'tripId and rating required' });

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rating', tripId, rating }),
    });
    const data = await response.json();
    return res.json(data);
  } catch (err) {
    console.error('rating error:', err.message);
    return res.status(500).json({ error: 'Could not reach backend' });
  }
}
