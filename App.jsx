import { useState, useEffect } from 'react';

// ─── API ────────────────────────────────────────────────────────────────────
async function apiFetch(path) {
  const res = await fetch(path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

// ─── LOGO ───────────────────────────────────────────────────────────────────
function Logo({ size = 16 }) {
  return (
    <img
      src="/logo.png"
      alt="SweafEx"
      style={{ height: size * 1.8, objectFit: 'contain' }}
    />
  );
}

// ─── LOGIN SCREEN ───────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setLoading(true); setError('');
    try {
      const customer = await apiFetch(`/api/customer?phone=${encodeURIComponent(clean)}`);
      onLogin(customer);
    } catch (e) {
      setError('Mobile number not registered. Contact SweafEx to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app" style={{ minHeight: '100vh' }}>
      <div className="login-hero">
        <Logo size={32} />
        <div className="login-tagline">Trucking Simplified</div>
      </div>
      <div className="login-body">
        <div className="l-title">Track your shipments</div>
        <div className="l-sub">Enter your registered mobile number</div>
        <div className="l-label">Mobile number</div>
        <div className="l-row">
          <div className="l-cc">+91</div>
          <input
            className="l-inp"
            type="tel"
            placeholder="98765 43210"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            maxLength={10}
          />
        </div>
        <button className="l-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner" /> : 'Continue →'}
        </button>
        {error && <div className="l-err">{error}</div>}
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ─────────────────────────────────────────────────────────────
function BottomNav({ active, onChange }) {
  const items = [
    { key: 'shipments', icon: '📦', label: 'Shipments' },
    { key: 'enquiry',   icon: '＋', label: 'Enquiry'   },
    { key: 'invoices',  icon: '🧾', label: 'Invoices'  },
    { key: 'profile',   icon: '👤', label: 'Profile'   },
  ];
  return (
    <nav className="bnav">
      {items.map(item => (
        <div key={item.key} className="bnav-item" onClick={() => onChange(item.key)}>
          <span className="bnav-icon">{item.icon}</span>
          <div className={`bnav-lbl${active === item.key ? ' bnav-lbl-active' : ''}`}>{item.label}</div>
        </div>
      ))}
    </nav>
  );
}

// ─── DASHBOARD SCREEN ───────────────────────────────────────────────────────
function DashboardScreen({ customer, trips, onSelectTrip, nav, onNavChange }) {
  const active = trips.filter(t => t.Status !== 'Delivered' && t.Status !== 'Cancelled');
  const done   = trips.filter(t => t.Status === 'Delivered' || t.Status === 'Cancelled');

  const pillClass = (status) => {
    if (status === 'Delivered') return 'pill pill-green';
    if (status === 'Cancelled') return 'pill pill-grey';
    return 'pill pill-orange';
  };

  return (
    <div className="app">
      <div className="hdr">
        <div>
          <Logo />
          <div className="hdr-sub">{customer.company || customer.name}</div>
        </div>
        <div className="avatar">{(customer.company || customer.name || 'S')[0].toUpperCase()}</div>
      </div>

      {nav === 'shipments' && (
        <div className="scroll">
          {active.length > 0 && <div className="sec-lbl">Active shipments</div>}
          {active.map(trip => (
            <div key={trip.TripID} className="card card-clickable" onClick={() => onSelectTrip(trip)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="trip-id-active">{trip.TripID}</span>
                <span className={pillClass(trip.Status)}>{trip.Status}</span>
              </div>
              <div className="trip-route">{trip.From} → {trip.To}</div>
              <div className="trip-meta" style={{ marginBottom: 8 }}>{trip.Date} · {trip.Cargo}</div>
              <div className="prog-bg">
                <div className="prog-fill" style={{ width: `${(trip.CurrentStage / trip.TotalStages) * 100}%` }} />
              </div>
              <div className="prog-meta">
                <span className="prog-count">{trip.CurrentStage}/{trip.TotalStages} stages</span>
                <span className="prog-cta">Tap to track →</span>
              </div>
            </div>
          ))}

          {done.length > 0 && <div className="sec-lbl">Completed trips</div>}
          {done.map(trip => (
            <div key={trip.TripID} className="card card-clickable" style={{ opacity: 0.8 }} onClick={() => onSelectTrip(trip)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="trip-id-done">{trip.TripID}</span>
                <span className={pillClass(trip.Status)}>{trip.Status}</span>
              </div>
              <div className="trip-route">{trip.From} → {trip.To}</div>
              <div className="trip-meta">{trip.Date} · {trip.Cargo}</div>
            </div>
          ))}

          {trips.length === 0 && (
            <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>
              No shipments yet.<br />Submit an enquiry to get started.
            </div>
          )}
        </div>
      )}

      {nav === 'enquiry' && <EnquiryScreen customer={customer} />}
      {nav === 'invoices' && <InvoicesScreen trips={trips} />}
      {nav === 'profile' && <ProfileScreen customer={customer} onLogout={() => window.location.reload()} />}

      <BottomNav active={nav} onChange={onNavChange} />
    </div>
  );
}

// ─── TRIP DETAIL SCREEN ─────────────────────────────────────────────────────
function TripDetailScreen({ trip, onBack }) {
  const [tab, setTab] = useState('status');
  const [stages, setStages] = useState([]);
  const [rating, setRating] = useState(trip.Rating || 0);
  const [ratingDone, setRatingDone] = useState(!!trip.Rating);
  const [loadingStages, setLoadingStages] = useState(true);

  useEffect(() => {
    apiFetch(`/api/status?tripId=${encodeURIComponent(trip.TripID)}`)
      .then(setStages)
      .catch(() => setStages([]))
      .finally(() => setLoadingStages(false));
  }, [trip.TripID]);

  const handleRate = async (n) => {
    if (ratingDone) return;
    setRating(n);
    setRatingDone(true);
    try {
      await apiPost('/api/rate', { tripId: trip.TripID, rating: n });
    } catch (e) {
      console.error('Rating failed:', e);
    }
  };

  return (
    <div className="app">
      <div className="hdr">
        <button className="hdr-back" onClick={onBack}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#FF6B00', fontSize: 15, fontWeight: 600 }}>{trip.TripID}</div>
          <div className="hdr-sub">{trip.From} → {trip.To}</div>
        </div>
        <span className={`pill ${trip.Status === 'Delivered' ? 'pill-green' : 'pill-orange'}`} style={{ fontSize: 11 }}>
          {trip.Status}
        </span>
      </div>

      <div className="tabs">
        {[['status','📍 Status'],['photos','📸 Photos'],['docs','📄 Docs']].map(([key, label]) => (
          <button
            key={key}
            className={`tab-btn${tab === key ? ' tab-btn-active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="scroll">
        {/* STATUS TAB */}
        {tab === 'status' && (
          <>
            <div className="card">
              <div className="card-lbl">Vehicle & driver</div>
              <div className="veh-row">
                <div>
                  <div className="veh-name">{trip.Vehicle}</div>
                  <div className="veh-sub">{trip.VehicleType} · {trip.Weight}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="veh-name">{trip.Driver}</div>
                  <a href={`tel:${trip.DriverPhone}`}>
                    <button className="call-btn">📞 Call driver</button>
                  </a>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-lbl">Live tracking</div>
              {loadingStages
                ? <div className="loading-screen"><span className="spinner" /></div>
                : stages.map((s, i) => {
                    const last = i === stages.length - 1;
                    const dotClass = s.Done ? 'dot-green' : s.Active ? 'dot-orange' : 'dot-grey';
                    const lineClass = s.Done ? 'line-green' : 'line-grey';
                    const textClass = s.Done ? 'tl-text' : s.Active ? 'tl-text tl-text-active' : 'tl-text tl-text-pending';
                    const timeClass = s.Active ? 'tl-time tl-time-active' : 'tl-time';
                    return (
                      <div key={i} className="tl-row">
                        <div className="tl-col">
                          <div className={`tl-dot ${dotClass}`} />
                          {!last && <div className={`tl-line ${lineClass}`} />}
                        </div>
                        <div>
                          <div className={textClass}>{s.Stage}</div>
                          {s.Timestamp && <div className={timeClass}>{s.Timestamp}</div>}
                        </div>
                      </div>
                    );
                  })
              }
            </div>

            <div className="card">
              <div className="card-lbl">Payment summary</div>
              {[
                { label: 'Total freight', value: `₹${Number(trip.Rate).toLocaleString('en-IN')}`, cls: '' },
                { label: 'Advance paid',  value: `₹${Number(trip.Advance).toLocaleString('en-IN')}`, cls: 'pay-green' },
                { label: 'Balance due',   value: `₹${Number(trip.Balance).toLocaleString('en-IN')}`, cls: Number(trip.Balance) === 0 ? 'pay-green' : 'pay-orange' },
              ].map(row => (
                <div key={row.label} className="pay-row">
                  <span className="pay-lbl">{row.label}</span>
                  <span className={`pay-val ${row.cls}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* PHOTOS TAB */}
        {tab === 'photos' && (
          <div className="card">
            <div className="card-lbl">Vehicle & loading photos</div>
            {trip.Photos && trip.Photos.length > 0
              ? trip.Photos.map((photo, i) => (
                  <div key={i}>
                    <img
                      className="photo-img"
                      src={photo.url}
                      alt={photo.filename || `Photo ${i + 1}`}
                    />
                    <div className="photo-lbl">{photo.filename || `Photo ${i + 1}`} · {trip.Date}</div>
                  </div>
                ))
              : <div className="empty-box">No photos uploaded yet.<br />Photos will appear here after loading.</div>
            }
          </div>
        )}

        {/* DOCS TAB */}
        {tab === 'docs' && (
          <>
            <div className="card">
              <div className="card-lbl">Proof of delivery (POD)</div>
              {trip.POD && trip.POD.length > 0
                ? trip.POD.map((doc, i) => (
                    <a key={i} href={doc.url} target="_blank" rel="noreferrer">
                      <button className="dl-btn">⬇ Download POD</button>
                    </a>
                  ))
                : <div className="empty-box">POD will appear here after delivery is complete.</div>
              }
            </div>

            <div className="card">
              <div className="card-lbl">Invoice</div>
              {trip.Invoice && trip.Invoice.length > 0
                ? trip.Invoice.map((doc, i) => (
                    <a key={i} href={doc.url} target="_blank" rel="noreferrer">
                      <button className="dl-btn">⬇ Download invoice</button>
                    </a>
                  ))
                : <div className="empty-box">Invoice will be uploaded after trip completion.</div>
              }
            </div>

            <div className="card">
              <div className="card-lbl">{ratingDone ? 'Your rating' : 'Rate this trip'}</div>
              <div className="stars">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    className={`star-btn${rating >= n ? ' star-btn-lit' : ''}`}
                    onClick={() => handleRate(n)}
                  >
                    {rating >= n ? '★' : '☆'}
                  </button>
                ))}
              </div>
              {ratingDone && (
                <div style={{ textAlign: 'center', fontSize: 12, color: '#2e7d32', marginTop: 4 }}>
                  Thank you for your feedback!
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ENQUIRY SCREEN ─────────────────────────────────────────────────────────
function EnquiryScreen({ customer }) {
  const [form, setForm] = useState({
    from: '', to: '', size: '10 Feet', vtype: 'Container',
    weight: '', cargo: 'Rods & Hardware', date: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.from || !form.to || !form.date) { setError('Please fill From, To, and Loading Date'); return; }
    setLoading(true); setError('');
    try {
      await apiPost('/api/enquiry', { ...form, customerId: customer.id, customerName: customer.company || customer.name });
      setDone(true);
    } catch (e) {
      setError('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="scroll" style={{ paddingTop: 12 }}>
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 600, fontSize: 16, color: '#111', marginBottom: 6 }}>Enquiry submitted!</div>
          <div style={{ fontSize: 13, color: '#999' }}>Our team will contact you within 30 minutes to confirm rates.</div>
          <button className="l-btn" style={{ marginTop: 20 }} onClick={() => setDone(false)}>
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll" style={{ paddingTop: 8 }}>
      <div className="card">
        <div className="card-lbl">New freight enquiry</div>
        <div className="enq-grid" style={{ marginBottom: 0 }}>
          <div>
            <div className="l-label">From city</div>
            <input className="f-inp" placeholder="Bangalore" value={form.from} onChange={e => set('from', e.target.value)} />
          </div>
          <div>
            <div className="l-label">To city</div>
            <input className="f-inp" placeholder="Chennai" value={form.to} onChange={e => set('to', e.target.value)} />
          </div>
        </div>
        <div className="enq-grid">
          <div>
            <div className="l-label">Vehicle size</div>
            <select className="f-inp" value={form.size} onChange={e => set('size', e.target.value)}>
              {['10 Feet','14 Feet','20 Feet','32 Feet SXL','Other'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className="l-label">Weight (tonnes)</div>
            <input className="f-inp" type="number" placeholder="2" value={form.weight} onChange={e => set('weight', e.target.value)} />
          </div>
        </div>
        <div className="l-label">Cargo type</div>
        <select className="f-inp" value={form.cargo} onChange={e => set('cargo', e.target.value)}>
          {['Rods & Hardware','PVC Pipes','FMCG','Auto Parts','Pharma','Other'].map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="l-label">Loading date</div>
        <input className="f-inp" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        <div className="l-label">Special instructions (optional)</div>
        <textarea className="f-inp" rows={2} placeholder="Any special handling requirements..." value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'none' }} />
        {error && <div className="l-err">{error}</div>}
        <button className="l-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner" /> : 'Submit enquiry →'}
        </button>
      </div>
    </div>
  );
}

// ─── INVOICES SCREEN ────────────────────────────────────────────────────────
function InvoicesScreen({ trips }) {
  const withInvoice = trips.filter(t => t.Invoice && t.Invoice.length > 0);

  return (
    <div className="scroll" style={{ paddingTop: 8 }}>
      {withInvoice.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>
          No invoices yet.<br />Invoices will appear here after trip completion.
        </div>
      )}
      {withInvoice.map(trip => (
        <div key={trip.TripID} className="card">
          <div className="inv-row">
            <span className="inv-id">{trip.TripID}</span>
            <span className={`pill ${Number(trip.Balance) === 0 ? 'pill-green' : 'pill-orange'}`}>
              {Number(trip.Balance) === 0 ? 'Paid' : 'Balance due'}
            </span>
          </div>
          <div className="inv-meta">{trip.Date} · {trip.From} → {trip.To} · ₹{Number(trip.Rate).toLocaleString('en-IN')}</div>
          {trip.Invoice.map((doc, i) => (
            <a key={i} href={doc.url} target="_blank" rel="noreferrer">
              <button className="dl-btn">⬇ Download invoice</button>
            </a>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── PROFILE SCREEN ─────────────────────────────────────────────────────────
function ProfileScreen({ customer, onLogout }) {
  return (
    <div className="scroll" style={{ paddingTop: 8 }}>
      <div className="card" style={{ textAlign: 'center', paddingTop: 24 }}>
        <div className="avatar" style={{ width: 56, height: 56, fontSize: 22, margin: '0 auto 12px' }}>
          {(customer.company || customer.name || 'S')[0].toUpperCase()}
        </div>
        <div style={{ fontWeight: 600, fontSize: 16, color: '#111' }}>{customer.company}</div>
        <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{customer.name}</div>
      </div>
      <div className="card">
        {[
          { label: 'Mobile', value: customer.phone },
          { label: 'Email', value: customer.email || '—' },
          { label: 'Customer ID', value: customer.id },
        ].map(row => (
          <div key={row.label} className="pay-row">
            <span className="pay-lbl">{row.label}</span>
            <span style={{ fontSize: 13, color: '#111' }}>{row.value}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <div style={{ fontSize: 13, color: '#999', marginBottom: 6 }}>Need help? Contact SweafEx</div>
        <a href="tel:+919945623121">
          <button className="dl-btn">📞 Call SweafEx: +91 99456 23121</button>
        </a>
        <a href="https://wa.me/919945623121" target="_blank" rel="noreferrer">
          <button className="dl-btn" style={{ background: '#075E54', marginTop: 6 }}>
            💬 WhatsApp SweafEx
          </button>
        </a>
      </div>
      <div className="card">
        <button className="dl-btn" style={{ background: '#c62828' }} onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

// ─── ROOT APP ───────────────────────────────────────────────────────────────
export default function App() {
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = sessionStorage.getItem('sweafex_customer');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [nav, setNav] = useState('shipments');
  const [loadingTrips, setLoadingTrips] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setLoadingTrips(true);
    apiFetch(`/api/trips?customerId=${encodeURIComponent(customer.id)}`)
      .then(setTrips)
      .catch(() => setTrips([]))
      .finally(() => setLoadingTrips(false));
  }, [customer]);

  const handleLogin = (cust) => {
    try { sessionStorage.setItem('sweafex_customer', JSON.stringify(cust)); } catch {}
    setCustomer(cust);
  };

  const handleLogout = () => {
    try { sessionStorage.removeItem('sweafex_customer'); } catch {}
    setCustomer(null);
    setTrips([]);
    setSelectedTrip(null);
  };

  if (!customer) return <LoginScreen onLogin={handleLogin} />;
  if (selectedTrip) return <TripDetailScreen trip={selectedTrip} onBack={() => setSelectedTrip(null)} />;
  if (loadingTrips) return (
    <div className="app" style={{ alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <span className="spinner" style={{ width:32, height:32, borderWidth:3 }} />
    </div>
  );

  return (
    <DashboardScreen
      customer={customer}
      trips={trips}
      onSelectTrip={setSelectedTrip}
      nav={nav}
      onNavChange={setNav}
      onLogout={handleLogout}
    />
  );
}
