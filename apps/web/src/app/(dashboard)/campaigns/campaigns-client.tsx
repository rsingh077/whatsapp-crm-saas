'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Send,
  Plus,
  Calendar,
  Users,
  CheckCheck,
  AlertCircle,
  X,
  Loader2,
  Trash2,
} from 'lucide-react';

type CampaignData = {
  id: string;
  name: string;
  status: string;
  scheduledAt: string | null;
  totalSent: number;
  totalRead: number;
  totalFailed: number;
  template: { name: string; body: string };
  _count: { recipients: number };
};

type TemplateData = {
  id: string;
  name: string;
  body: string;
};

type GuestData = {
  id: string;
  name: string | null;
  phone: string;
  segment: string;
};

interface CampaignsClientProps {
  campaigns: CampaignData[];
  templates: TemplateData[];
  guests: GuestData[];
}

export function CampaignsClient({ campaigns, templates, guests }: CampaignsClientProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    templateId: '',
    scheduledAt: '',
    recipientIds: [] as string[],
  });
  const [selectAll, setSelectAll] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState('all');

  const filteredGuests = guests.filter(
    (g) => segmentFilter === 'all' || g.segment === segmentFilter,
  );

  function toggleSelectAll() {
    if (selectAll) {
      setForm((f) => ({ ...f, recipientIds: [] }));
    } else {
      setForm((f) => ({ ...f, recipientIds: filteredGuests.map((g) => g.id) }));
    }
    setSelectAll(!selectAll);
  }

  function toggleGuest(id: string) {
    setForm((f) => ({
      ...f,
      recipientIds: f.recipientIds.includes(id)
        ? f.recipientIds.filter((r) => r !== id)
        : [...f.recipientIds, id],
    }));
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.templateId || form.recipientIds.length === 0) {
      setError('Please fill in campaign name, select a template, and choose recipients.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        templateId: form.templateId,
        recipientIds: form.recipientIds,
      };
      if (form.scheduledAt) body.scheduledAt = form.scheduledAt;

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ name: '', templateId: '', scheduledAt: '', recipientIds: [] });
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create campaign');
      }
    } catch {
      setError('Network error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this campaign?')) return;
    try {
      const res = await fetch(`/api/campaigns?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    } catch {
      console.error('Delete failed');
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="outline">Draft</Badge>;
      case 'SCHEDULED': return <Badge variant="warning">Scheduled</Badge>;
      case 'SENDING': return <Badge variant="default">Sending</Badge>;
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Send broadcast messages to your guests via WhatsApp templates
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Campaign
        </Button>
      </div>

      {/* Create Campaign Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Campaign</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            <div className="space-y-4">
              <div>
                <Label>Campaign Name</Label>
                <Input
                  placeholder="e.g., Summer Promo 2025"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <Label>Template</Label>
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    No templates available. Create a WhatsApp template first in Settings.
                  </p>
                ) : (
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.templateId}
                    onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}
                  >
                    <option value="">Select a template...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <Label>Schedule (optional)</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Recipients ({form.recipientIds.length} selected)</Label>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-8 rounded-md border text-xs px-2"
                      value={segmentFilter}
                      onChange={(e) => setSegmentFilter(e.target.value)}
                    >
                      <option value="all">All Segments</option>
                      <option value="VIP">VIP</option>
                      <option value="REGULAR">Regular</option>
                      <option value="NEW">New</option>
                      <option value="RETURNING">Returning</option>
                    </select>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={toggleSelectAll}>
                      {selectAll ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
                  {filteredGuests.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2 text-center">No guests found</p>
                  ) : (
                    filteredGuests.map((guest) => (
                      <label
                        key={guest.id}
                        className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50 cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={form.recipientIds.includes(guest.id)}
                          onChange={() => toggleGuest(guest.id)}
                          className="rounded"
                        />
                        <span>{guest.name || guest.phone}</span>
                        <Badge variant="outline" className="ml-auto text-[10px]">
                          {guest.segment}
                        </Badge>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Campaign
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6">
        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-whatsapp/10">
              <Send className="h-8 w-8 text-whatsapp" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">No campaigns yet</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Create your first broadcast campaign to send promotional messages, seasonal offers, or
              feedback requests to your guests.
            </p>
            <Button className="mt-6" onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Campaign
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      {statusBadge(campaign.status)}
                      {campaign.status === 'DRAFT' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(campaign.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    Template: {campaign.template.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {campaign._count.recipients} recipients
                    </div>
                    {campaign.scheduledAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(campaign.scheduledAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {campaign.status === 'COMPLETED' && (
                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCheck className="h-3 w-3" /> {campaign.totalSent} sent
                      </span>
                      <span className="flex items-center gap-1 text-blue-600">
                        <CheckCheck className="h-3 w-3" /> {campaign.totalRead} read
                      </span>
                      {campaign.totalFailed > 0 && (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-3 w-3" /> {campaign.totalFailed} failed
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
