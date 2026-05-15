export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { customerId, customerName, from, to, size, vtype, weight, cargo, date, notes } = req.body;
  if (!from || !to || !date) return res.status(400).json({ error: 'From, To, and Date are required' });

  const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Enquiries`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        CustomerID:   customerId   || '',
        CustomerName: customerName || '',
        From:         from,
        To:           to,
        VehicleSize:  size         || '',
        VehicleType:  vtype        || '',
        Weight:       weight       ? Number(weight) : null,
        Cargo:        cargo        || '',
        LoadingDate:  date,
        Notes:        notes        || '',
        Status:       'New',
        SubmittedAt:  new Date().toISOString(),
      },
    }),
  });

  if (!response.ok) return res.status(500).json({ error: 'Failed to save enquiry' });
  const data = await response.json();
  return res.status(201).json({ id: data.id, message: 'Enquiry submitted' });
}
