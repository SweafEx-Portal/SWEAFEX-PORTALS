export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const PAT  = process.env.AIRTABLE_PAT;
  const BASE = process.env.AIRTABLE_BASE_ID;
  if (!PAT || !BASE) return res.status(500).json({ error: 'Missing Airtable credentials' });

  const customerId = req.query?.customerId ||
    new URL(req.url, 'http://x').searchParams.get('customerId') || '';
  if (!customerId) return res.status(400).json({ error: 'customerId required' });

  const url = `https://api.airtable.com/v0/${BASE}/Trips`;
  const params = new URLSearchParams({
    filterByFormula: `OR({Customer ID}="${customerId}",{CustomerID}="${customerId}")`,
    'sort[0][field]': 'Date',
    'sort[0][direction]': 'desc',
  });

  let response;
  try {
    response = await fetch(`${url}?${params}`, {
      headers: { Authorization: `Bearer ${PAT}` },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Could not reach Airtable' });
  }

  if (!response.ok) {
    const body = await response.text();
    console.error('Airtable trips error:', response.status, body);
    return res.status(500).json({ error: `Airtable returned ${response.status}` });
  }

  const data = await response.json();

  const trips = (data.records || []).map(r => {
    const f = r.fields;
    // Handle both "Field Name" (with space) and "FieldName" (no space) formats
    return {
      id:           r.id,
      TripID:       f['Trip ID']       || f['TripID']       || '',
      CustomerID:   f['Customer ID']   || f['CustomerID']   || '',
      CustomerName: f['Customer Name'] || f['CustomerName'] || '',
      From:         f['From']          || '',
      To:           f['To']            || '',
      Date:         f['Date']          || '',
      Cargo:        f['Cargo']         || '',
      Vehicle:      f['Vehicle']       || '',
      VehicleType:  f['Vehicle Type']  || f['VehicleType']  || '',
      Weight:       f['Weight']        || '',
      Driver:       f['Driver']        || '',
      DriverPhone:  f['Driver Phone']  || f['DriverPhone']  || '',
      Status:       f['Status']        || 'Pending',
      CurrentStage: f['Current Stage'] || f['CurrentStage'] || 0,
      TotalStages:  f['Total Stages']  || f['TotalStages']  || 9,
      Rate:         f['Rate']          || 0,
      Advance:      f['Advance']       || 0,
      Balance:      f['Balance']       || 0,
      Rating:       f['Rating']        || 0,
      Photos:       f['Photos']        || [],
      POD:          f['POD']           || [],
      Invoice:      f['Invoice']       || [],
    };
  });

  return res.json(trips);
}
