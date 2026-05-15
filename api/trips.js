export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const PAT  = process.env.AIRTABLE_PAT;
  const BASE = process.env.AIRTABLE_BASE_ID;
  if (!PAT || !BASE) return res.status(500).json({ error: 'Missing credentials' });

  const customerId = req.query?.customerId ||
    new URL(req.url, 'http://x').searchParams.get('customerId') || '';

  console.log('TRIPS: customerId =', customerId);
  if (!customerId) return res.status(400).json({ error: 'customerId required' });

  const url = `https://api.airtable.com/v0/${BASE}/Trips`;

  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${PAT}` },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Could not reach Airtable' });
  }

  if (!response.ok) {
    const body = await response.text();
    console.error('TRIPS error:', response.status, body);
    return res.status(500).json({ error: `Airtable ${response.status}` });
  }

  const data = await response.json();
  console.log('TRIPS: total records =', data.records?.length);

  if (data.records?.length > 0) {
    console.log('TRIPS: field names =', JSON.stringify(Object.keys(data.records[0].fields)));
    console.log('TRIPS: first record =', JSON.stringify(data.records[0].fields));
  }

  const matched = (data.records || []).filter(r => {
    const f = r.fields;
    const cid = f['CustomerID'] || f['Customer ID'] || '';
    return cid === customerId;
  });

  console.log('TRIPS: matched =', matched.length);

  const trips = matched.map(r => {
    const f = r.fields;
    return {
      id:           r.id,
      TripID:       f['TripID']       || f['Trip ID']       || '',
      CustomerID:   f['CustomerID']   || f['Customer ID']   || '',
      CustomerName: f['CustomerName'] || f['Customer Name'] || '',
      From:         f['From']  || '',
      To:           f['To']    || '',
      Date:         f['Date']  || '',
      Cargo:        f['Cargo'] || '',
      Vehicle:      f['Vehicle']     || '',
      VehicleType:  f['VehicleType'] || f['Vehicle Type'] || '',
      Weight:       f['Weight']      || '',
      Driver:       f['Driver']      || '',
      DriverPhone:  f['DriverPhone'] || f['Driver Phone'] || '',
      Status:       f['Status']        || 'Pending',
      CurrentStage: f['CurrentStage'] || f['Current Stage'] || 0,
      TotalStages:  f['TotalStages']  || f['Total Stages']  || 9,
      Rate:         f['Rate']     || 0,
      Advance:      f['Advance']  || 0,
      Balance:      f['Balance']  || 0,
      Rating:       f['Rating']   || 0,
      Photos:       f['Photos']   || [],
      POD:          f['POD']      || [],
      Invoice:      f['Invoice']  || [],
    };
  });

  return res.json(trips);
}
