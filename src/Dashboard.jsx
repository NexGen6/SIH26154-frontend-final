import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../src/services/api'
import teamlogo from '../src/assets/teamlogo.png'

const SOURCES = [
  { id: 'text', label: 'Text', kind: 'text', icon: '≡' },
  { id: 'pdf', label: 'PDF', kind: 'document', accept: '.pdf,application/pdf', icon: '▤' },
  { id: 'docx', label: 'DOCX', kind: 'document', accept: '.docx', icon: '▧' },
  { id: 'vision', label: 'Image', kind: 'image', accept: 'image/png,image/jpeg,image/webp', icon: '◉' },
]
const OUTPUTS = [
  ['linkedin', 'LinkedIn post'], ['twitter', 'X / Twitter thread'], ['advisory', 'Policy advisory'],
  ['infographic', 'Infographic outline'], ['executive summary', 'Executive summary'],
  ['presentation', 'Presentation deck'], ['video', 'Video script'],
]
const SAMPLES = {
  cyber: { text: 'CERT advisory: A critical remote code execution flaw is being exploited in unpatched VPN gateways. Organisations should apply the vendor patch within 48 hours, rotate all administrator credentials, review VPN logs for unknown sessions since 1 September, and report confirmed compromise to the national incident response team.', audience: 'Government IT officers', tone: 'Urgent, authoritative', objective: 'Get every department to patch within 48 hours' },
  agri: { text: 'Agriculture directive: Under the revised crop insurance scheme, small farmers can enrol until 31 October. Premiums are subsidised up to 90 percent for drought-prone districts. Enrolment needs land records, a bank account and Aadhaar-linked mobile number, and can be done at any common service centre.', audience: 'Small and marginal farmers', tone: 'Simple, reassuring', objective: 'Drive enrolment before the 31 October deadline' },
}

export default function Dashboard() {
  const nav = useNavigate()
  const [me, setMe] = useState(null)
  const [view, setView] = useState('orch')
  const [menu, setMenu] = useState(false)
  const [crt, setCrt] = useState(false)
  const [auditCount, setAuditCount] = useState(null)

  useEffect(() => {
    api.get('/auth/me').then(r => setMe(r.data.user)).catch(() => nav('/'))
  }, [nav])
  useEffect(() => { document.body.classList.toggle('crt', crt); return () => document.body.classList.remove('crt') }, [crt])
  useEffect(() => {
    if (me?.role === 'admin') api.get('/admin/audit-logs').then(r => setAuditCount(r.data.logs.length)).catch(() => {})
  }, [me])

  async function logout() { try { await api.post('/auth/user/logout') } finally { nav('/') } }
  if (!me) return <div className="wrap mono">Verifying session…</div>
  const isAdmin = me.role === 'admin'

  return (
    <>
      <header className="hdr">
        <div className="brand">
          <div className="logo"><img src={teamlogo} alt="Team Logo" className="logo-img" /></div>
          <div>
            <div className="wordmark">NEXGEN6</div>
            <div className="mono dim tagline">Omnichannel single-source transform platform</div>
          </div>
          <div className="chip mono">SIH-2026 | PS-154</div>
        </div>
        <button className="icon-btn" aria-pressed={crt} onClick={() => setCrt(!crt)} title="Toggle scanline display" aria-label="Toggle scanline display">▭</button>
        <div className="tabs" role="tablist">
          <button className="tab" role="tab" aria-selected={view === 'orch'} onClick={() => setView('orch')}>&gt;STUDIO</button>
          {isAdmin && <button className="tab" role="tab" aria-selected={view === 'admin'} onClick={() => setView('admin')}>Admin / Audits {auditCount !== null && <span className="count">{String(auditCount).padStart(2, '0')}</span>}</button>}
        </div>
        <div className="operator">
          <button className="op-btn mono" onClick={() => setMenu(!menu)} aria-expanded={menu}>
            <i /><span><b>{me.name}</b><br /><span className="dim">{me.role} · JWT secure</span></span>
          </button>
          {menu && <div className="op-menu"><button className="mono" onClick={logout}>Sign out</button></div>}
        </div>
      </header>
      <main className="wrap">{view === 'orch' || !isAdmin ? <Orchestrator /> : <Admin onCount={setAuditCount} />}</main>
    </>
  )
}

function Orchestrator() {
  const [src, setSrc] = useState(SOURCES[0])
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [p, setP] = useState({ audience: '', tone: '', language: 'English', detailLevel: 'Standard', objective: '' })
  const [sel, setSel] = useState(OUTPUTS.map(o => o[0]))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [outs, setOuts] = useState([])
  const [hist, setHist] = useState([])
  const fileRef = useRef()
  const resRef = useRef()

  const loadHist = () => api.get('/mySubmissions').then(r => setHist([...r.data.submissions].reverse().slice(0, 6))).catch(() => {})
  useEffect(() => { loadHist() }, [])

  function pick(s) { setSrc(s); setFile(null); setPreview(''); setError('') }
  function onFile(f) {
    if (!f) return
    if (f.size > 10 * 1024 * 1024) return setError('File is larger than 10 MB.')
    setFile(f); setError('')
    setPreview(src.kind === 'image' ? URL.createObjectURL(f) : '')
  }
  function sample(k) {
    const s = SAMPLES[k]; pick(SOURCES[0]); setText(s.text)
    setP(x => ({ ...x, audience: s.audience, tone: s.tone, objective: s.objective }))
  }
  const toggle = id => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const ready = (src.kind === 'text' ? text.trim() : file) && p.audience && p.tone && p.language && p.objective && sel.length

  async function run() {
    setError(''); setBusy(true); setOuts([])
    const fd = new FormData()
    fd.append('sourceType', src.kind)
    if (src.kind === 'text') fd.append('content', text); else fd.append('file', file)
    Object.entries(p).forEach(([k, v]) => fd.append(k, v))
    sel.forEach(o => fd.append('outputTypes', o))
    try {
      const r = await api.post('/submission', fd)
      setOuts(r.data.outputs); loadHist()
      setTimeout(() => resRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (e) {
      const d = e.response?.data
      setError(d?.errors?.map(x => x.msg).join(', ') || d?.message || e.message || 'Request failed.')
    } finally { setBusy(false) }
  }
  async function openRun(id) {
    try { const r = await api.get(`/submission/${id}/outputs`); setOuts(r.data.outputs); setTimeout(() => resRef.current?.scrollIntoView({ behavior: 'smooth' }), 50) }
    catch { setError('Could not load that run.') }
  }
  const label = t => OUTPUTS.find(o => o[0] === t)?.[1] || t
  const set = k => e => setP({ ...p, [k]: e.target.value })

  return (
    <>
      <section className="panel">
        <div className="hero-top"><span className="tag">System core</span><span className="mono dim"> Architecture: multimodal 1-to-7 pipeline</span></div>
        <h1>Transform single complex source → 7 targeted deliverables</h1>
        <p className="lead" style={{ marginBottom: 28 }}>We quickly and accurately adapt your content for warning alerts, social media, and official policies. Powered by Google Gemini, secure stream processing, advanced prompt defense, and strict fact-checking.</p>
        <div className="row">
          <button className="btn" onClick={() => {sample('cyber'); window.open('https://owasp.org/projects/top-10-for-large-language-model-applications', '_blank'); }}>🛡 OWASP Gen-AI Advisory</button>
        </div>
      </section>

      <section className="panel">
        <div className="sec-head"><h2><span>01</span>Upload data</h2><span className="mono dim">[Multer: RAM buffer]</span></div>
        <div className="label mono">Select file type</div>
        <div className="seg" role="tablist">
          {SOURCES.map(s => <button key={s.id} role="tab" aria-selected={src.id === s.id} onClick={() => pick(s)}><span style={{ fontSize: 22 }}>{s.icon}</span>{s.label.toUpperCase()}</button>)}
        </div>
        {src.kind === 'text' ? (
          <>
            <textarea className="src" value={text} maxLength={50000} onChange={e => setText(e.target.value)} placeholder="Paste the advisory, directive or article to transform…" aria-label="Source text" />
            <div className="counter mono dim">{text.length.toLocaleString()} / 50,000</div>
          </>
        ) : (
          <div className="drop" tabIndex={0} onClick={() => fileRef.current.click()} onKeyDown={e => e.key === 'Enter' && fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('on') }} onDragLeave={e => e.currentTarget.classList.remove('on')}
            onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('on'); onFile(e.dataTransfer.files[0]) }}>
            {preview && <img src={preview} alt="Selected source" />}
            <b>{file ? file.name : `Drop a ${src.label} file here or click to browse`}</b>
            <span className="mono dim">{file ? `${(file.size / 1024).toFixed(0)} KB` : 'Max 10 MB'}</span>
            <input ref={fileRef} type="file" hidden accept={src.accept} onChange={e => onFile(e.target.files[0])} />
          </div>
        )}
      </section>

      <section className="panel">
        <div className="sec-head"><h2><span>02</span>Style & Audience</h2><span className="mono dim">[Prompt variables]</span></div>
        <div className="grid2">
          <label className="field"><span className="mono">Target audience</span><input value={p.audience} maxLength={100} onChange={set('audience')} placeholder="e.g. Government IT officers" /></label>
          <label className="field"><span className="mono">Brand tone</span><input value={p.tone} maxLength={100} onChange={set('tone')} placeholder="e.g. Urgent, authoritative" /></label>
          <label className="field"><span className="mono">Language</span><input value={p.language} maxLength={100} onChange={set('language')} /></label>
          <label className="field"><span className="mono">Detail level</span>
            <select value={p.detailLevel} onChange={set('detailLevel')}><option>Brief</option><option>Standard</option><option>Detailed</option></select></label>
          <label className="field span2"><span className="mono">Communication objective</span><input value={p.objective} maxLength={300} onChange={set('objective')} placeholder="What should the audience do after reading?" /></label>
        </div>
      </section>

      <section className="panel">
        <div className="sec-head"><h2><span>03</span>Deliverables</h2>
          <span className="row"><button className="btn" style={{ padding: '10px 14px' }} onClick={() => setSel(OUTPUTS.map(o => o[0]))}>All</button><button className="btn" style={{ padding: '10px 14px' }} onClick={() => setSel([])}>None</button></span></div>
        <div className="outs">{OUTPUTS.map(([id, l]) => <button key={id} className="out" aria-pressed={sel.includes(id)} onClick={() => toggle(id)}>{l}<span className="box" /></button>)}</div>
        <div className="row" style={{ marginTop: 28, alignItems: 'center' }}>
          <button className="btn solid" disabled={!ready || busy} onClick={run}>{busy ? <><span className="spin" /> Generating {sel.length} outputs…</> : `Generate ${sel.length} deliverable${sel.length === 1 ? '' : 's'}`}</button>
          {busy && <span className="mono dim">Outputs are generated one by one; this can take a minute.</span>}
        </div>
        {error && <div className="err" role="alert">{error}</div>}
      </section>

      {outs.length > 0 && (
        <section className="panel" ref={resRef}>
          <div className="sec-head"><h2><span>04</span>Output</h2><span className="mono dim">{outs.length} deliverables</span></div>
          <div className="results" style={{ marginTop: 0 }}>
            {outs.map(o => (
              <article className="res" key={o._id}>
                <div className="res-h"><b className="mono">{label(o.type)}</b><button className="btn" onClick={() => navigator.clipboard.writeText(o.content)}>Copy</button></div>
                <pre>{o.content}</pre>
              </article>
            ))}
          </div>
        </section>
      )}

      {hist.length > 0 && (
        <section className="panel">
          <div className="sec-head"><h2>Recent runs</h2></div>
          <div className="hist">{hist.map(h => (
            <button key={h._id} onClick={() => openRun(h._id)}>
              <span>{h.outputTypes.map(label).join(', ')}</span>
              <span className="mono dim">{h.sourceType} · {new Date(h.createdAt).toLocaleString()} · <span className={`status ${h.status}`}>{h.status}</span></span>
            </button>))}
          </div>
        </section>
      )}
    </>
  )
}

function Admin({ onCount }) {
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const load = () => {
    api.get('/admin/users').then(r => setUsers(r.data.users)).catch(() => {})
    api.get('/admin/audit-logs').then(r => { setLogs(r.data.logs); onCount(r.data.logs.length) }).catch(() => setError('Could not load audit logs.'))
  }
  useEffect(load, [])
  async function create(e) {
    e.preventDefault(); setError(''); setMsg('')
    try { await api.post('/auth/user/register', f); setMsg(`Operator ${f.email} created.`); setF({ name: '', email: '', password: '' }); load() }
    catch (er) { setError(er.response?.data?.message || 'Could not create operator.') }
  }
  const s = k => e => setF({ ...f, [k]: e.target.value })
  return (
    <>
      <section className="panel">
        <div className="sec-head"><h2>Create operator</h2><span className="mono dim">[Admin only]</span></div>
        <form className="grid2" onSubmit={create}>
          <label className="field"><span className="mono">Name</span><input value={f.name} onChange={s('name')} required /></label>
          <label className="field"><span className="mono">Email</span><input type="email" value={f.email} onChange={s('email')} required /></label>
          <label className="field"><span className="mono">Password (min 6)</span><input type="password" minLength={6} value={f.password} onChange={s('password')} required /></label>
          <div style={{ alignSelf: 'end' }}><button className="btn solid">Create operator</button></div>
        </form>
        {msg && <div className="err" style={{ marginTop: 20 }}>{msg}</div>}
        {error && <div className="err" role="alert">{error}</div>}
      </section>
      <section className="panel">
        <div className="sec-head"><h2>Operators</h2><span className="mono dim">{users.length} accounts</span></div>
        <div className="tbl"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th></tr></thead>
          <tbody>{users.map(u => <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td className="mono">{u.role}</td><td>{new Date(u.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>
      </section>
      <section className="panel">
        <div className="sec-head"><h2>Audit ledger</h2><span className="mono dim">{logs.length} events</span></div>
        <div className="tbl"><table><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Resource</th><th>Details</th></tr></thead>
          <tbody>{logs.map(l => <tr key={l._id}><td>{new Date(l.createdAt).toLocaleString()}</td><td>{l.user?.email || '—'}</td><td className="mono">{l.action}</td><td>{l.resource}</td><td style={{ whiteSpace: 'normal', maxWidth: 380 }}>{l.details}</td></tr>)}</tbody></table></div>
      </section>
    </>
  )
}
