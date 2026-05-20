export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const SCRIPT_URL = process.env.APPS_SCRIPT_URL;
  if (!SCRIPT_URL) return res.status(500).json({ error: 'Missing APPS_SCRIPT_URL' });

  const phone = req.query?.phone ||
    new URL(req.url, 'http://x').searchParams.get('phone') || '';
  const clean = phone.replace(/\D/g, '').slice(-10);
  if (!clean || clean.length < 10) return res.status(400).json({ error: 'Invalid phone' });

  try {
    const response = await fetch(`${SCRIPT_URL}?action=customer&phone=${clean}`);
    const data = await response.json();
    if (data.error) return res.status(404).json(data);
    return res.json(data);
  } catch (err) {
    console.error('customer error:', err.message);
    return res.status(500).json({ error: 'Could not reach backend' });
  }
}
