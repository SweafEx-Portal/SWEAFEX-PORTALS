export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const PAT  = process.env.AIRTABLE_PAT;
  const BASE = process.env.AIRTABLE_BASE_ID;
  if (!PAT || !BASE) return res.status(500).json({ error: 'Missing credentials' });

  const tripId = req.query?.tripId ||
    new URL(req.url, 'http://x').searchParams.get('tripId') || '';

  console.log('STATUS: tripId =', tripId);
  if (!tripId) return res.status(400).json({ error: 'tripId required' });

  const url = `https://api.airtable.com/v0/${BASE}/StatusUpdates`;
  const params = new URLSearchParams({
    filterByFormula: `{TripID}="${tripId}"`,
    'sort[0][field]': 'Order',
    'sort[0][direction]': 'asc',
  });

  let response;
  try {
    response = await fetch(`${url}?${params}`, {
      headers: { Authorization: `Bearer ${PAT}` },
    });
  } catch (err) {
    console.error('STATUS: fetch failed', err.message);
    return res.status(500).json({ error: 'Could not reach Airtable' });
  }

  if (!response.ok) {
    const body = await response.text();
    console.error('STATUS: Airtable error', response.status, body);
    return res.status(500).json({ error: `Airtable ${response.status}` });
  }

  const data = await response.json();
  console.log('STATUS: records found =', data.records?.length);

  const stages = (data.records || []).map(r => ({
    Stage:     r.fields.Stage     || r.fields.stage     || '',
    Timestamp: r.fields.Timestamp || r.fields.TimeStamp || r.fields.timestamp || '',
    Done:      r.fields.Done      || false,
    Active:    r.fields.Active    || false,
    Order:     r.fields.Order     || 0,
  }));

  return res.json(stages);
}
