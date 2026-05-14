import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../App'
import { fmt, fmtKr } from '../lib/utils'

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    document.getElementById('page-title').textContent = 'Översikt'
    document.getElementById('topbar-actions').innerHTML = ''
    loadData()
  }, [profile])

  async function loadData() {
    if (!profile) return
    setLoading(true)
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`

    let entryQ = supabase.from('time_entries').select('*, project:projects(*, customer:customers(*))')
    if (!isAdmin) entryQ = entryQ.eq('user_id', profile.id)
    const { data: entries } = await entryQ.order('date', { ascending: false }).limit(100)

    const totalH = (entries||[]).reduce((s,e)=>s+Number(e.hours),0)
    const monthH = (entries||[]).filter(e=>e.date>=monthStart).reduce((s,e)=>s+Number(e.hours),0)

    let custCount = 0, projCount = 0, totalRevenue = 0
    if (isAdmin) {
      const { count: cc } = await supabase.from('customers').select('id', { count: 'exact', head: true })
      const { count: pc } = await supabase.from('projects').select('id', { count: 'exact', head: true })
      custCount = cc; projCount = pc
      totalRevenue = (entries||[]).reduce((s,e)=>s+Number(e.hours)*(e.project?.rate||0),0)
    }

    setStats({ totalH, monthH, custCount, projCount, totalRevenue })
    setRecent((entries||[]).slice(0,6))
    setLoading(false)
  }

  if (loading) return <div className="loading-center"><div className="spinner"/></div>

  return (
    <>
      <div className={`${isAdmin ? 'g4' : 'g2'}`} style={{ marginBottom: 16 }}>
        {isAdmin && <div className="metric"><div className="metric-val">{stats.custCount}</div><div className="metric-lbl">Kunder</div></div>}
        {isAdmin && <div className="metric"><div className="metric-val">{stats.projCount}</div><div className="metric-lbl">Aktiva projekt</div></div>}
        <div className="metric"><div className="metric-val">{fmt(stats.monthH)}</div><div className="metric-lbl">Timmar denna månad</div></div>
        {isAdmin
          ? <div className="metric"><div className="metric-val">{fmtKr(stats.totalRevenue)}</div><div className="metric-lbl">Totalt värde</div></div>
          : <div className="metric"><div className="metric-val">{fmt(stats.totalH)}</div><div className="metric-lbl">Mina timmar totalt</div></div>
        }
      </div>

      <div className="card card-table">
        <div className="section-head" style={{ padding: '12px 16px', borderBottom: '1px solid #eeecea', marginBottom: 0 }}>
          <span className="section-title">Senaste registreringar</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Projekt</th>
                <th className="col-hide">Tjänst</th>
                {isAdmin && <th className="col-hide">Kund</th>}
                <th style={{ textAlign: 'right' }}>Timmar</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && <tr><td colSpan="5" className="empty">Inga registreringar ännu</td></tr>}
              {recent.map(e => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{e.date}</td>
                  <td className="clickable" onClick={() => navigate(`/projects/${e.project_id}`)}>{e.project?.name || '-'}</td>
                  <td className="col-hide"><span className="tag">{e.project?.service || '-'}</span></td>
                  {isAdmin && <td className="col-hide" style={{ color: '#888' }}>{e.project?.customer?.name || '-'}</td>}
                  <td style={{ textAlign: 'right' }}><span className="pill">{fmt(Number(e.hours))}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
