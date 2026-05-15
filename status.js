export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { tripId } = req.query;
  if (!tripId) return res.status(400).json({ error: 'tripId required' });

  const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/StatusUpdates`;
  const params = new URLSearchParams({
    filterByFormula: `{TripID}="${tripId}"`,
    'sort[0][field]': 'Order',
    'sort[0][direction]': 'asc',
  });

  const response = await fetch(`${url}?${params}`, {
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
  });

  if (!response.ok) return res.status(500).json({ error: 'Database error' });

  const data = await response.json();

  const stages = (data.records || []).map(r => ({
    Stage:     r.fields.Stage     || '',
    Timestamp: r.fields.Timestamp || '',
    Done:      r.fields.Done      || false,
    Active:    r.fields.Active    || false,
    Order:     r.fields.Order     || 0,
  }));

  return res.json(stages);
}
