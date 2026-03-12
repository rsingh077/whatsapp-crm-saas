"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Lead, LeadStatus, Contact } from "@/types";
import Badge from "@/components/Badge";

const STAGES: { status: LeadStatus; label: string; color: string; variant: "default" | "info" | "warning" | "purple" | "success" | "danger" }[] = [
  { status: "new", label: "New", color: "border-gray-300", variant: "default" },
  { status: "qualified", label: "Qualified", color: "border-blue-300", variant: "info" },
  { status: "proposal", label: "Proposal", color: "border-yellow-300", variant: "warning" },
  { status: "negotiation", label: "Negotiation", color: "border-orange-300", variant: "purple" },
  { status: "won", label: "Won", color: "border-green-300", variant: "success" },
  { status: "lost", label: "Lost", color: "border-red-300", variant: "danger" },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [form, setForm] = useState({
    contact_id: "",
    title: "",
    description: "",
    value: "",
    status: "new" as LeadStatus,
    assigned_to: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [leadsRes, contactsRes] = await Promise.all([
      supabase
        .from("leads")
        .select("*, contact:contacts(id,name,phone)")
        .order("created_at", { ascending: false }),
      supabase.from("contacts").select("id, name, phone").order("name"),
    ]);
    setLeads((leadsRes.data ?? []) as Lead[]);
    setContacts((contactsRes.data ?? []) as Contact[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const openAdd = () => {
    setEditLead(null);
    setForm({
      contact_id: "",
      title: "",
      description: "",
      value: "",
      status: "new",
      assigned_to: "",
    });
    setError("");
    setShowModal(true);
  };

  const openEdit = (lead: Lead) => {
    setEditLead(lead);
    setForm({
      contact_id: lead.contact_id ?? "",
      title: lead.title,
      description: lead.description ?? "",
      value: lead.value != null ? String(lead.value) : "",
      status: lead.status,
      assigned_to: lead.assigned_to ?? "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      contact_id: form.contact_id || null,
      title: form.title.trim(),
      description: form.description.trim() || null,
      value: form.value ? parseFloat(form.value) : null,
      status: form.status,
      assigned_to: form.assigned_to.trim() || null,
    };

    let err;
    if (editLead) {
      ({ error: err } = await supabase
        .from("leads")
        .update(payload)
        .eq("id", editLead.id));
    } else {
      ({ error: err } = await supabase.from("leads").insert([payload]));
    }

    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      setShowModal(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    await supabase.from("leads").delete().eq("id", id);
    fetchData();
  };

  const handleStatusChange = async (lead: Lead, newStatus: LeadStatus) => {
    await supabase.from("leads").update({ status: newStatus }).eq("id", lead.id);
    fetchData();
  };

  const totalValue = leads.reduce((sum, l) => sum + (l.value ?? 0), 0);
  const wonValue = leads
    .filter((l) => l.status === "won")
    .reduce((sum, l) => sum + (l.value ?? 0), 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 mt-1">
            {leads.length} leads · Total pipeline:{" "}
            <span className="font-medium text-gray-700">
              ${totalValue.toLocaleString()}
            </span>{" "}
            · Won:{" "}
            <span className="font-medium text-green-600">
              ${wonValue.toLocaleString()}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setView("kanban")}
              className={`px-3 py-1.5 text-sm font-medium ${view === "kanban" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm font-medium ${view === "list" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              List
            </button>
          </div>
          <button
            onClick={openAdd}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Lead
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading…</div>
      ) : view === "kanban" ? (
        /* Kanban Board */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage.status);
            const stageValue = stageLeads.reduce(
              (sum, l) => sum + (l.value ?? 0),
              0
            );
            return (
              <div
                key={stage.status}
                className={`flex-shrink-0 w-72 bg-gray-50 rounded-xl border-t-4 ${stage.color} p-4`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge label={stage.label} variant={stage.variant} />
                    <span className="text-xs text-gray-500">
                      ({stageLeads.length})
                    </span>
                  </div>
                  {stageValue > 0 && (
                    <span className="text-xs font-medium text-gray-600">
                      ${stageValue.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {lead.title}
                        </h3>
                        <button
                          onClick={() => openEdit(lead)}
                          className="text-gray-400 hover:text-gray-600 text-xs ml-2"
                        >
                          ✏️
                        </button>
                      </div>
                      {lead.contact && (
                        <p className="text-xs text-gray-500 mb-1">
                          👤 {lead.contact.name}
                        </p>
                      )}
                      {lead.value != null && (
                        <p className="text-xs font-medium text-green-600">
                          ${lead.value.toLocaleString()}
                        </p>
                      )}
                      {lead.assigned_to && (
                        <p className="text-xs text-gray-400 mt-1">
                          Assigned: {lead.assigned_to}
                        </p>
                      )}
                      <div className="mt-3 flex gap-1 flex-wrap">
                        {STAGES.filter((s) => s.status !== stage.status)
                          .slice(0, 3)
                          .map((s) => (
                            <button
                              key={s.status}
                              onClick={() => handleStatusChange(lead, s.status)}
                              className="text-xs text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded transition-colors"
                            >
                              → {s.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">
                      No leads
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Contact</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Value</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-6 py-3 font-medium text-gray-600">Assigned To</th>
                <th className="text-right px-6 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{lead.title}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {lead.contact?.name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {lead.value != null ? `$${lead.value.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      label={lead.status}
                      variant={STAGES.find((s) => s.status === lead.status)?.variant ?? "default"}
                    />
                  </td>
                  <td className="px-6 py-4 text-gray-600">{lead.assigned_to ?? "—"}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEdit(lead)}
                      className="text-blue-600 hover:text-blue-800 mr-4 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(lead.id)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editLead ? "Edit Lead" : "Add Lead"}
            </h2>
            {error && (
              <p className="text-red-600 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <select
                  value={form.contact_id}
                  onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">— None —</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value ($)</label>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {STAGES.map((s) => (
                    <option key={s.status} value={s.status}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <input
                  type="text"
                  value={form.assigned_to}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Team member name…"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
