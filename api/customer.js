export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'Phone required' });

  const clean = phone.replace(/\D/g, '').slice(-10);

  const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Customers`;
  const filter = `OR({Phone}="${clean}", {Phone}="+91${clean}", {Phone}="091${clean}")`;

  const response = await fetch(`${url}?filterByFormula=${encodeURIComponent(filter)}`, {
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
  });

  if (!response.ok) return res.status(500).json({ error: 'Database error' });

  const data = await response.json();
  if (!data.records || data.records.length === 0) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const f = data.records[0].fields;
  return res.json({
    id:      f.CustomerID || data.records[0].id,
    name:    f.Name    || '',
    company: f.Company || '',
    phone:   f.Phone   || '',
    email:   f.Email   || '',
  });
}
