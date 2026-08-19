"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Status = "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost";
type Section = "overview" | "leads" | "pipeline" | "activity";
type Lead = {
  id: number;
  name: string;
  email: string;
  company: string;
  value: number;
  status: Status;
  source: string;
  createdAt: string;
};

const statuses: Status[] = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

const initials = (name: string) =>
  name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const parseDate = (value: string) =>
  new Date(value.length === 10 ? `${value}T00:00:00` : `${value.replace(" ", "T")}Z`);

const formatDate = (value: string) =>
  parseDate(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Status | "All">("All");
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [isSaving, setSaving] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/leads", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load leads");
      const data = (await response.json()) as { leads?: Lead[] };
      setLeads(Array.isArray(data.leads) ? data.leads : []);
    } catch {
      setLoadError("Your leads could not be loaded. Please retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [notice]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalOpen(false);
        setEditingLead(null);
        setDeletingLead(null);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredLeads = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return leads.filter((lead) => {
      const matchesStatus = filter === "All" || lead.status === filter;
      const matchesQuery = !normalized || `${lead.name} ${lead.email} ${lead.company}`.toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [filter, leads, query]);

  const openLeads = leads.filter((lead) => !["Won", "Lost"].includes(lead.status));
  const wonLeads = leads.filter((lead) => lead.status === "Won");
  const activeValue = openLeads.reduce((sum, lead) => sum + lead.value, 0);
  const wonValue = wonLeads.reduce((sum, lead) => sum + lead.value, 0);
  const conversion = leads.length ? Math.round((wonLeads.length / leads.length) * 100) : 0;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const addedThisMonth = leads.filter((lead) => {
    const date = parseDate(lead.createdAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
  const today = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase();
  const pageCopy: Record<Section, { eyebrow: string; title: string; subtitle: string }> = {
    overview: { eyebrow: today, title: "Good morning, Sudip.", subtitle: "Here's a live view of your sales pipeline." },
    leads: { eyebrow: "LEAD DIRECTORY", title: "All leads", subtitle: "Search, review, and update every opportunity in one place." },
    pipeline: { eyebrow: "PIPELINE", title: "Sales pipeline", subtitle: "See the value and movement across every stage." },
    activity: { eyebrow: "ACTIVITY", title: "Recent activity", subtitle: "Review the latest additions and pipeline updates." },
  };

  function goTo(section: Section, nextFilter?: Status | "All") {
    if (nextFilter) setFilter(nextFilter);
    setActiveSection(section);
    setProfileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function addLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const draft = {
      name: String(data.get("name")),
      email: String(data.get("email")),
      company: String(data.get("company")),
      value: Number(data.get("value")),
      status: String(data.get("status")) as Status,
      source: String(data.get("source")),
    };
    setSaving(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!response.ok) throw new Error("Save failed");
      const result = (await response.json()) as { lead: Lead };
      setLeads((current) => [result.lead, ...current]);
      setModalOpen(false);
      setNotice(`${result.lead.name} was added to your pipeline.`);
    } catch {
      setNotice("We couldn't save that lead. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: number, status: Status) {
    const previous = leads;
    setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, status } : lead));
    try {
      const response = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) throw new Error("Update failed");
      setNotice("Lead status updated.");
    } catch {
      setLeads(previous);
      setNotice("Status update failed. Please try again.");
    }
  }

  async function editLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingLead) return;
    const data = new FormData(event.currentTarget);
    const update = {
      id: editingLead.id,
      name: String(data.get("name")),
      email: String(data.get("email")),
      company: String(data.get("company")),
      value: Number(data.get("value")),
      status: String(data.get("status")) as Status,
      source: String(data.get("source")),
    };
    setSaving(true);
    try {
      const response = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!response.ok) throw new Error("Update failed");
      const result = (await response.json()) as { lead: Lead };
      setLeads((current) => current.map((lead) => lead.id === result.lead.id ? result.lead : lead));
      setEditingLead(null);
      setNotice(`${result.lead.name}'s details were updated.`);
    } catch {
      setNotice("We couldn't update that lead. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLead() {
    if (!deletingLead) return;
    setDeleting(true);
    try {
      const response = await fetch("/api/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingLead.id }),
      });
      if (!response.ok) throw new Error("Delete failed");
      setLeads((current) => current.filter((lead) => lead.id !== deletingLead.id));
      setNotice(`${deletingLead.name} was deleted.`);
      setDeletingLead(null);
    } catch {
      setNotice("We couldn't delete that lead. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  function exportCSV(exportLeads = filteredLeads) {
    if (!exportLeads.length) {
      setNotice("There are no leads to export yet.");
      return;
    }
    const headers = ["Name", "Email", "Company", "Deal Value (INR)", "Status", "Source", "Created"];
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = exportLeads.map((lead) => [lead.name, lead.email, lead.company, lead.value, lead.status, lead.source, lead.createdAt]);
    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `leadflow-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`${exportLeads.length} ${exportLeads.length === 1 ? "lead" : "leads"} exported to CSV.`);
  }

  const navItems: { id: Section; label: string; icon: string; count?: number }[] = [
    { id: "overview", label: "Overview", icon: "⌂" },
    { id: "leads", label: "All leads", icon: "◎", count: leads.length },
    { id: "pipeline", label: "Pipeline", icon: "◇" },
    { id: "activity", label: "Activity", icon: "◷" },
  ];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">L</span><span>Leadflow</span></div>
        <nav aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              className={`nav-item ${activeSection === item.id ? "active" : ""}`}
              type="button"
              key={item.id}
              onClick={() => goTo(item.id, item.id === "leads" ? "All" : undefined)}
              aria-current={activeSection === item.id ? "page" : undefined}
            >
              <span className="nav-icon">{item.icon}</span>{item.label}
              {typeof item.count === "number" && <span className="nav-count">{item.count}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-card"><span className="mini-label">WORKSPACE</span><strong>Sudip&apos;s Studio</strong><span>{leads.length} {leads.length === 1 ? "lead" : "leads"}</span></div>
          <div className="profile-wrap">
            <button className="profile" type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={isProfileOpen} aria-haspopup="menu">
              <span className="avatar dark">SC</span><span><strong>Sudip Chowdhury</strong><small>Workspace owner</small></span><span>•••</span>
            </button>
            {isProfileOpen && (
              <div className="profile-menu" role="menu">
                <span className="menu-label">SUDIP&apos;S STUDIO</span>
                <button type="button" role="menuitem" onClick={() => goTo("activity")}>View recent activity <span>→</span></button>
                <button type="button" role="menuitem" onClick={() => { exportCSV(leads); setProfileOpen(false); }}>Export all leads <span>⇩</span></button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar" id="overview">
          <div><p className="eyebrow">{pageCopy[activeSection].eyebrow}</p><h1>{pageCopy[activeSection].title}</h1><p className="subtitle">{pageCopy[activeSection].subtitle}</p></div>
          <div className="top-actions"><button className="button secondary" type="button" onClick={() => exportCSV()}><span>⇩</span> Export CSV</button><button className="button primary" type="button" onClick={() => setModalOpen(true)}><span>＋</span> Add new lead</button></div>
        </header>

        {loadError && <div className="data-alert" role="alert"><span>{loadError}</span><button type="button" onClick={loadLeads}>Retry</button></div>}

        <section className={`metric-grid ${activeSection === "overview" ? "" : "section-hidden"}`} aria-label="Pipeline summary">
          <article className="metric-card coral"><div className="metric-top"><span>Total leads</span><span className="metric-icon">◎</span></div><strong>{isLoading ? "—" : leads.length}</strong><div className="trend"><b>{addedThisMonth}</b><span>added this month</span></div></article>
          <article className="metric-card cream"><div className="metric-top"><span>Pipeline value</span><span className="metric-icon">₹</span></div><strong>{isLoading ? "—" : currency(activeValue)}</strong><div className="trend"><b>{openLeads.length}</b><span>active opportunities</span></div></article>
          <article className="metric-card navy"><div className="metric-top"><span>Conversion rate</span><span className="metric-icon light">%</span></div><strong>{isLoading ? "—" : `${conversion}%`}</strong><div className="trend light-text"><b>{wonLeads.length}</b><span>closed-won leads</span></div><div className="progress-ring"><span>{wonLeads.length}/{leads.length}</span></div></article>
          <article className="metric-card sage"><div className="metric-top"><span>Won revenue</span><span className="metric-icon">✓</span></div><strong>{isLoading ? "—" : currency(wonValue)}</strong><div className="trend"><b>Live</b><span>closed-won total</span></div></article>
        </section>

        <section className={`pipeline ${activeSection === "overview" || activeSection === "pipeline" ? "" : "section-hidden"}`} id="pipeline">
          <div className="section-heading"><div><span className="section-kicker">PIPELINE HEALTH</span><h2>Where your opportunities stand</h2></div><button className="text-button" type="button" onClick={() => goTo("pipeline", "All")}>View full pipeline <span>→</span></button></div>
          <div className="stage-row">
            {(["New", "Contacted", "Qualified", "Proposal", "Won"] as Status[]).map((status, index) => {
              const matches = leads.filter((lead) => lead.status === status);
              return <button className="stage" key={status} type="button" onClick={() => goTo("leads", status)} aria-label={`View ${status} leads`}><span className={`stage-number s${index}`}>{matches.length}</span><span><strong>{status}</strong><small>{currency(matches.reduce((sum, lead) => sum + lead.value, 0))}</small></span>{index < 4 && <em>→</em>}</button>;
            })}
          </div>
        </section>

        <section className={`leads-panel ${activeSection === "overview" || activeSection === "pipeline" || activeSection === "leads" ? "" : "section-hidden"}`} id="leads">
          <div className="section-heading table-heading"><div><span className="section-kicker">LEAD DIRECTORY</span><h2>All leads</h2></div><div className="table-tools"><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads..." aria-label="Search leads" /></label><select value={filter} onChange={(event) => setFilter(event.target.value as Status | "All")} aria-label="Filter by status"><option>All</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Lead</th><th>Company</th><th>Value (INR)</th><th>Status</th><th>Source</th><th>Date added</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>{filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td><div className="lead-person"><span className="avatar">{initials(lead.name)}</span><span><strong>{lead.name}</strong><small>{lead.email}</small></span></div></td>
                  <td>{lead.company}</td>
                  <td><strong>{currency(lead.value)}</strong></td>
                  <td><select className={`status-pill ${lead.status.toLowerCase()}`} value={lead.status} onChange={(event) => updateStatus(lead.id, event.target.value as Status)} aria-label={`Status for ${lead.name}`}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></td>
                  <td>{lead.source}</td>
                  <td>{formatDate(lead.createdAt)}</td>
                  <td><div className="row-actions"><button className="icon-button" type="button" onClick={() => setEditingLead(lead)} aria-label={`Edit ${lead.name}`}>Edit</button><button className="icon-button danger" type="button" onClick={() => setDeletingLead(lead)} aria-label={`Delete ${lead.name}`}>Delete</button></div></td>
                </tr>
              ))}</tbody>
            </table>
            {!isLoading && !filteredLeads.length && <div className="empty-state"><span>◇</span><h3>{leads.length ? "No matching leads" : "Your pipeline is ready"}</h3><p>{leads.length ? "Try a different search or status filter." : "Add your first lead to start tracking opportunities."}</p>{!leads.length && <button className="button primary" type="button" onClick={() => setModalOpen(true)}>＋ Add your first lead</button>}</div>}
            {isLoading && <div className="empty-state"><span className="loader" /><h3>Loading your leads</h3><p>This will only take a moment.</p></div>}
          </div>
          <div className="table-footer"><span>Showing {filteredLeads.length} of {leads.length} leads</span>{leads.length > 0 && <span className="page-number">1</span>}</div>
        </section>

        <section className={`activity-panel ${activeSection === "activity" ? "" : "section-hidden"}`} id="activity">
          <div className="section-heading"><div><span className="section-kicker">RECENT ACTIVITY</span><h2>Latest pipeline updates</h2></div><button className="text-button" type="button" onClick={() => goTo("leads", "All")}>Manage leads <span>→</span></button></div>
          {leads.length ? <div className="activity-list">{leads.slice(0, 5).map((lead) => <button key={lead.id} type="button" className="activity-item" onClick={() => { setQuery(lead.name); goTo("leads", "All"); }}><span className="activity-dot" /><span><strong>{lead.name}</strong><small>{lead.company} · {lead.status}</small></span><time>{formatDate(lead.createdAt)}</time></button>)}</div> : <div className="activity-empty"><span>◷</span><div><strong>No activity yet</strong><p>New leads and pipeline changes will appear here.</p></div></div>}
        </section>
      </section>

      {isModalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-lead-title"><button className="close" type="button" onClick={() => setModalOpen(false)} aria-label="Close">×</button><span className="section-kicker">NEW OPPORTUNITY</span><h2 id="add-lead-title">Add a lead</h2><p>Capture the essentials now. You can update their status anytime.</p><form onSubmit={addLead}><div className="form-grid"><label>Full name<input name="name" required placeholder="e.g. Neha Sharma" autoFocus /></label><label>Work email<input name="email" type="email" required placeholder="neha@company.com" /></label><label>Company<input name="company" required placeholder="Company name" /></label><label>Deal value (INR)<input name="value" type="number" min="0" required placeholder="50000" /></label><label>Status<select name="status" defaultValue="New">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>Source<select name="source" defaultValue="Website"><option>Website</option><option>Referral</option><option>LinkedIn</option><option>Event</option><option>Cold outreach</option></select></label></div><div className="modal-actions"><button className="button secondary" type="button" onClick={() => setModalOpen(false)} disabled={isSaving}>Cancel</button><button className="button primary" type="submit" disabled={isSaving}>{isSaving ? "Saving…" : "Add to pipeline"}</button></div></form></section></div>}
      {editingLead && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingLead(null); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-lead-title"><button className="close" type="button" onClick={() => setEditingLead(null)} aria-label="Close edit lead">×</button><span className="section-kicker">LEAD DETAILS</span><h2 id="edit-lead-title">Edit {editingLead.name}</h2><p>Update the contact, opportunity value, source, or pipeline stage.</p><form onSubmit={editLead}><div className="form-grid"><label>Full name<input name="name" required defaultValue={editingLead.name} autoFocus /></label><label>Work email<input name="email" type="email" required defaultValue={editingLead.email} /></label><label>Company<input name="company" required defaultValue={editingLead.company} /></label><label>Deal value (INR)<input name="value" type="number" min="0" required defaultValue={editingLead.value} /></label><label>Status<select name="status" defaultValue={editingLead.status}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>Source<select name="source" defaultValue={editingLead.source}><option>Website</option><option>Referral</option><option>LinkedIn</option><option>Event</option><option>Cold outreach</option></select></label></div><div className="modal-actions"><button className="button secondary" type="button" onClick={() => setEditingLead(null)} disabled={isSaving}>Cancel</button><button className="button primary" type="submit" disabled={isSaving}>{isSaving ? "Saving…" : "Save changes"}</button></div></form></section></div>}
      {deletingLead && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isDeleting) setDeletingLead(null); }}><section className="modal delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-lead-title" aria-describedby="delete-lead-description"><span className="delete-symbol">!</span><span className="section-kicker">DELETE LEAD</span><h2 id="delete-lead-title">Delete {deletingLead.name}?</h2><p id="delete-lead-description">This permanently removes the lead and its opportunity details. This action cannot be undone.</p><div className="modal-actions"><button className="button secondary" type="button" onClick={() => setDeletingLead(null)} disabled={isDeleting}>Keep lead</button><button className="button danger-button" type="button" onClick={deleteLead} disabled={isDeleting}>{isDeleting ? "Deleting…" : "Delete lead"}</button></div></section></div>}
      {notice && <div className="toast" role="status"><span>✓</span>{notice}</div>}
    </main>
  );
}
