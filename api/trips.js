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

    // Parse Google Drive links from comma-separated strings
    const parseLinks = (val) => {
      if (!val || val === '') return [];
      return String(val).split(/[,\n]+/)
        .map(s => s.trim())
        .filter(s => s.startsWith('http'))
        .map(url => ({
          url: driveViewUrl(url),
          filename: 'View file'
        }));
    };

    const driveViewUrl = (url) => {
      // Convert Google Drive share link to direct view URL
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/view`;
      return url;
    };

    const trips = data.map(t => ({
      ...t,
      Photos:  parseLinks(t.Photos),
      POD:     parseLinks(t.POD),
      Invoice: parseLinks(t.Invoice),
    }));

    return res.json(trips);
  } catch (err) {
    console.error('trips error:', err.message);
    return res.status(500).json({ error: 'Could not reach backend' });
  }
}
