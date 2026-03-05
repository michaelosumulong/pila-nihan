import { toast } from "sonner";

interface PrintableTicket {
  ticketNumber: string;
  customerName: string;
  category: string;
  position: number;
  estimatedWaitMinutes: number;
}

export const printTicket = (ticket: PrintableTicket) => {
  const merchantData = JSON.parse(localStorage.getItem("pila-merchant") || "{}");
  const printWindow = window.open("", "", "width=300,height=400");

  if (!printWindow) {
    toast.error("Please allow popups to print tickets");
    return;
  }

  const categoryStyle =
    ticket.category === "priority"
      ? "background: #10B981; color: white;"
      : "background: #3B82F6; color: white;";

  const categoryLabel = ticket.category === "priority" ? "PRIORITY" : "REGULAR";

  printWindow.document.write(`
    <html>
    <head>
      <title>Ticket ${ticket.ticketNumber}</title>
      <style>
        @media print { @page { margin: 0; } body { margin: 10px; } }
        body { font-family: 'Courier New', monospace; padding: 15px; text-align: center; max-width: 250px; margin: 0 auto; }
        .ticket { border: 2px dashed #000; padding: 15px; background: white; }
        .logo { font-size: 40px; margin-bottom: 5px; }
        .title { font-size: 16px; font-weight: bold; margin: 5px 0; }
        .ticket-number { font-size: 56px; font-weight: bold; margin: 15px 0; letter-spacing: 2px; }
        .name { font-size: 14px; font-weight: bold; margin: 10px 0; }
        .info { font-size: 12px; margin: 8px 0; }
        .category { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 10px; font-weight: bold; margin: 8px 0; ${categoryStyle} }
        hr { border: none; border-top: 1px dashed #666; margin: 10px 0; }
        .footer { font-size: 9px; color: #666; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="logo">🎫</div>
        <div class="title">PILA-NIHAN™</div>
        <div class="ticket-number">${ticket.ticketNumber}</div>
        <div class="name">${ticket.customerName}</div>
        <div class="category">${categoryLabel}</div>
        <hr />
        <div class="info">Position: ${ticket.position}</div>
        <div class="info">Est. Wait: ${ticket.estimatedWaitMinutes} min</div>
        <hr />
        <div class="footer">
          ${merchantData.businessName || "Pila-nihan Queue"}<br />
          Ginhawa sa Bawat Pila<br />
          ${new Date().toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);

  printWindow.document.close();
  toast.info("Print dialog opened");
};
