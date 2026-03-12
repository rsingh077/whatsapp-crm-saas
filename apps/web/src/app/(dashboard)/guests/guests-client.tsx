'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn, getInitials, formatPhoneNumber } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  Star,
  UserPlus,
  Search,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Hotel,
  Filter,
  X,
  Loader2,
  Trash2,
} from 'lucide-react';

interface GuestsClientProps {
  guests: Array<{
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
    segment: string;
    vip: boolean;
    createdAt: Date;
    _count: { conversations: number; bookings: number };
    bookings: Array<{
      roomType: string | null;
      checkIn: Date;
      checkOut: Date;
      status: string;
    }>;
    tags: Array<{
      tag: { id: string; name: string; color: string };
    }>;
  }>;
  stats: {
    total: number;
    vip: number;
    new: number;
    returning: number;
  };
}

export function GuestsClient({ guests, stats }: GuestsClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    segment: 'NEW',
  });

  const handleAddGuest = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const payload: Record<string, string | undefined> = {
        phone: formData.phone,
        segment: formData.segment,
      };
      if (formData.name) payload.name = formData.name;
      if (formData.email) payload.email = formData.email;

      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to add guest');
        return;
      }
      setShowAddDialog(false);
      setFormData({ name: '', phone: '', email: '', segment: 'NEW' });
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGuest = async (guestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this guest? This cannot be undone.')) return;
    await fetch(`/api/guests/${guestId}`, { method: 'DELETE' });
    router.refresh();
  };

  const filteredGuests = guests
    .filter((guest) => {
      if (segmentFilter !== 'all') {
        if (segmentFilter === 'VIP') return guest.vip;
        return guest.segment === segmentFilter;
      }
      return true;
    })
    .filter((guest) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        guest.name?.toLowerCase().includes(q) ||
        guest.phone.includes(q) ||
        guest.email?.toLowerCase().includes(q)
      );
    });

  const segmentBadge = (segment: string, vip: boolean) => {
    if (vip) return <Badge variant="warning">VIP</Badge>;
    switch (segment) {
      case 'NEW': return <Badge variant="success">New</Badge>;
      case 'RETURNING': return <Badge variant="default">Returning</Badge>;
      case 'INACTIVE': return <Badge variant="outline">Inactive</Badge>;
      default: return <Badge variant="secondary">{segment}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">Guests</h1>
          <p className="text-sm text-muted-foreground">Manage your hotel guest profiles</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Add Guest
        </Button>
      </div>

      {/* Add Guest Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddDialog(false)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add New Guest</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddDialog(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <Label htmlFor="guest-name">Name</Label>
                <Input
                  id="guest-name"
                  placeholder="Guest name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="guest-phone">Phone (E.164 format) *</Label>
                <Input
                  id="guest-phone"
                  placeholder="+919876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Include country code, e.g. +91 for India</p>
              </div>
              <div>
                <Label htmlFor="guest-email">Email (optional)</Label>
                <Input
                  id="guest-email"
                  type="email"
                  placeholder="guest@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="guest-segment">Segment</Label>
                <select
                  id="guest-segment"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                >
                  <option value="NEW">New</option>
                  <option value="RETURNING">Returning</option>
                  <option value="VIP">VIP</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button
                  onClick={handleAddGuest}
                  disabled={!formData.phone || isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                  ) : (
                    <><UserPlus className="mr-2 h-4 w-4" /> Add Guest</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 p-6 sm:grid-cols-4">
        {[
          { label: 'Total Guests', value: stats.total, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'VIP Guests', value: stats.vip, icon: Star, color: 'text-amber-600 bg-amber-50' },
          { label: 'New Guests', value: stats.new, icon: UserPlus, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Returning', value: stats.returning, icon: Hotel, color: 'text-violet-600 bg-violet-50' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.color)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 px-6 pb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search guests..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {['all', 'NEW', 'RETURNING', 'VIP', 'INACTIVE'].map((seg) => (
            <Button
              key={seg}
              variant={segmentFilter === seg ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSegmentFilter(seg)}
            >
              {seg === 'all' ? 'All' : seg}
            </Button>
          ))}
        </div>
      </div>

      {/* Guest list */}
      <ScrollArea className="flex-1 px-6">
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Segment</th>
                <th className="px-4 py-3 font-medium">Conversations</th>
                <th className="px-4 py-3 font-medium">Bookings</th>
                <th className="px-4 py-3 font-medium">Last Booking</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => (
                <tr
                  key={guest.id}
                  className="border-b transition-colors hover:bg-muted/30 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback
                          className={cn(
                            'text-sm',
                            guest.vip
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-whatsapp/10 text-whatsapp-dark',
                          )}
                        >
                          {getInitials(guest.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{guest.name || 'Unknown'}</p>
                        <div className="flex gap-1 mt-0.5">
                          {guest.tags.slice(0, 2).map(({ tag }) => (
                            <span
                              key={tag.id}
                              className="inline-block rounded-full px-1.5 py-0 text-[10px]"
                              style={{ backgroundColor: tag.color + '20', color: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {formatPhoneNumber(guest.phone)}
                      </div>
                      {guest.email && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {guest.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{segmentBadge(guest.segment, guest.vip)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      {guest._count.conversations}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {guest._count.bookings}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {guest.bookings[0] ? (
                      <div className="text-sm">
                        <p>{guest.bookings[0].roomType || 'Standard'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(guest.bookings[0].checkIn).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No bookings</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                      onClick={(e) => handleDeleteGuest(guest.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredGuests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">No guests found</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
