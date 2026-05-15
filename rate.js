export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { tripId, rating } = req.body;
  if (!tripId || !rating) return res.status(400).json({ error: 'tripId and rating required' });

  const searchUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Trips`;
  const params = new URLSearchParams({ filterByFormula: `{TripID}="${tripId}"` });

  const search = await fetch(`${searchUrl}?${params}`, {
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
  });

  const searchData = await search.json();
  if (!searchData.records || searchData.records.length === 0) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  const recordId = searchData.records[0].id;

  const update = await fetch(`${searchUrl}/${recordId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: { Rating: Number(rating) } }),
  });

  if (!update.ok) return res.status(500).json({ error: 'Failed to save rating' });
  return res.json({ message: 'Rating saved' });
}
