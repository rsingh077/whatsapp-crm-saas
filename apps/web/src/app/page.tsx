import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Users,
  Zap,
  BarChart3,
  Shield,
  Globe,
  ArrowRight,
  CheckCircle2,
  Hotel,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-whatsapp text-white">
              <Hotel className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">HotelCRM</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
          <span className="h-2 w-2 rounded-full bg-whatsapp" />
          Powered by WhatsApp Business API
        </div>
        <h1 className="mt-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
          Your Hotel&apos;s
          <span className="block text-whatsapp-dark">WhatsApp Command Center</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Manage guest conversations, automate bookings, send broadcasts, and deliver exceptional
          hospitality — all through WhatsApp. Built for modern hotels that want to stand out.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="h-12 px-8 text-base">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              See Features
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to delight your guests
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            A complete CRM built specifically for the hospitality industry
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: MessageSquare,
              title: 'Smart Inbox',
              description:
                'Real-time WhatsApp messaging with agent assignment, tags, and internal notes. Never miss a guest message.',
            },
            {
              icon: Users,
              title: 'Guest CRM',
              description:
                'Auto-create guest profiles, track preferences, booking history, and segment guests for personalized service.',
            },
            {
              icon: Zap,
              title: 'Automation',
              description:
                'Auto-send check-in details, Wi-Fi passwords, feedback requests, and more. Set it and forget it.',
            },
            {
              icon: BarChart3,
              title: 'Analytics',
              description:
                'Track response times, agent performance, guest satisfaction, and booking conversions at a glance.',
            },
            {
              icon: Globe,
              title: 'Broadcast Campaigns',
              description:
                'Send seasonal offers, event invitations, and loyalty promotions to segmented guest lists.',
            },
            {
              icon: Shield,
              title: 'Multi-Tenant & Secure',
              description:
                'Each hotel gets its own workspace. Role-based access for owners, managers, and agents.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border bg-white p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-whatsapp/10 text-whatsapp-dark transition-colors group-hover:bg-whatsapp group-hover:text-white">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Get started in minutes
            </h2>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Connect WhatsApp',
                description: 'Link your WhatsApp Business number through the Meta Cloud API.',
              },
              {
                step: '02',
                title: 'Set Up Your Team',
                description: 'Invite your front desk and concierge staff with appropriate roles.',
              },
              {
                step: '03',
                title: 'Start Conversations',
                description:
                  'Receive and respond to guest messages. Set up automations to scale.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-whatsapp text-2xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">Start free, upgrade when you&apos;re ready</p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-3">
          {[
            {
              name: 'Free',
              price: '₹0',
              description: 'Perfect to get started',
              features: ['2 team members', '100 guests', '500 messages/month', 'Basic inbox'],
            },
            {
              name: 'Professional',
              price: '₹4,999',
              description: 'For growing hotels',
              features: [
                '15 team members',
                '10,000 guests',
                '25,000 messages/month',
                'Automation & campaigns',
                'Analytics dashboard',
              ],
              popular: true,
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              description: 'For hotel chains',
              features: [
                'Unlimited everything',
                'API access',
                'Custom integrations',
                'Priority support',
                'Dedicated manager',
              ],
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-8 ${
                plan.popular
                  ? 'border-whatsapp bg-white shadow-lg ring-1 ring-whatsapp'
                  : 'bg-white shadow-sm'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-whatsapp px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.price !== 'Custom' && (
                  <span className="text-muted-foreground">/month</span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-whatsapp" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 block">
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  Get Started
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-whatsapp text-white">
                <Hotel className="h-4 w-4" />
              </div>
              <span className="font-semibold">HotelCRM</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} HotelCRM. Built with ❤️ for the hospitality industry.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
