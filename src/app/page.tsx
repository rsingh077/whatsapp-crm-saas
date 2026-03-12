import StatCard from "@/components/StatCard";
import Badge from "@/components/Badge";
import { supabase } from "@/lib/supabase";

async function getDashboardStats() {
  const [contacts, leads, tasks, conversations] = await Promise.allSettled([
    supabase.from("contacts").select("id, status"),
    supabase.from("leads").select("id, status, value"),
    supabase.from("tasks").select("id, status, priority"),
    supabase
      .from("conversations")
      .select("id, status")
      .eq("status", "active"),
  ]);

  const contactData =
    contacts.status === "fulfilled" ? contacts.value.data ?? [] : [];
  const leadData = leads.status === "fulfilled" ? leads.value.data ?? [] : [];
  const taskData = tasks.status === "fulfilled" ? tasks.value.data ?? [] : [];
  const convData =
    conversations.status === "fulfilled"
      ? conversations.value.data ?? []
      : [];

  const totalContacts = contactData.length;
  const activeContacts = contactData.filter(
    (c: { status: string }) => c.status === "active"
  ).length;

  const totalLeadValue = leadData.reduce(
    (sum: number, l: { value: number | null }) => sum + (l.value ?? 0),
    0
  );
  const wonLeads = leadData.filter(
    (l: { status: string }) => l.status === "won"
  ).length;

  const pendingTasks = taskData.filter(
    (t: { status: string }) => t.status === "pending"
  ).length;
  const highPriorityTasks = taskData.filter(
    (t: { priority: string }) => t.priority === "high"
  ).length;

  const activeConversations = convData.length;

  // Lead counts per stage
  const stages = ["new", "qualified", "proposal", "negotiation", "won", "lost"];
  const leadsByStage = stages.reduce(
    (acc, s) => {
      acc[s] = leadData.filter(
        (l: { status: string }) => l.status === s
      ).length;
      return acc;
    },
    {} as Record<string, number>
  );

  // Task counts per status
  const taskStatuses = ["pending", "in_progress", "completed"];
  const tasksByStatus = taskStatuses.reduce(
    (acc, s) => {
      acc[s] = taskData.filter(
        (t: { status: string }) => t.status === s
      ).length;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalContacts,
    activeContacts,
    totalLeadValue,
    wonLeads,
    pendingTasks,
    highPriorityTasks,
    activeConversations,
    totalLeads: leadData.length,
    leadsByStage,
    tasksByStatus,
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Contacts"
          value={stats.totalContacts}
          icon="👥"
          color="bg-blue-50"
          change={`${stats.activeContacts} active`}
        />
        <StatCard
          title="Pipeline Value"
          value={`$${stats.totalLeadValue.toLocaleString()}`}
          icon="🎯"
          color="bg-green-50"
          change={`${stats.wonLeads} won`}
        />
        <StatCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          icon="✅"
          color="bg-yellow-50"
          change={`${stats.highPriorityTasks} high priority`}
        />
        <StatCard
          title="Active Chats"
          value={stats.activeConversations}
          icon="💬"
          color="bg-purple-50"
        />
      </div>

      {/* Quick Summary Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pipeline Overview
          </h2>
          <div className="space-y-3">
            {[
              { label: "New", status: "new", color: "bg-gray-400" },
              { label: "Qualified", status: "qualified", color: "bg-blue-400" },
              { label: "Proposal", status: "proposal", color: "bg-yellow-400" },
              {
                label: "Negotiation",
                status: "negotiation",
                color: "bg-orange-400",
              },
              { label: "Won", status: "won", color: "bg-green-400" },
              { label: "Lost", status: "lost", color: "bg-red-400" },
            ].map((stage) => {
              const count = stats.leadsByStage[stage.status] ?? 0;
              const total = stats.totalLeads;
              return (
                <div key={stage.status} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24">
                    {stage.label}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${stage.color}`}
                      style={{
                        width: `${total ? (count / total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-6 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Task Summary
          </h2>
          <div className="space-y-4">
            {[
              {
                label: "Pending",
                status: "pending",
                icon: "⏳",
                variant: "warning" as const,
              },
              {
                label: "In Progress",
                status: "in_progress",
                icon: "🔄",
                variant: "info" as const,
              },
              {
                label: "Completed",
                status: "completed",
                icon: "✅",
                variant: "success" as const,
              },
            ].map((item) => {
              const count = stats.tasksByStatus[item.status] ?? 0;
              return (
                <div
                  key={item.status}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {item.label}
                    </span>
                  </div>
                  <Badge label={String(count)} variant={item.variant} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
