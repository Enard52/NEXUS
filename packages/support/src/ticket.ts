export interface SupportTicket {
  id: string;
  email: string;
  subject: string;
  message: string;
  status: "open" | "closed";
  createdAt: string;
}

export class SupportService {
  private tickets: SupportTicket[] = [];

  createTicket(email: string, subject: string, message: string): SupportTicket {
    const ticket: SupportTicket = {
      id: "ticket-" + Math.random().toString(36).slice(2, 9),
      email,
      subject,
      message,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    this.tickets.push(ticket);
    return ticket;
  }

  getTickets(email: string): SupportTicket[] {
    return this.tickets.filter((t) => t.email === email);
  }
}
