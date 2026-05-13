"use client";

// ─── CSV Export ────────────────────────────────────
export function exportToCSV(data: Record<string, any>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          let val = row[h] ?? "";
          // Escape commas and quotes
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(",")
    ),
  ];

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── PDF Export (using browser print) ──────────────
export function exportToPDF(title: string, data: Record<string, any>[], columns: { key: string; label: string }[]) {
  if (data.length === 0) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const tableRows = data
    .map(
      (row) =>
        `<tr>${columns
          .map(
            (col) =>
              `<td style="border:1px solid #ddd;padding:8px;font-size:12px;">${row[col.key] ?? "—"}</td>`
          )
          .join("")}</tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { font-size: 20px; color: #1E3A5F; margin-bottom: 4px; }
        .subtitle { font-size: 12px; color: #888; margin-bottom: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 2px solid #1E3A5F; padding-bottom: 12px; }
        .logo { font-size: 24px; font-weight: bold; color: #1E3A5F; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #1E3A5F; color: white; padding: 10px 8px; font-size: 12px; text-align: left; }
        tr:nth-child(even) { background: #f8f9fa; }
        .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 10px; color: #888; text-align: center; }
        .stats { display: flex; gap: 24px; margin-bottom: 16px; }
        .stat-box { background: #f0f4ff; padding: 12px 16px; border-radius: 8px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #1E3A5F; }
        .stat-label { font-size: 11px; color: #888; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">RWATRACK</div>
          <div class="subtitle">AI-Driven Government Employee Residence Tracking System</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;color:#888;">Generated on</div>
          <div style="font-size:14px;font-weight:bold;">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
      </div>

      <h1>${title}</h1>
      <div class="subtitle">Total records: ${data.length}</div>

      <table>
        <thead>
          <tr>${columns.map((c) => `<th>${c.label}</th>`).join("")}</tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      <div class="footer">
        RWATRACK &copy; ${new Date().getFullYear()} | University of Rwanda | School of ICT | Confidential
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  // Wait for content to load then trigger print
  printWindow.onload = () => {
    printWindow.print();
  };
}
