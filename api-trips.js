export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const SCRIPT_URL = process.env.APPS_SCRIPT_URL;
  if (!SCRIPT_URL) return res.status(500).json({ error: 'Missing APPS_SCRIPT_URL' });

  const customerId = req.query?.customerId ||
    new URL(req.url, 'http://x').searchParams.get('customerId') || '';
  if (!customerId) return res.status(400).json({ error: 'customerId required' });

  try {
    const response = await fetch(`${SCRIPT_URL}?action=trips&customerId=${encodeURIComponent(customerId)}`);
    const data = await response.json();
    if (data.error) return res.status(500).json(data);
    return res.json(data);
  } catch (err) {
    console.error('trips error:', err.message);
    return res.status(500).json({ error: 'Could not reach backend' });
  }
}
