import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DailyRecord, Area, CommissionSettings } from "@/types";
import { formatCurrencyBRL } from "./currency";

const THEME = {
  primary: [30, 41, 59] as [number, number, number], // slate-800
  accent: [37, 99, 235] as [number, number, number], // blue-600
  text: [15, 23, 42] as [number, number, number], // #0F172A
  muted: [100, 116, 139] as [number, number, number], // #64748B
  border: [241, 245, 249] as [number, number, number], // #F1F5F9
  background: [248, 250, 252] as [number, number, number], // #F8FAFC
  success: [22, 163, 74] as [number, number, number], // #16A34A
  danger: [220, 38, 38] as [number, number, number], // #DC2626
  warning: [249, 115, 22] as [number, number, number], // #F97316
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

  const pageWidth = doc.internal.pageSize.getWidth();
  const formattedDateExt = format(new Date(date + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const now = format(new Date(), "dd/MM/yyyy HH:mm");

  // --- Background (Soft Slate) ---
  doc.setFillColor(THEME.background[0], THEME.background[1], THEME.background[2]);
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), "F");

  // --- Center Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
  doc.text(`ROTEIRO DESCARGA – ${area.name.toUpperCase()}`, pageWidth / 2, 15, { align: "center" });
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
  doc.text(`Data: ${formattedDateExt}`, pageWidth / 2, 22, { align: "center" });

  // --- Table Title ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
  doc.text(`Descarrego - ${area.name}`, pageWidth / 2, 35, { align: "center" });

  // --- Main Table ---
  const headers = [["Item", "Manhã", "Tarde", "Noite", "Grupo Manhã", "Grupo Tarde", "Grupo Noite", "Diário"]];
  const body = [
    [
      "Entradas Geral",
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
    startY: 40,
    head: headers,
    body: body,
    theme: "grid",
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: THEME.text,
      fontSize: 8,
      fontStyle: "bold",
      halign: "center", // Centraliza os cabeçalhos
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
    bodyStyles: {
      fontSize: 8,
      textColor: THEME.text,
      halign: "right",
      fontStyle: "bold",
      fillColor: [255, 255, 255]
    },
    columnStyles: {
      0: { fontStyle: "bold", halign: "left" },
      7: { fontStyle: "bold", textColor: THEME.text }
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      data.cell.styles.fontStyle = 'bold';
      if (data.row.index === 1 && data.section === 'body') {
        data.cell.styles.textColor = THEME.danger as [number, number, number];
      }
      if (data.row.index === 3 && data.section === 'body') {
        const value = record.total_final;
        data.cell.styles.textColor = value >= 0 ? THEME.success : THEME.danger;
      }
    },
    // Simulação de sombra nos números coloridos da tabela
    didDrawCell: (data) => {
      if (data.section === 'body' && (data.row.index === 1 || data.row.index === 3)) {
        if (data.column.index > 0) {
           const text = data.cell.text[0];
           const x = data.cell.x + data.cell.width - data.cell.padding('right');
           const y = data.cell.y + data.cell.height / 2 + 1; // Ajuste fino Y
           
           // Desenha sombra (cinza muito claro) com pequeno offset
           doc.setTextColor(220, 220, 220);
           doc.text(text, x + 0.2, y + 0.2, { align: 'right' });
           
           // Volta a cor original para o texto principal
           const color = (data.row.index === 1) ? THEME.danger : (record.total_final >= 0 ? THEME.success : THEME.danger);
           doc.setTextColor(color[0], color[1], color[2]);
           doc.text(text, x, y, { align: 'right' });
           return false; // Cancela o desenho padrão para evitar duplicidade
        }
      }
    }
  });

  // --- Totais por Período Section ---
  let currentY = (doc as any).lastAutoTable.finalY + 12;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
  doc.text("Totais por Período", pageWidth / 2, currentY, { align: "center" });

  currentY += 6;
  const cardW = 75;
  const cardH = 35;
  const cardGap = 8;
  const startX = (pageWidth - (cardW * 3 + cardGap * 2)) / 2;

  const periods = [
    {
      name: "Manhã Total",
      entries: record.morning_entries + record.group_morning_entries,
      commission: record.morning_commission + record.group_morning_commission,
      prizes: record.morning_prizes + record.group_morning_prizes,
    },
    {
      name: "Tarde Total",
      entries: record.afternoon_entries + record.group_afternoon_entries,
      commission: record.afternoon_commission + record.group_afternoon_commission,
      prizes: record.afternoon_prizes + record.group_afternoon_prizes,
    },
    {
      name: "Noite Total",
      entries: record.night_entries + record.group_night_entries,
      commission: record.night_commission + record.group_night_commission,
      prizes: record.night_prizes + record.group_night_prizes,
    }
  ];

  periods.forEach((p, i) => {
    const x = startX + i * (cardW + cardGap);
    const net = p.entries - p.commission - p.prizes;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(x, currentY, cardW, cardH, 1, 1, "FD");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
    doc.text(p.name, x + cardW / 2, currentY + 8, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);

    const lineY = currentY + 16;
    doc.text("Entradas:", x + 8, lineY);
    doc.text("Comissão:", x + 8, lineY + 4);
    doc.text("Prêmios:", x + 8, lineY + 8);
    
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrencyBRL(p.entries), x + cardW - 8, lineY, { align: "right" });
    doc.setTextColor(THEME.danger[0], THEME.danger[1], THEME.danger[2]);
    doc.text(formatCurrencyBRL(p.commission), x + cardW - 8, lineY + 4, { align: "right" });
    doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
    doc.text(formatCurrencyBRL(p.prizes), x + cardW - 8, lineY + 8, { align: "right" });

    doc.setDrawColor(245, 245, 245);
    doc.line(x + 5, lineY + 10, x + cardW - 5, lineY + 10);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
    doc.text("Saldo:", x + 8, lineY + 15);
    doc.setTextColor(net >= 0 ? THEME.success[0] : THEME.danger[0], net >= 0 ? THEME.success[1] : THEME.danger[1], net >= 0 ? THEME.success[2] : THEME.danger[2]);
    doc.text(formatCurrencyBRL(net), x + cardW - 8, lineY + 15, { align: "right" });
  });

  // --- Totais do Dia Section ---
  currentY += cardH + 12;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
  doc.text("Totais do Dia", pageWidth / 2, currentY, { align: "center" });

  currentY += 6;
  const boxW = 241;
  const boxH = 25;
  const boxX = (pageWidth - boxW) / 2;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(boxX, currentY, boxW, boxH, 1, 1, "FD");

  const colW = boxW / 4;
  const topLabelsY = currentY + 8;
  const valuesY = currentY + 18;

  const finalMetrics = [
    { label: "Valor Bruto Total", value: record.total_entries, color: THEME.text },
    { label: "Total Comissão", value: record.total_commission, color: THEME.danger },
    { label: "Total Prêmios", value: record.total_prizes, color: THEME.text },
    { label: "Total Final", value: record.total_net_final, color: record.total_net_final >= 0 ? THEME.success : THEME.danger }
  ];

  finalMetrics.forEach((m, i) => {
    const x = boxX + i * colW + colW / 2;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
    doc.text(m.label, x, topLabelsY, { align: "center" });

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    
    // Shadow for totals
    doc.setTextColor(220, 220, 220);
    doc.text(formatCurrencyBRL(m.value), x + 0.25, valuesY + 0.25, { align: "center" });
    
    // Main color
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(formatCurrencyBRL(m.value), x, valuesY, { align: "center" });
  });

  // --- Footer ---
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(THEME.text[0], THEME.text[1], THEME.text[2]);
  const footerText = `Roteiro Descarga · Gerado em ${now}`;
  doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

  const dateParts = date.split("-");
  const shortDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0].slice(-2)}`;
  const fileName = `Descarrego-${area.name}-Dia(${shortDate}).pdf`;
  doc.save(fileName);
}
