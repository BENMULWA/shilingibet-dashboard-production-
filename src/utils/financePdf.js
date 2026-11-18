import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

const kes = (value) =>
  value == null ? "-" : (Number(value) || 0).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const HEAD_STYLE = { fillColor: [20, 83, 45], textColor: 255, fontStyle: "bold" };

// Builds the finance report as a PDF: summary, KRA tax, cash, paybill reconciliation
// and the day-by-day table. Amounts are KES with two decimals so they tie to statements.
export function downloadFinancePdf(report, { start, end, filename, preparedBy }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const t = report.totals;
  const snap = report.snapshot;
  const recon = report.reconciliation;
  let y = 40;

  doc.setFontSize(16);
  doc.text("Bingwake - Finance report", 40, y);
  doc.setFontSize(10);
  y += 18;
  doc.text(`${format(start, "EEE d MMM yyyy")} – ${format(end, "EEE d MMM yyyy")} (Nairobi time). All amounts in KES.`, 40, y);
  y += 14;
  doc.text(`Generated ${format(new Date(), "d MMM yyyy, HH:mm")}${preparedBy ? ` by ${preparedBy}` : ""}`, 40, y);

  const section = (title, rows, head = ["Item", "KES"]) => {
    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || y) + 18,
      head: [[{ content: title, colSpan: head.length, styles: { halign: "left" } }], head],
      body: rows,
      theme: "grid",
      headStyles: HEAD_STYLE,
      styles: { fontSize: 9 },
      columnStyles: Object.fromEntries(head.slice(1).map((_, i) => [i + 1, { halign: "right" }])),
      margin: { left: 40, right: 40 },
    });
  };

  section("Platform revenue", [
    ["Virtual games GGR (stakes - payouts - refunds)", kes(t.virtualGgr)],
    ["Sportsbook GGR", kes(t.sportsbookGgr)],
    ["Gross gaming revenue", kes(t.ggr)],
    ["Less: bonus cost (welcome + referral + cashback)", kes(-t.bonusCost)],
    ["Add: withdrawal fees", kes(t.withdrawalFees)],
    ["Net revenue", kes(t.netRevenue)],
  ]);

  section("Owed to KRA", [["Withholding tax deducted from withdrawals", kes(t.withdrawalTax)]]);

  section("Cash movement", [
    ["Deposits (all channels)", kes(t.deposits)],
    ["  of which M-Pesa via paybill", kes(t.mpesaDeposits)],
    ["Withdrawals debited from player wallets", kes(t.withdrawalsDebited)],
    ["Withdrawals actually paid out (after tax and fees)", kes(t.withdrawalsPaidOut)],
    ["  of which M-Pesa via paybill", kes(t.mpesaPaidOut)],
    ["  of which Comet", kes(t.cometPaidOut)],
    ["Net cash flow (deposits - paid out)", kes(t.netCashFlow)],
  ]);

  if (recon?.days?.length) {
    section(
      "Paybill reconciliation (Mamlaka)",
      recon.days.flatMap((d) => [
        [d.date, "Pay-in", kes(d.payin.opening), kes(d.payin.expectedChange), kes(d.payin.actualChange), kes(d.payin.closing), kes(d.payin.unexplained)],
        [d.closingIsLive ? `${d.date} (live)` : "", "Payout", kes(d.payout.opening), kes(d.payout.expectedChange), kes(d.payout.actualChange), kes(d.payout.closing), kes(d.payout.unexplained)],
      ]),
      ["Date", "Account", "Opening", "Expected change (our books)", "Actual change", "Closing", "Unexplained"]
    );
    doc.setFontSize(8);
    doc.text(
      `Unexplained must be matched to statement lines our system does not record: top-ups, sweeps and provider charges. ` +
        `Withdrawals still pending: ${recon.pendingWithdrawals.count} worth ${kes(recon.pendingWithdrawals.amount)}.`,
      40,
      doc.lastAutoTable.finalY + 12,
      { maxWidth: 760 }
    );
  }

  section("Balances at time of report", [
    ["Owed to players (cash wallets)", kes(snap.playerCash)],
    ["Player bonus balances", kes(snap.playerBonus)],
    ["Player airtime balances", kes(snap.playerAirtime)],
    ["Payout float (allocated)", kes(snap.payoutFloat)],
    ["Mamlaka pay-in account (live)", kes(recon?.live?.payinKes)],
    ["Mamlaka payout account (live)", kes(recon?.live?.payoutKes)],
  ]);

  const dayCols = [
    ["Date", "date"],
    ["Deposits", "deposits"],
    ["Paid out", "withdrawalsPaidOut"],
    ["Tax (KRA)", "withdrawalTax"],
    ["Fees", "withdrawalFees"],
    ["Virtual GGR", "virtualGgr"],
    ["Sportsbook GGR", "sportsbookGgr"],
    ["Bonus cost", "bonusCost"],
    ["Net revenue", "netRevenue"],
  ];
  doc.addPage();
  autoTable(doc, {
    startY: 40,
    head: [dayCols.map(([label]) => label)],
    body: report.days.map((d) => dayCols.map(([, key]) => (key === "date" ? d.date : kes(d[key])))),
    foot: [dayCols.map(([, key]) => (key === "date" ? "Total" : kes(t[key])))],
    theme: "striped",
    headStyles: HEAD_STYLE,
    footStyles: { fillColor: [241, 245, 249], textColor: 20, fontStyle: "bold" },
    styles: { fontSize: 8 },
    columnStyles: Object.fromEntries(dayCols.slice(1).map((_, i) => [i + 1, { halign: "right" }])),
    margin: { left: 40, right: 40 },
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pages}`, doc.internal.pageSize.getWidth() - 80, doc.internal.pageSize.getHeight() - 20);
  }
  doc.save(filename);
}
