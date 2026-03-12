'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Zap,
  Plus,
  MessageSquare,
  Calendar,
  UserPlus,
  LogIn,
  LogOut,
  Bell,
  X,
  Loader2,
  Trash2,
  Power,
  PowerOff,
} from 'lucide-react';

const triggerIcons: Record<string, typeof MessageSquare> = {
  MESSAGE_RECEIVED: MessageSquare,
  CONVERSATION_OPENED: MessageSquare,
  CONVERSATION_CLOSED: MessageSquare,
  BOOKING_CREATED: Calendar,
  BOOKING_CHECKIN: LogIn,
  BOOKING_CHECKOUT: LogOut,
  GUEST_CREATED: UserPlus,
  SCHEDULED: Bell,
};

const triggerLabels: Record<string, string> = {
  MESSAGE_RECEIVED: 'When message received',
  CONVERSATION_OPENED: 'When conversation opened',
  CONVERSATION_CLOSED: 'When conversation closed',
  BOOKING_CREATED: 'When booking created',
  BOOKING_CHECKIN: 'When guest checks in',
  BOOKING_CHECKOUT: 'When guest checks out',
  GUEST_CREATED: 'When new guest added',
  SCHEDULED: 'On schedule',
};

type AutomationData = {
  id: string;
  name: string;
  trigger: string;
  actions: Record<string, unknown>;
  isActive: boolean;
  priority: number;
};

interface AutomationClientProps {
  automations: AutomationData[];
}

export function AutomationClient({ automations }: AutomationClientProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    trigger: 'MESSAGE_RECEIVED',
    responseMessage: '',
  });

  async function handleCreate() {
    if (!form.name.trim() || !form.responseMessage.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          trigger: form.trigger,
          actions: { type: 'SEND_MESSAGE', message: form.responseMessage },
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ name: '', trigger: 'MESSAGE_RECEIVED', responseMessage: '' });
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create automation');
      }
    } catch {
      setError('Network error');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, currentActive: boolean) {
    try {
      await fetch('/api/automations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      router.refresh();
    } catch {
      console.error('Toggle failed');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this automation?')) return;
    try {
      const res = await fetch(`/api/automations?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    } catch {
      console.error('Delete failed');
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">Automation</h1>
          <p className="text-sm text-muted-foreground">
            Set up automated responses and workflows for your hotel
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Automation
        </Button>
      </div>

      {/* Create Automation Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Automation</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  placeholder="e.g., Welcome Message"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <Label>Trigger</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.trigger}
                  onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}
                >
                  {Object.entries(triggerLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Auto-Reply Message</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="e.g., Welcome to Grand Palace Hotel! How can we help you today?"
                  value={form.responseMessage}
                  onChange={(e) => setForm((f) => ({ ...f, responseMessage: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Automation
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        {automations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <Zap className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">No automations yet</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Create automations to auto-reply to guest messages, send check-in instructions,
              request feedback after checkout, and more.
            </p>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
              {[
                {
                  title: 'Welcome Message',
                  description: 'Auto-greet new guests when they message for the first time',
                  trigger: 'GUEST_CREATED',
                },
                {
                  title: 'Pre-Arrival Info',
                  description: 'Send check-in details and directions before arrival',
                  trigger: 'BOOKING_CHECKIN',
                },
                {
                  title: 'Checkout Feedback',
                  description: 'Request a review after guest checks out',
                  trigger: 'BOOKING_CHECKOUT',
                },
                {
                  title: 'FAQ Auto-Reply',
                  description: 'Auto-respond to common questions (Wi-Fi, menu, etc.)',
                  trigger: 'MESSAGE_RECEIVED',
                },
              ].map((suggestion) => {
                const Icon = triggerIcons[suggestion.trigger] || Zap;
                return (
                  <Card
                    key={suggestion.title}
                    className="cursor-pointer text-left transition-shadow hover:shadow-md"
                    onClick={() => {
                      setForm({
                        name: suggestion.title,
                        trigger: suggestion.trigger,
                        responseMessage: '',
                      });
                      setShowCreate(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                          <Icon className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{suggestion.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {automations.map((automation) => {
              const Icon = triggerIcons[automation.trigger] || Zap;
              return (
                <Card
                  key={automation.id}
                  className="transition-shadow hover:shadow-md"
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                        <Icon className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{automation.name}</p>
                          <Badge variant={automation.isActive ? 'success' : 'outline'}>
                            {automation.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {triggerLabels[automation.trigger] || automation.trigger}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={automation.isActive ? 'Deactivate' : 'Activate'}
                        onClick={() => handleToggle(automation.id, automation.isActive)}
                      >
                        {automation.isActive ? (
                          <PowerOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Power className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(automation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
