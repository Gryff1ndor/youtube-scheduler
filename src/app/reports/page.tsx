"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Trash2, 
  ArrowUpDown,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  name: string;
  type: "Revenue" | "Content" | "Audience";
  format: "CSV" | "PDF";
  date: string;
  size: string;
  status: "Ready" | "Processing" | "Failed";
}

const INITIAL_REPORTS: Report[] = [
  { id: "REP-001", name: "Q1 Global Revenue Audit", type: "Revenue", format: "PDF", date: "2026-05-18", size: "4.8 MB", status: "Ready" },
  { id: "REP-002", name: "YouTube Demographics Deep-Dive", type: "Audience", format: "CSV", date: "2026-05-17", size: "12.4 MB", status: "Ready" },
  { id: "REP-003", name: "Weekly View Retention Analytics", type: "Content", format: "CSV", date: "2026-05-16", size: "2.1 MB", status: "Ready" },
  { id: "REP-004", name: "AdSense Income Projection Model", type: "Revenue", format: "PDF", date: "2026-05-15", size: "8.2 MB", status: "Processing" },
  { id: "REP-005", name: "Audience CTR & Impression Funnel", type: "Content", format: "CSV", date: "2026-05-12", size: "5.5 MB", status: "Ready" },
  { id: "REP-006", name: "Estimated Sponsor CPM Multipliers", type: "Revenue", format: "PDF", date: "2026-05-10", size: "1.2 MB", status: "Failed" },
  { id: "REP-007", name: "Subscriber Growth & Churn Metrics", type: "Audience", format: "CSV", date: "2026-05-08", size: "14.1 MB", status: "Ready" },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<"All" | "Revenue" | "Content" | "Audience">("All");
  const [sortField, setSortField] = useState<keyof Report>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Handle Sort
  const handleSort = (field: keyof Report) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Filter & Search Logic
  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType === "All" || r.type === selectedType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [reports, searchTerm, selectedType, sortField, sortDirection]);

  // Delete Action
  const handleDelete = (id: string) => {
    setReports(reports.filter((r) => r.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
      className="flex flex-col gap-6 lg:gap-8"
    >
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Analytical Reports
        </h1>
        <p className="mt-1.5 text-sm text-foreground-muted">
          Manage, generate, and download complete channel performance spreadsheets.
        </p>
      </div>

      {/* ── Actions & Filters Panel ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-surface p-4 shadow-sm">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle" />
          <input
            type="text"
            placeholder="Search report ID or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full rounded-lg border border-border bg-surface-elevated py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-foreground-subtle",
              "transition-all duration-200 outline-none focus:border-[--accent] focus:ring-1 focus:ring-[--accent]"
            )}
          />
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap gap-1.5">
          {(["All", "Revenue", "Content", "Audience"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200",
                selectedType === type
                  ? "bg-[--accent-subtle] text-[--accent]"
                  : "text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table Container ── */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-elevated/40 text-xs font-semibold tracking-wider text-foreground-muted">
              <th className="py-4 px-5">
                <button onClick={() => handleSort("id")} className="flex items-center gap-1.5 hover:text-foreground">
                  REPORT ID <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-4 px-4">
                <button onClick={() => handleSort("name")} className="flex items-center gap-1.5 hover:text-foreground">
                  REPORT NAME <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-4 px-4">
                <button onClick={() => handleSort("type")} className="flex items-center gap-1.5 hover:text-foreground">
                  TYPE <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-4 px-4">FORMAT</th>
              <th className="py-4 px-4">
                <button onClick={() => handleSort("date")} className="flex items-center gap-1.5 hover:text-foreground">
                  DATE GENERATED <ArrowUpDown size={12} />
                </button>
              </th>
              <th className="py-4 px-4">SIZE</th>
              <th className="py-4 px-4">STATUS</th>
              <th className="py-4 px-5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <motion.tr
                    key={report.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-surface-elevated/40 transition-colors duration-150 group"
                  >
                    {/* ID */}
                    <td className="py-4 px-5 font-mono text-xs text-foreground-subtle">{report.id}</td>
                    
                    {/* Name & Icon */}
                    <td className="py-4 px-4 font-medium text-foreground">
                      <div className="flex items-center gap-2.5">
                        {report.format === "CSV" ? (
                          <FileSpreadsheet size={16} className="text-emerald-500" />
                        ) : (
                          <FileText size={16} className="text-rose-500" />
                        )}
                        <span>{report.name}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-4 px-4 text-foreground-muted">{report.type}</td>

                    {/* Format */}
                    <td className="py-4 px-4">
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold",
                        report.format === "CSV" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      )}>
                        {report.format}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-foreground-muted">{report.date}</td>

                    {/* Size */}
                    <td className="py-4 px-4 text-foreground-subtle font-mono text-xs">{report.size}</td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                        report.status === "Ready" && "bg-emerald-500/10 text-emerald-500",
                        report.status === "Processing" && "bg-accent/10 text-accent animate-pulse-soft",
                        report.status === "Failed" && "bg-destructive/10 text-destructive"
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          report.status === "Ready" && "bg-emerald-500",
                          report.status === "Processing" && "bg-[--accent]",
                          report.status === "Failed" && "bg-destructive"
                        )} />
                        {report.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {report.status === "Ready" && (
                          <button 
                            aria-label="Download report"
                            className="rounded p-1.5 text-foreground-subtle hover:bg-surface-elevated hover:text-foreground transition-colors duration-150"
                          >
                            <Download size={14} />
                          </button>
                        )}
                        <button
                          aria-label="Delete report"
                          onClick={() => handleDelete(report.id)}
                          className="rounded p-1.5 text-foreground-subtle hover:bg-destructive/10 hover:text-destructive transition-colors duration-150"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-foreground-muted">
                    No reports match your query.
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

    </motion.div>
  );
}
