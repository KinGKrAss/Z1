import { useEffect, useMemo, useState } from "react";
import { COUNCIL_33, Z1_CORE_ROLE } from "../core/council_33.mjs";

type Role = { id:string; name:string; title:string; domain:string; mission:string; tone:string; position:number };
type Health = { reachable:boolean; checkedAt:string; coreStatus:{status:string|null;runtime:string|null}|null; modules:string[] };
const roles = COUNCIL_33 as unknown as Role[];
const core = Z1_CORE_ROLE as { name:string; domain:string };

export default function CouncilDashboard() {
  const [query,setQuery]=useState("");
  const [domain,setDomain]=useState("Alle Fachgebiete");
  const [selected,setSelected]=useState<string|null>(null);
  const [health,setHealth]=useState<Health|null>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    let mounted=true;
    let controller:AbortController|undefined;
    const refresh=async()=>{
      controller?.abort(); controller=new AbortController();
      try {
        const response=await fetch("/api/z1/dashboard-health",{signal:controller.signal,headers:{Accept:"application/json"}});
        if(!response.ok) throw new Error("status unavailable");
        const result=await response.json() as Health;
        if(mounted) setHealth(result);
      } catch {
        if(mounted && !controller.signal.aborted) setHealth({reachable:false,checkedAt:new Date().toISOString(),coreStatus:null,modules:[]});
      } finally { if(mounted) setLoading(false); }
    };
    void refresh();
    const timer=window.setInterval(()=>void refresh(),30000);
    return ()=>{mounted=false;controller?.abort();window.clearInterval(timer);};
  },[]);

  const domains=useMemo(()=>["Alle Fachgebiete",...Array.from(new Set(roles.map(r=>r.domain))).sort()],[]);
  const visible=useMemo(()=>{
    const needle=query.trim().toLocaleLowerCase("de-DE");
    return roles.filter(r=>(domain==="Alle Fachgebiete"||r.domain===domain)&&
      (!needle||[r.name,r.title,r.domain,r.mission].some(v=>v.toLocaleLowerCase("de-DE").includes(needle))));
  },[domain,query]);
  const selectedRole=roles.find(r=>r.id===selected);
  const checked=health?.checkedAt?new Intl.DateTimeFormat("de-DE",{hour:"2-digit",minute:"2-digit"}).format(new Date(health.checkedAt)):"—";
  const connection=loading?"Prüfe Verbindung":health?.reachable?"API erreichbar":"Nicht erreichbar";

  return <main className="council-page"><div className="council-shell">
    <header className="council-header">
      <div><p className="eyebrow">SYSTEM Z1 · ROLLENREGISTER</p><h1>Göttinnen <span>&amp;</span> Z1</h1>
        <p className="subtitle">Übersicht über die 33 Fachrollen und den getrennten Z1-Kern.</p></div>
      <a className="home-link" href="/">Zur Z1-Startseite ↗</a>
    </header>

    <section className="metric-grid" aria-label="Systemübersicht">
      <article className="metric-card metric-roles"><div><p className="metric-label">Council of 33</p><strong>{roles.length}</strong><span>Rollen im Register</span></div><span className="metric-symbol" aria-hidden="true">33</span></article>
      <article className="metric-card metric-core"><div><p className="metric-label">Zentraler Kern</p><strong>{core.name}</strong><span>Separat vom Council geführt</span></div><span className="metric-symbol" aria-hidden="true">Z1</span></article>
      <article className={`metric-card ${health?.reachable?"metric-online":loading?"metric-pending":"metric-offline"}`} aria-live="polite">
        <div><p className="metric-label">Z1-API</p><strong>{connection}</strong><span>{health?.coreStatus?.status?(`Kernstatus: ${health.coreStatus.status}`):"Status wird nicht geliefert"}</span></div>
        <span className="metric-symbol" aria-hidden="true">{health?.reachable?"✓":loading?"…":"!"}</span>
      </article>
    </section>

    {!health?.reachable&&!loading&&<p className="notice" role="status">
      Die Rollen sind im Register vorhanden. Die Z1-API antwortet derzeit nicht; Rollenlaufzeiten werden nicht als live dargestellt.
    </p>}

    <section className="register-card" aria-labelledby="roles-heading">
      <div className="register-heading">
        <div><p className="eyebrow">COUNCIL OF 33</p><h2 id="roles-heading">Rollenregister</h2><p>{visible.length} von {roles.length} Rollen</p></div>
        <div className="filters">
          <label><span className="sr-only">Rollen durchsuchen</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, Auftrag oder Fachgebiet"/></label>
          <label><span className="sr-only">Fachgebiet wählen</span><select value={domain} onChange={e=>setDomain(e.target.value)}>{domains.map(d=><option key={d}>{d}</option>)}</select></label>
        </div>
      </div>
      <div className="table-scroll"><table className="role-table">
        <thead><tr><th scope="col">Nr.</th><th scope="col">Name</th><th scope="col">Rolle</th><th scope="col">Fachgebiet</th><th scope="col">Eintrag</th></tr></thead>
        <tbody>{visible.map(role=><tr key={role.id} className={selected===role.id?"row-selected":""}>
          <td className="number-cell">#{String(role.position).padStart(2,"0")}</td>
          <td><button type="button" className="role-link" onClick={()=>setSelected(selected===role.id?null:role.id)} aria-pressed={selected===role.id}>{role.name}</button></td>
          <td>{role.title}</td><td>{role.domain}</td><td><span className="register-status">Registriert</span></td>
        </tr>)}
        {!visible.length&&<tr><td colSpan={5} className="empty">Keine passende Rolle gefunden.</td></tr>}</tbody>
      </table></div>
      {selectedRole&&<aside className="selected-detail" aria-live="polite">
        <div><p className="eyebrow">ROLLE #{String(selectedRole.position).padStart(2,"0")}</p><h3>{selectedRole.name} · {selectedRole.title}</h3></div>
        <dl><div><dt>Auftrag</dt><dd>{selectedRole.mission}</dd></div><div><dt>Kommunikationsstil</dt><dd>{selectedRole.tone}</dd></div><div><dt>Laufzeitstatus</dt><dd>Kein Einzelstatus-Endpunkt vorhanden</dd></div></dl>
      </aside>}
    </section>

    <footer className="footer"><span>Quelle: Z1 Council-Register</span><span>API zuletzt geprüft: {checked}</span>
      <span>{health?.reachable?`Z1-Module: ${health.modules.join(" · ")||"keine gemeldet"}`:"Z1-Modulliste nicht verfügbar"}</span>
    </footer>
  </div></main>;
}
