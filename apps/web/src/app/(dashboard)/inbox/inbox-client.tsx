'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  Phone,
  MoreVertical,
  Clock,
  CheckCheck,
  Check,
  Star,
  Tag,
  User,
  Loader2,
  XCircle,
  CheckCircle,
} from 'lucide-react';

type ConversationWithRelations = {
  id: string;
  status: string;
  priority: string;
  lastMessageAt: Date | null;
  createdAt: Date;
  guest: {
    id: string;
    name: string | null;
    phone: string;
    segment: string;
    vip: boolean;
  };
  assignedAgent: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  messages: Array<{
    id: string;
    content: string | null;
    direction: string;
    type: string;
    status: string;
    createdAt: Date;
  }>;
  tags: Array<{
    tag: { id: string; name: string; color: string };
  }>;
};

interface InboxClientProps {
  conversations: ConversationWithRelations[];
  currentUserId: string;
}

type MessageData = {
  id: string;
  content: string | null;
  direction: string;
  type: string;
  status: string;
  createdAt: string;
  sender?: { id: string; name: string | null; image: string | null } | null;
};

export function InboxClient({ conversations, currentUserId }: InboxClientProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/messages?conversationId=${selectedId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setMessages(data.messages ?? []);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }
    loadMessages();
    return () => { cancelled = true; };
  }, [selectedId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!messageInput.trim() || !selectedId || sending) return;
    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);

    // Optimistic message
    const optimistic: MessageData = {
      id: `temp-${Date.now()}`,
      content,
      direction: 'OUTBOUND',
      type: 'TEXT',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedId, content, type: 'TEXT' }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? { ...data.message, createdAt: data.message.createdAt } : m)),
        );
        router.refresh(); // refresh conversation list
      } else {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? { ...m, status: 'FAILED' } : m)),
        );
        console.error('Send failed:', data.error);
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? { ...m, status: 'FAILED' } : m)),
      );
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(conversationId: string, newStatus: string) {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) router.refresh();
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setStatusUpdating(false);
    }
  }

  const filteredConversations = conversations.filter((conv) => {
    if (filter === 'mine') return conv.assignedAgent?.id === currentUserId;
    if (filter === 'unassigned') return !conv.assignedAgent;
    if (filter !== 'all') return conv.status === filter;
    return true;
  }).filter((conv) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      conv.guest.name?.toLowerCase().includes(q) ||
      conv.guest.phone.includes(q) ||
      conv.messages[0]?.content?.toLowerCase().includes(q)
    );
  });

  const selected = conversations.find((c) => c.id === selectedId);

  const statusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'success';
      case 'PENDING': return 'warning';
      case 'RESOLVED': return 'secondary';
      case 'CLOSED': return 'outline';
      default: return 'secondary';
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-500';
      case 'HIGH': return 'text-orange-500';
      case 'MEDIUM': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const messageStatusIcon = (status: string) => {
    switch (status) {
      case 'READ': return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
      case 'DELIVERED': return <CheckCheck className="h-3.5 w-3.5 text-gray-400" />;
      case 'SENT': return <Check className="h-3.5 w-3.5 text-gray-400" />;
      default: return <Clock className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  return (
    <div className="flex h-full">
      {/* Conversation List */}
      <div className="flex w-[380px] flex-col border-r">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <h1 className="text-lg font-semibold">Inbox</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-2">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1 text-xs">All</TabsTrigger>
              <TabsTrigger value="mine" className="flex-1 text-xs">Mine</TabsTrigger>
              <TabsTrigger value="unassigned" className="flex-1 text-xs">Unassigned</TabsTrigger>
              <TabsTrigger value="OPEN" className="flex-1 text-xs">Open</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conversation list */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={cn(
                  'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                  selectedId === conv.id && 'bg-muted',
                )}
              >
                <div className="relative">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback
                      className={cn(
                        'text-sm',
                        conv.guest.vip
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-whatsapp/10 text-whatsapp-dark',
                      )}
                    >
                      {getInitials(conv.guest.name)}
                    </AvatarFallback>
                  </Avatar>
                  {conv.guest.vip && (
                    <Star className="absolute -right-1 -top-1 h-4 w-4 fill-amber-400 text-amber-400" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">
                      {conv.guest.name || conv.guest.phone}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {conv.lastMessageAt
                        ? formatRelativeTime(conv.lastMessageAt)
                        : formatRelativeTime(conv.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {conv.messages[0]?.direction === 'OUTBOUND' &&
                      messageStatusIcon(conv.messages[0].status)}
                    <p className="truncate text-sm text-muted-foreground">
                      {conv.messages[0]?.content || 'No messages yet'}
                    </p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Badge variant={statusColor(conv.status) as 'default'} className="text-[10px] px-1.5 py-0">
                      {conv.status}
                    </Badge>
                    {conv.tags.slice(0, 2).map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium"
                        style={{ backgroundColor: tag.color + '20', color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {selected ? (
        <div className="flex flex-1 flex-col">
          {/* Chat header */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-whatsapp/10 text-sm text-whatsapp-dark">
                  {getInitials(selected.guest.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">
                    {selected.guest.name || selected.guest.phone}
                  </h2>
                  {selected.guest.vip && (
                    <Badge variant="warning" className="text-[10px]">VIP</Badge>
                  )}
                  <span className={cn('text-sm', priorityColor(selected.priority))}>
                    ● {selected.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selected.guest.phone}
                  {selected.assignedAgent && ` · Assigned to ${selected.assignedAgent.name}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {selected.status === 'OPEN' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  disabled={statusUpdating}
                  onClick={() => handleStatusChange(selected.id, 'RESOLVED')}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Resolve
                </Button>
              )}
              {selected.status === 'RESOLVED' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  disabled={statusUpdating}
                  onClick={() => handleStatusChange(selected.id, 'CLOSED')}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Close
                </Button>
              )}
              {(selected.status === 'RESOLVED' || selected.status === 'CLOSED') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  disabled={statusUpdating}
                  onClick={() => handleStatusChange(selected.id, 'OPEN')}
                >
                  Reopen
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Tag className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <User className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 bg-[#e5ddd5] dark:bg-zinc-900">
            <div className="mx-auto max-w-3xl space-y-3 p-6">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No messages in this conversation yet
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isOutbound = msg.direction === 'OUTBOUND';
                    return (
                      <div
                        key={msg.id}
                        className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[70%] rounded-lg px-3 py-2 shadow-sm',
                            isOutbound
                              ? 'bg-[#dcf8c6] dark:bg-green-900 text-gray-900 dark:text-gray-100'
                              : 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100',
                          )}
                        >
                          {!isOutbound && msg.sender?.name && (
                            <p className="text-xs font-medium text-whatsapp-dark mb-0.5">
                              {msg.sender.name}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className="mt-1 flex items-center justify-end gap-1">
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isOutbound && messageStatusIcon(msg.status)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message input */}
          <div className="border-t bg-white p-4 dark:bg-zinc-950">
            <div className="mx-auto flex max-w-3xl items-end gap-2">
              <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
                <Paperclip className="h-5 w-5 text-muted-foreground" />
              </Button>
              <div className="relative flex-1">
                <Input
                  placeholder="Type a message..."
                  className="pr-10 rounded-xl bg-muted/50"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && messageInput.trim()) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                >
                  <Smile className="h-5 w-5 text-muted-foreground" />
                </Button>
              </div>
              <Button
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full bg-whatsapp hover:bg-whatsapp-dark"
                disabled={!messageInput.trim() || sending}
                onClick={handleSend}
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-whatsapp/10">
            <MessageSquare className="h-10 w-10 text-whatsapp" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Welcome to HotelCRM Inbox</h2>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Select a conversation to start chatting with your guests via WhatsApp
          </p>
        </div>
      )}
    </div>
  );
}
