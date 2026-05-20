export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const SCRIPT_URL = process.env.APPS_SCRIPT_URL;
  if (!SCRIPT_URL) return res.status(500).json({ error: 'Missing APPS_SCRIPT_URL' });

  const tripId = req.query?.tripId ||
    new URL(req.url, 'http://x').searchParams.get('tripId') || '';
  if (!tripId) return res.status(400).json({ error: 'tripId required' });

  try {
    const response = await fetch(`${SCRIPT_URL}?action=status&tripId=${encodeURIComponent(tripId)}`);
    const data = await response.json();
    if (data.error) return res.status(500).json(data);
    return res.json(data);
  } catch (err) {
    console.error('status error:', err.message);
    return res.status(500).json({ error: 'Could not reach backend' });
  }
}
