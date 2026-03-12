"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Conversation, Contact } from "@/types";
import Badge from "@/components/Badge";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "archived">("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ contact_id: "", phone_number: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [convRes, contactsRes] = await Promise.all([
      supabase
        .from("conversations")
        .select("*, contact:contacts(id,name,phone)")
        .order("last_message_at", { ascending: false, nullsFirst: false }),
      supabase.from("contacts").select("id, name, phone").order("name"),
    ]);
    setConversations(convRes.data ?? []);
    setContacts((contactsRes.data ?? []) as Contact[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const openNew = () => {
    setForm({ contact_id: "", phone_number: "" });
    setError("");
    setShowModal(true);
  };

  const handleContactChange = (contactId: string) => {
    const c = contacts.find((c) => c.id === contactId);
    setForm({ contact_id: contactId, phone_number: c?.phone ?? "" });
  };

  const handleCreate = async () => {
    if (!form.phone_number.trim()) {
      setError("Phone number is required.");
      return;
    }
    setSaving(true);
    setError("");

    const { error: err } = await supabase.from("conversations").insert([
      {
        contact_id: form.contact_id || null,
        phone_number: form.phone_number.trim(),
        status: "active",
      },
    ]);

    setSaving(false);
    if (err) {
      setError(err.message);
    } else {
      setShowModal(false);
      fetchData();
    }
  };

  const toggleArchive = async (conv: Conversation) => {
    const newStatus = conv.status === "active" ? "archived" : "active";
    await supabase
      .from("conversations")
      .update({ status: newStatus })
      .eq("id", conv.id);
    fetchData();
  };

  const filtered = conversations.filter(
    (c) => filterStatus === "all" || c.status === filterStatus
  );

  const formatTime = (ts: string | null) => {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Conversations</h1>
          <p className="text-gray-500 mt-1">{conversations.length} total conversations</p>
        </div>
        <button
          onClick={openNew}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + New Conversation
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "active", "archived"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === s
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Conversation List */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-400">No conversations found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filtered.map((conv, idx) => (
            <div
              key={conv.id}
              className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${
                idx < filtered.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-lg font-bold text-green-700 flex-shrink-0">
                {conv.contact?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>

              {/* Info */}
              <Link href={`/conversations/${conv.id}`} className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900 truncate">
                    {conv.contact?.name ?? conv.phone_number}
                  </p>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {formatTime(conv.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-sm text-gray-500 truncate">
                    {conv.last_message ?? "No messages yet"}
                  </p>
                  <Badge
                    label={conv.status}
                    variant={conv.status === "active" ? "success" : "default"}
                  />
                </div>
                {conv.contact?.name && (
                  <p className="text-xs text-gray-400">{conv.phone_number}</p>
                )}
              </Link>

              {/* Archive button */}
              <button
                onClick={() => toggleArchive(conv)}
                className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                title={conv.status === "active" ? "Archive" : "Unarchive"}
              >
                {conv.status === "active" ? "📂" : "📬"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New Conversation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              New Conversation
            </h2>
            {error && (
              <p className="text-red-600 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact (optional)
                </label>
                <select
                  value={form.contact_id}
                  onChange={(e) => handleContactChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">— Select contact —</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  value={form.phone_number}
                  onChange={(e) =>
                    setForm({ ...form, phone_number: e.target.value })
                  }
                  placeholder="+1-555-0100"
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
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? "Creating…" : "Start Chat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
