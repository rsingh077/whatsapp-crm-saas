export type ContactStatus = "active" | "inactive" | "blocked";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  status: ContactStatus;
  created_at: string;
}

export type LeadStatus =
  | "new"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export interface Lead {
  id: string;
  contact_id: string;
  title: string;
  description: string | null;
  value: number | null;
  status: LeadStatus;
  assigned_to: string | null;
  created_at: string;
  contact?: Contact;
}

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  contact_id: string | null;
  lead_id: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  contact?: Contact;
}

export type ConversationStatus = "active" | "archived";
export type MessageDirection = "inbound" | "outbound";

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  direction: MessageDirection;
  created_at: string;
}

export interface Conversation {
  id: string;
  contact_id: string;
  phone_number: string;
  last_message: string | null;
  last_message_at: string | null;
  status: ConversationStatus;
  created_at: string;
  contact?: Contact;
  messages?: Message[];
}
