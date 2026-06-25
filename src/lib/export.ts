import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn {
  header: string;
  key: string;
}

export type ExportRow = Record<string, string | number>;

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportToCSV(
  filename: string,
  columns: ExportColumn[],
  rows: ExportRow[],
) {
  const escape = (val: string | number) => {
    const s = String(val ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => escape(c.header)).join(",");
  const body = rows
    .map((r) => columns.map((c) => escape(r[c.key])).join(","))
    .join("\n");
  download(
    new Blob([`${head}\n${body}`], { type: "text/csv;charset=utf-8;" }),
    `${filename}.csv`,
  );
}

export function exportToExcel(
  filename: string,
  sheetName: string,
  columns: ExportColumn[],
  rows: ExportRow[],
) {
  const data = rows.map((r) => {
    const o: ExportRow = {};
    columns.forEach((c) => {
      o[c.header] = r[c.key];
    });
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF(
  filename: string,
  title: string,
  columns: ExportColumn[],
  rows: ExportRow[],
  subtitleLines: string[] = [],
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(110);
  let y = 26;
  subtitleLines.forEach((line) => {
    doc.text(line, 14, y);
    y += 5;
  });

  autoTable(doc, {
    startY: subtitleLines.length ? y + 2 : 24,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => String(r[c.key] ?? ""))),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [34, 139, 84], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 248, 243] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}.pdf`);
}
