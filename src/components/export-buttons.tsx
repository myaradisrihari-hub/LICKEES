"use client";

import { Download, FileText, FileSpreadsheet, FileType2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  type ExportColumn,
  type ExportRow,
} from "@/lib/export";

export function ExportButtons({
  filename,
  title,
  columns,
  rows,
  subtitleLines = [],
  sheetName = "Report",
}: {
  filename: string;
  title: string;
  columns: ExportColumn[];
  rows: ExportRow[];
  subtitleLines?: string[];
  sheetName?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-11 rounded-xl font-semibold">
          <Download className="size-4" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl">
        <DropdownMenuItem onClick={() => exportToPDF(filename, title, columns, rows, subtitleLines)}>
          <FileText className="size-4" /> PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToExcel(filename, sheetName, columns, rows)}>
          <FileSpreadsheet className="size-4" /> Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToCSV(filename, columns, rows)}>
          <FileType2 className="size-4" /> CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
