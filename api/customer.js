export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Check env variables are present
  const PAT = process.env.AIRTABLE_PAT;
  const BASE = process.env.AIRTABLE_BASE_ID;

  if (!PAT || !BASE) {
    console.error('Missing env vars:', { PAT: !!PAT, BASE: !!BASE });
    return res.status(500).json({ error: 'Server misconfigured — missing Airtable credentials' });
  }

  // Get phone from query — handle both ?phone=xxx formats
  const rawPhone = req.query?.phone || new URL(req.url, 'http://x').searchParams.get('phone') || '';
  if (!rawPhone) return res.status(400).json({ error: 'Phone required' });

  // Clean to last 10 digits
  const clean = rawPhone.replace(/\D/g, '').slice(-10);
  if (clean.length < 10) return res.status(400).json({ error: 'Invalid phone number' });

  const url = `https://api.airtable.com/v0/${BASE}/Customers`;
  const filter = `OR({Phone}="${clean}",{Phone}="+91${clean}",{Phone}="0${clean}")`;

  let response;
  try {
    response = await fetch(`${url}?filterByFormula=${encodeURIComponent(filter)}`, {
      headers: {
        Authorization: `Bearer ${PAT}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('Fetch to Airtable failed:', err.message);
    return res.status(500).json({ error: 'Could not reach Airtable' });
  }

  if (!response.ok) {
    const body = await response.text();
    console.error('Airtable error:', response.status, body);
    return res.status(500).json({ error: `Airtable returned ${response.status}` });
  }

  const data = await response.json();

  if (!data.records || data.records.length === 0) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const f = data.records[0].fields;
  return res.json({
    id:      f['Customer ID'] || f['CustomerID'] || data.records[0].id,
    name:    f['Name']    || '',
    company: f['Company'] || '',
    phone:   f['Phone']   || '',
    email:   f['Email'] || f['E Mail'] || '',
  });
}
