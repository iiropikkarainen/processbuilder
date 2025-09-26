import { useSupabaseClient } from "@supabase/auth-helpers-react"

const supabase = useSupabaseClient()

/**
 * ✅ Create a new ticket
 */
export async function createTicket({
  title,
  description,
  serviceDeskId,
  priority = "medium",
}: {
  title: string;
  description: string;
  serviceDeskId: string;
  priority?: "low" | "medium" | "high" | "urgent";
}) {
  const { data, error } = await supabase
    .from("tickets")
    .insert([
      {
        title,
        description,
        service_desk_id: serviceDeskId,
        priority,
      },
    ])
    .select();

  if (error) throw error;
  return data?.[0];
}

/**
 * ✅ Fetch tickets created by the current logged-in user
 */
export async function getMyTickets() {
  const { data, error } = await supabase
    .from("tickets")
    .select(
      `
      id,
      title,
      description,
      status,
      priority,
      created_at,
      service_desks ( name )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * ✅ Add a comment to a ticket
 */
export async function addTicketComment({
  ticketId,
  comment,
}: {
  ticketId: string;
  comment: string;
}) {
  const { data, error } = await supabase
    .from("ticket_comments")
    .insert([{ ticket_id: ticketId, comment }])
    .select();

  if (error) throw error;
  return data?.[0];
}

/**
 * ✅ Assign a ticket to a user
 */
export async function assignTicket({
  ticketId,
  userId,
}: {
  ticketId: string;
  userId: string;
}) {
  const { data, error } = await supabase
    .from("ticket_assignments")
    .insert([{ ticket_id: ticketId, assigned_to: userId }])
    .select();

  if (error) throw error;
  return data?.[0];
}