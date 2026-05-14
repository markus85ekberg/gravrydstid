import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { fmt, fmtKr } from '../lib/utils'

export default function TimeEntries() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [entries, setEntries] = useState([])
  const [projects, setProjects] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const today = new Date().toISOString().slice(0,10)
  const [form, setForm] = useState({ project_id: '', date: today, hours: '', note: '', user_id: profile?.id })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.getElementById('page-title').textContent = 'Tidregistrering'
    const btn = document.getElementById('topbar-actions')
    btn.innerHTML = ''
    const b = document.createElement('button')
    b.className = 'btn btn-primary btn-sm'
    b.textContent = '+ Registrera tid'
    b.onclick = () => setModal(true)
    btn.appendChild(b)
    loadData()
    return () => { btn.innerHTML = '' }
  }, [])

  async function loadData() {
    setLoading(true)
    const { data: projs } = await supabase.from('projects').select('*, customer:customers(name)').order('name')
    let q = supabase.from('time_entries').select('*, project:projects(*, customer:customers(name)), user:profiles(*)')
    if (!isAdmin) q = q.eq('user_id', profile.id)
    const { data: ents } = await q.order('date', { ascending: false }).limit(200)
    if (isAdmin) {
      const { data: profs } = await supabase.from('profiles').select('*').order('name')
      setProfiles(profs || [])
    }
    setProjects(projs || [])
    setEntries(ents || [])
    if (projs?.length) setForm(f => ({ ...f, project_id: projs[0].id }))
    setLoading(false)
  }

  async function saveEntry() {
    if (!form.project_id || !form.date || !form.hours || Number(form.hours) <= 0) return
    setSaving(true)
    await supabase.from('time_entries').insert({
      project_id: form.project_id,
      user_id: isAdmin ? form.user_id : profile.id,
      date: form.date,
      hours: Number(form.hours),
      note: form.note,
    })
    setSaving(false)
    setModal(false)
    setForm(f => ({ ...f, hours: '', note: '' }))
    loadData()
  }

  async function deleteEntry(id) {
    if (!confirm('Ta bort registreringen?')) return
    await supabase.from('time_entries').delete().eq('id', id)
    loadData()
  }

  if (loading) return <div className="loading-center"><div className="spinner"/></div>

  return (
    <>
      <div className="card card-table">
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Projekt</th>
                <th className="col-hide">Kund</th>
                <th className="col-hide">Tjänst</th>
                {isAdmin && <th className="col-hide">Förare</th>}
                <th style={{ textAlign: 'right' }}>Timmar</th>
                <th className="col-hide" style={{ textAlign: 'right' }}>Värde</th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 && <tr><td colSpan="8" className="empty">Inga registreringar</td></tr>}
              {entries.map(e => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{e.date}</td>
                  <td>{e.project?.name || '-'}</td>
                  <td className="col-hide" style={{ color: '#888' }}>{e.project?.customer?.name || '-'}</td>
                  <td className="col-hide"><span className="tag">{e.project?.service || '-'}</span></td>
                  {isAdmin && <td className="col-hide" style={{ fontSize: 12 }}>{e.user?.name || '-'}</td>}
                  <td style={{ textAlign: 'right' }}><span className="pill">{fmt(Number(e.hours))}</span></td>
                  <td className="col-hide" style={{ textAlign: 'right', color: '#888', fontSize: 12 }}>{fmtKr(Number(e.hours)*(e.project?.rate||0))}</td>
                  <td>
                    {(isAdmin || e.user_id === profile.id) &&
                      <button className="btn btn-sm btn-danger" onClick={() => deleteEntry(e.id)}>✕</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && createPortal(
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-title">Registrera tid</div>
            <div className="form-row">
              <label className="form-label">Projekt *</label>
              <select value={form.project_id} onChange={e => setForm(f=>({...f,project_id:e.target.value}))}>
                {projects.map(p => <option key={p.id} value={p.id}>{p.customer?.name} — {p.name} ({p.service})</option>)}
              </select>
            </div>
            <div className="g2">
              <div className="form-row"><label className="form-label">Datum *</label><input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} /></div>
              <div className="form-row"><label className="form-label">Timmar *</label><input type="number" value={form.hours} onChange={e => setForm(f=>({...f,hours:e.target.value}))} min="0.5" max="24" step="0.5" placeholder="3.5" /></div>
            </div>
            {isAdmin && profiles.length > 0 && (
              <div className="form-row">
                <label className="form-label">Förare</label>
                <select value={form.user_id} onChange={e => setForm(f=>({...f,user_id:e.target.value}))}>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <div className="form-row"><label className="form-label">Anteckning</label><input value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} placeholder="Valfritt..." /></div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setModal(false)}>Avbryt</button>
              <button className="btn btn-primary" onClick={saveEntry} disabled={saving}>{saving ? 'Sparar...' : 'Spara'}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
