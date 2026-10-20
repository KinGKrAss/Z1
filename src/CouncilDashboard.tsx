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
  const status=loading?"Prüfe Verbindung":!health?.reachable?"Nicht erreichbar":health.coreStatus?.status?`API erreichbar · Kern: ${health.coreStatus.status}`:"API erreichbar";

  return <main className="council-page"><div className="council-shell">
    <header className="council-header">
      <div><p className="eyebrow">SYSTEM Z1 · ROLLENREGISTER</p><h1>Göttinnen <span>&amp;</span> Z1</h1>
        <p className="subtitle">33 Fachrollen und der getrennte Z1-Kern.</p></div>
      <a className="home-link" href="/">Zur Z1-Startseite ↗</a>
    </header>

    <section className="core-panel" aria-label="Z1-Kernstatus">
      <div className="core-mark" aria-hidden="true">Z1</div>
      <div className="core-copy"><p className="eyebrow">ZENTRALER KERN</p><h2>{core.name}</h2>
        <p>{core.domain}</p><small>Eigenständige Systemrolle · außerhalb des Council of 33</small></div>
      <div className="connection" aria-live="polite">
        <span className={`dot ${health?.reachable?"online":loading?"pending":"offline"}`}/>
        <div><strong>{status}</strong><small>Zuletzt geprüft {checked}</small></div>
      </div>
    </section>

    <section className="metrics" aria-label="Übersicht">
      <div><strong>{roles.length}</strong><span>Rollen im Register</span></div>
      <div><strong>{health?.modules.length??"—"}</strong><span>Z1-Module gemeldet</span></div>
      <div><strong>{visible.length}</strong><span>Rollen angezeigt</span></div>
    </section>

    {!health?.reachable&&!loading&&<p className="notice" role="status">
      Das Rollenregister ist verfügbar. Die Z1-API antwortet derzeit nicht; Einzelstatus der Rollen werden nicht vorgetäuscht.
    </p>}

    <section aria-labelledby="roles-heading">
      <div className="section-heading"><div><p className="eyebrow">COUNCIL OF 33</p><h2 id="roles-heading">Fachrollen</h2></div>
        <div className="filters">
          <label><span className="sr-only">Rollen durchsuchen</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, Auftrag oder Fachgebiet"/></label>
          <label><span className="sr-only">Fachgebiet wählen</span><select value={domain} onChange={e=>setDomain(e.target.value)}>{domains.map(d=><option key={d}>{d}</option>)}</select></label>
        </div>
      </div>

      <div className="layout"><div className="role-grid">
        {visible.map(role=><button type="button" key={role.id} className={`role-card ${selected===role.id?"selected":""}`}
          onClick={()=>setSelected(selected===role.id?null:role.id)} aria-pressed={selected===role.id}>
          <span className="card-top"><span className="number">#{String(role.position).padStart(2,"0")}</span><span className="tag">Registriert</span></span>
          <strong>{role.name}</strong><span className="title">{role.title}</span><span className="domain">{role.domain}</span>
        </button>)}
        {!visible.length&&<p className="empty">Keine passende Rolle gefunden.</p>}
      </div>
      <aside className="details" aria-live="polite">
        {selectedRole?<><p className="eyebrow">ROLLE #{String(selectedRole.position).padStart(2,"0")}</p><h3>{selectedRole.name}</h3>
          <p className="detail-title">{selectedRole.title}</p><dl>
            <div><dt>Fachgebiet</dt><dd>{selectedRole.domain}</dd></div>
            <div><dt>Auftrag</dt><dd>{selectedRole.mission}</dd></div>
            <div><dt>Kommunikationsstil</dt><dd>{selectedRole.tone}</dd></div>
            <div><dt>Laufzeitstatus</dt><dd>Kein Einzelstatus-Endpunkt vorhanden</dd></div>
          </dl></>:<><p className="eyebrow">ROLLENDETAILS</p><h3>Rolle auswählen</h3><p>Tippe eine Karte an, um Auftrag und Fachgebiet zu sehen.</p></>}
      </aside></div>
    </section>
    <footer className="footer"><span>Quelle: Z1 Council-Register</span>
      <span>{health?.reachable?`Z1-Module: ${health.modules.join(" · ")||"keine gemeldet"}`:"Z1-Modulliste nicht verfügbar"}</span>
    </footer>
  </div></main>;
}
