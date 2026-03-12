'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Hotel,
  Users,
  MessageSquare,
  Key,
  CreditCard,
  Globe,
  Shield,
  Loader2,
  Check,
} from 'lucide-react';

type OrgData = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  timezone: string;
  plan: string;
  whatsappPhoneNumberId: string | null;
  whatsappAccessToken: string | null;
  whatsappBusinessId: string | null;
  webhookSecret: string | null;
  members: Array<{
    id: string;
    role: string;
    user: { id: string; name: string | null; email: string; image: string | null };
  }>;
};

interface SettingsClientProps {
  org: OrgData;
}

export function SettingsClient({ org }: SettingsClientProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: org.name,
    email: org.email || '',
    phone: org.phone || '',
    address: org.address || '',
    timezone: org.timezone,
  });

  const [editingWhatsApp, setEditingWhatsApp] = useState(false);
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const [whatsappForm, setWhatsappForm] = useState({
    whatsappPhoneNumberId: org.whatsappPhoneNumberId || '',
    whatsappAccessToken: org.whatsappAccessToken || '',
    whatsappBusinessId: org.whatsappBusinessId || '',
    webhookSecret: org.webhookSecret || '',
  });

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setEditing(false);
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save');
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWhatsApp() {
    setSavingWhatsApp(true);
    setError('');
    try {
      const res = await fetch('/api/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whatsappForm),
      });
      if (res.ok) {
        setEditingWhatsApp(false);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save WhatsApp settings');
      }
    } catch {
      setError('Network error');
    } finally {
      setSavingWhatsApp(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your hotel workspace and preferences
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="general" className="max-w-4xl">
          <TabsList>
            <TabsTrigger value="general" className="gap-2">
              <Hotel className="h-4 w-4" /> General
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" /> Team
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" /> Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hotel Information</CardTitle>
                <CardDescription>
                  Basic details about your hotel workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && <p className="text-sm text-red-500">{error}</p>}
                {saved && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Saved successfully
                  </p>
                )}

                {editing ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Hotel Name</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Slug</Label>
                      <Input value={org.slug} disabled className="opacity-50" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Address</Label>
                      <Input
                        value={form.address}
                        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Timezone</Label>
                      <Input
                        value={form.timezone}
                        onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Plan</Label>
                      <div className="mt-2">
                        <Badge variant="default">{org.plan}</Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Hotel Name</p>
                      <p className="mt-1">{org.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Slug</p>
                      <p className="mt-1 font-mono text-sm">{org.slug}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="mt-1">{org.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p className="mt-1">{org.phone || '—'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <p className="mt-1">{org.address || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Timezone</p>
                      <p className="mt-1">{org.timezone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Plan</p>
                      <Badge variant="default" className="mt-1">
                        {org.plan}
                      </Badge>
                    </div>
                  </div>
                )}

                <Separator />
                {editing ? (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    Edit Information
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-6 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    People who have access to this workspace
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {org.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-whatsapp/10 text-sm font-medium text-whatsapp-dark">
                          {(member.user.name || member.user.email)
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{member.role}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" /> WhatsApp Business API
                </CardTitle>
                <CardDescription>
                  Connect your WhatsApp Business account to start receiving messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingWhatsApp ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Phone Number ID</Label>
                      <Input
                        placeholder="e.g., 123456789012345"
                        value={whatsappForm.whatsappPhoneNumberId}
                        onChange={(e) =>
                          setWhatsappForm((f) => ({ ...f, whatsappPhoneNumberId: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Access Token</Label>
                      <Input
                        type="password"
                        placeholder="Your permanent access token"
                        value={whatsappForm.whatsappAccessToken}
                        onChange={(e) =>
                          setWhatsappForm((f) => ({ ...f, whatsappAccessToken: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Business ID</Label>
                      <Input
                        placeholder="e.g., 123456789012345"
                        value={whatsappForm.whatsappBusinessId}
                        onChange={(e) =>
                          setWhatsappForm((f) => ({ ...f, whatsappBusinessId: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Webhook Verify Token</Label>
                      <Input
                        placeholder="A secret token for webhook verification"
                        value={whatsappForm.webhookSecret}
                        onChange={(e) =>
                          setWhatsappForm((f) => ({ ...f, webhookSecret: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveWhatsApp} disabled={savingWhatsApp}>
                        {savingWhatsApp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save API Keys
                      </Button>
                      <Button variant="outline" onClick={() => setEditingWhatsApp(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {org.whatsappPhoneNumberId ? (
                      <div className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-sm font-medium">Connected</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Phone Number ID: {org.whatsappPhoneNumberId}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingWhatsApp(true)}
                        >
                          Update Keys
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed p-6 text-center">
                        <Globe className="mx-auto h-10 w-10 text-muted-foreground/50" />
                        <h3 className="mt-3 font-medium">Connect WhatsApp</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          You&apos;ll need a Meta Business account and WhatsApp Business API
                          access.
                        </p>
                        <Button
                          className="mt-4"
                          variant="outline"
                          onClick={() => setEditingWhatsApp(true)}
                        >
                          Configure API Keys
                        </Button>
                      </div>
                    )}

                    <div className="rounded-lg bg-muted/50 p-4">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Webhook URL
                      </h4>
                      <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
                        {typeof window !== 'undefined'
                          ? `${window.location.origin}/api/webhooks/whatsapp`
                          : 'https://your-domain.com/api/webhooks/whatsapp'}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Use this URL in your Meta App webhook configuration.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Plan</CardTitle>
                <CardDescription>Manage your subscription and billing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">
                      Current Plan:{' '}
                      <span className="text-whatsapp-dark">{org.plan}</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {org.plan === 'FREE'
                        ? 'Upgrade to unlock more features'
                        : 'Your plan renews monthly'}
                    </p>
                  </div>
                  <Button variant={org.plan === 'FREE' ? 'default' : 'outline'}>
                    {org.plan === 'FREE' ? 'Upgrade' : 'Manage'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
