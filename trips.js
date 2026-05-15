export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { customerId } = req.query;
  if (!customerId) return res.status(400).json({ error: 'customerId required' });

  const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Trips`;
  const params = new URLSearchParams({
    filterByFormula: `{CustomerID}="${customerId}"`,
    'sort[0][field]': 'Date',
    'sort[0][direction]': 'desc',
  });

  const response = await fetch(`${url}?${params}`, {
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
  });

  if (!response.ok) return res.status(500).json({ error: 'Database error' });

  const data = await response.json();

  const trips = (data.records || []).map(r => {
    const f = r.fields;
    return {
      id:           r.id,
      TripID:       f.TripID       || '',
      CustomerID:   f.CustomerID   || '',
      From:         f.From         || '',
      To:           f.To           || '',
      Date:         f.Date         || '',
      Cargo:        f.Cargo        || '',
      Vehicle:      f.Vehicle      || '',
      VehicleType:  f.VehicleType  || '',
      Weight:       f.Weight       || '',
      Driver:       f.Driver       || '',
      DriverPhone:  f.DriverPhone  || '',
      Status:       f.Status       || 'Pending',
      CurrentStage: f.CurrentStage || 0,
      TotalStages:  f.TotalStages  || 9,
      Rate:         f.Rate         || 0,
      Advance:      f.Advance      || 0,
      Balance:      f.Balance      || 0,
      Rating:       f.Rating       || 0,
      Photos:       f.Photos       || [],
      POD:          f.POD          || [],
      Invoice:      f.Invoice      || [],
    };
  });

  return res.json(trips);
}
