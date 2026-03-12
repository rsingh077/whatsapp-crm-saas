"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Conversation, Message } from "@/types";

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversation = useCallback(async () => {
    const [convRes, msgRes] = await Promise.all([
      supabase
        .from("conversations")
        .select("*, contact:contacts(id,name,phone)")
        .eq("id", id)
        .single(),
      supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true }),
    ]);

    if (convRes.error || !convRes.data) {
      router.push("/conversations");
      return;
    }

    setConversation(convRes.data);
    setMessages(msgRes.data ?? []);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConversation();
  }, [fetchConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || sending) return;

    setSending(true);
    setNewMessage("");

    const { data: msg, error } = await supabase
      .from("messages")
      .insert([{ conversation_id: id, content, direction: "outbound" }])
      .select()
      .single();

    if (!error && msg) {
      await supabase
        .from("conversations")
        .update({ last_message: content, last_message_at: msg.created_at })
        .eq("id", id);

      setMessages((prev) => [...prev, msg]);
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Loading…
      </div>
    );
  }

  if (!conversation) return null;

  const contactName =
    conversation.contact?.name ?? conversation.phone_number;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4 shadow-sm">
        <Link
          href="/conversations"
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back
        </Link>
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg font-bold text-green-700">
          {contactName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">{contactName}</h1>
          <p className="text-xs text-gray-500">{conversation.phone_number}</p>
        </div>
        <div className="ml-auto">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              conversation.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {conversation.status}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-16">
            <p className="text-4xl mb-3">💬</p>
            <p>No messages yet. Send the first message!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.direction === "outbound" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                  msg.direction === "outbound"
                    ? "bg-green-500 text-white rounded-br-sm"
                    : "bg-white text-gray-900 rounded-bl-sm border border-gray-100"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.direction === "outbound"
                      ? "text-green-100"
                      : "text-gray-400"
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {msg.direction === "outbound" && " ✓"}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-100 px-6 py-4">
        <div className="flex items-end gap-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={2}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={conversation.status === "archived"}
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim() || conversation.status === "archived"}
            className="bg-green-500 hover:bg-green-600 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {sending ? (
              <span className="text-lg">⏳</span>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="currentColor"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
        {conversation.status === "archived" && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            This conversation is archived. Unarchive it to send messages.
          </p>
        )}
      </div>
    </div>
  );
}
