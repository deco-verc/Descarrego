import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { DailyRecord, Area, CommissionSettings } from "@/types";
import { formatCurrencyBRL } from "./currency";

const THEME = {
  primary: [37, 99, 235], // #2563EB
  primaryDark: [30, 64, 175], // #1E40AF
  primaryLight: [219, 234, 254], // #DBEAFE
  text: [15, 23, 42], // #0F172A
  muted: [100, 116, 139], // #64748B
  border: [203, 213, 225], // #CBD5E1
  background: [248, 250, 252], // #F8FAFC
  success: [22, 163, 74], // #16A34A
  successLight: [220, 252, 231],
  danger: [220, 38, 38], // #DC2626
  warning: [249, 115, 22], // #F97316
};

function normalizeFileName(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

export async function exportDailyPDF(
  record: DailyRecord,
  area: Area,
  date: string,
  userEmail: string,
  settings: CommissionSettings | null
) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const formattedDate = format(new Date(date + 'T12:00:00'), "dd/MM/yyyy");
  const now = format(new Date(), "dd/MM/yyyy HH:mm");

  // --- Top Bar ---
  doc.setFillColor(THEME.primary[0], THEME.primary[1], THEME.primary[2]);
  doc.rect(0, 0, 297, 10, "F");

  // --- Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(THEME.primaryDark[0], THEME.primaryDark[1], THEME.primaryDark[2]);
  doc.text("ROTEIRO DESCARGA", 14, 25);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(THEME.muted[0], THEME.muted[1], THEME.muted[2]);
  doc.text("Relatório Diário de Fechamento", 14, 30);

  // --- Report Info Block ---
  doc.setDrawColor(THEME.border[0], THEME.border[1], THEME.border[2]);
  doc.setFillColor(252, 252, 252);
  doc.roundedRect(14, 38, 269, 25, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
  
  // Col 1
  doc.text("ÁREA:", 20, 47);
  doc.text("STATUS:", 20, 56);
  
  // Col 2
  doc.text("DATA:", 90, 47);
  doc.text("COMISSÃO:", 90, 56);

  // Col 3
  doc.text("GERADO POR:", 160, 47);
  doc.text("GERADO EM:", 160, 56);

  doc.setFont("helvetica", "normal");
  doc.text(area.name, 45, 47);
  doc.text(record.closed ? "FECHADO" : record.checked ? "CONFERIDO" : "SALVO", 45, 56);
  
  doc.text(formattedDate, 115, 47);
  doc.text(settings?.auto_calculate ? "AUTOMÁTICA" : "MANUAL", 115, 56);
  
  doc.text(userEmail, 190, 47);
  doc.text(now, 190, 56);

  // --- Summary Cards ---
  const cardW = 50;
  const cardH = 20;
  const cardGap = 5;
  let currentX = 14;
  const currentY = 70;

  const summary = [
    { label: "VALOR BRUTO", value: record.total_entries, color: THEME.primaryDark },
    { label: "COMISSÃO", value: record.total_commission, color: THEME.danger },
    { label: "PRÊMIOS", value: record.total_prizes, color: THEME.warning },
    { label: "DESPESAS EXTRAS", value: record.total_extra_expenses, color: THEME.danger },
    { label: "SALDO LÍQUIDO", value: record.total_net_final, color: THEME.success }
  ];

  summary.forEach((card) => {
    doc.setDrawColor(THEME.border[0], THEME.border[1], THEME.border[2]);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(currentX, currentY, cardW, cardH, 1, 1, "FD");
    
    // Colored side border
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.rect(currentX, currentY, 1.5, cardH, "F");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(THEME.muted[0], THEME.muted[1], THEME.muted[2]);
    doc.text(card.label, currentX + 5, currentY + 7);

    doc.setFontSize(11);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(formatCurrencyBRL(card.value), currentX + 5, currentY + 15);

    currentX += cardW + cardGap;
  });

  // --- Main Table ---
  const headers = [["ITEM", "MANHÃ", "TARDE", "NOITE", "G. MANHÃ", "G. TARDE", "G. NOITE", "DIÁRIO"]];
  const body = [
    [
      "Entradas",
      formatCurrencyBRL(record.morning_entries),
      formatCurrencyBRL(record.afternoon_entries),
      formatCurrencyBRL(record.night_entries),
      formatCurrencyBRL(record.group_morning_entries),
      formatCurrencyBRL(record.group_afternoon_entries),
      formatCurrencyBRL(record.group_night_entries),
      formatCurrencyBRL(record.total_entries)
    ],
    [
      "Comissão",
      formatCurrencyBRL(record.morning_commission),
      formatCurrencyBRL(record.afternoon_commission),
      formatCurrencyBRL(record.night_commission),
      formatCurrencyBRL(record.group_morning_commission),
      formatCurrencyBRL(record.group_afternoon_commission),
      formatCurrencyBRL(record.group_night_commission),
      formatCurrencyBRL(record.total_commission)
    ],
    [
      "Prêmios",
      formatCurrencyBRL(record.morning_prizes),
      formatCurrencyBRL(record.afternoon_prizes),
      formatCurrencyBRL(record.night_prizes),
      formatCurrencyBRL(record.group_morning_prizes),
      formatCurrencyBRL(record.group_afternoon_prizes),
      formatCurrencyBRL(record.group_night_prizes),
      formatCurrencyBRL(record.total_prizes)
    ],
    [
      "Saldo Final",
      formatCurrencyBRL(record.morning_entries - record.morning_commission - record.morning_prizes),
      formatCurrencyBRL(record.afternoon_entries - record.afternoon_commission - record.afternoon_prizes),
      formatCurrencyBRL(record.night_entries - record.night_commission - record.night_prizes),
      formatCurrencyBRL(record.group_morning_entries - record.group_morning_commission - record.group_morning_prizes),
      formatCurrencyBRL(record.group_afternoon_entries - record.group_afternoon_commission - record.group_afternoon_prizes),
      formatCurrencyBRL(record.group_night_entries - record.group_night_commission - record.group_night_prizes),
      formatCurrencyBRL(record.total_final)
    ]
  ];

  autoTable(doc, {
    startY: 95,
    head: headers,
    body: body,
    theme: "grid",
    headStyles: {
      fillColor: THEME.primaryDark as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontSize: 9,
      fontStyle: "bold",
      halign: "center"
    },
    bodyStyles: {
      fontSize: 8,
      textColor: THEME.text as [number, number, number],
      halign: "right"
    },
    columnStyles: {
      0: { fontStyle: "bold", halign: "left", fillColor: [250, 250, 250] as [number, number, number] },
      7: { fontStyle: "bold", fillColor: THEME.primaryLight as [number, number, number] }
    },
    didParseCell: (data) => {
      if (data.row.index === 1 && data.section === 'body') {
        data.cell.styles.textColor = THEME.danger as [number, number, number];
      }
      if (data.row.index === 2 && data.section === 'body') {
        data.cell.styles.textColor = THEME.warning as [number, number, number];
      }
      if (data.row.index === 3 && data.section === 'body') {
        data.cell.styles.textColor = THEME.success as [number, number, number];
        data.cell.styles.fillColor = THEME.successLight as [number, number, number];
      }
    }
  });

  // --- Period Totals ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
  doc.text("TOTAIS POR PERÍODO (GERAL)", 14, finalY);

  const periodData = [
    ["Período", "Entradas", "Comissão", "Prêmios", "Saldo"],
    [
      "Manhã (M+G)", 
      formatCurrencyBRL(record.morning_entries + record.group_morning_entries),
      formatCurrencyBRL(record.morning_commission + record.group_morning_commission),
      formatCurrencyBRL(record.morning_prizes + record.group_morning_prizes),
      formatCurrencyBRL((record.morning_entries + record.group_morning_entries) - (record.morning_commission + record.group_morning_commission) - (record.morning_prizes + record.group_morning_prizes))
    ],
    [
      "Tarde (M+G)", 
      formatCurrencyBRL(record.afternoon_entries + record.group_afternoon_entries),
      formatCurrencyBRL(record.afternoon_commission + record.group_afternoon_commission),
      formatCurrencyBRL(record.afternoon_prizes + record.group_afternoon_prizes),
      formatCurrencyBRL((record.afternoon_entries + record.group_afternoon_entries) - (record.afternoon_commission + record.group_afternoon_commission) - (record.afternoon_prizes + record.group_afternoon_prizes))
    ],
    [
      "Noite (M+G)", 
      formatCurrencyBRL(record.night_entries + record.group_night_entries),
      formatCurrencyBRL(record.night_commission + record.group_night_commission),
      formatCurrencyBRL(record.night_prizes + record.group_night_prizes),
      formatCurrencyBRL((record.night_entries + record.group_night_entries) - (record.night_commission + record.group_night_commission) - (record.night_prizes + record.group_night_prizes))
    ]
  ];

  autoTable(doc, {
    startY: finalY + 4,
    head: [periodData[0]],
    body: periodData.slice(1),
    theme: "plain",
    headStyles: { fontStyle: "bold", fontSize: 8, textColor: THEME.muted as [number, number, number] },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right", fontStyle: "bold" } }
  });

  // --- Footer ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(THEME.muted[0], THEME.muted[1], THEME.muted[2]);
    const footerText = `Roteiro Descarga · Gerado em ${now} · Página ${i} de ${pageCount}`;
    doc.text(footerText, 283, 205, { align: "right" });
  }

  const areaSlug = normalizeFileName(area.name);
  const fileName = `descarrego-diario-${areaSlug}-${date}.pdf`;
  doc.save(fileName);
}
