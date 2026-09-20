"use client";

import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = {
  present: "#0e6b4f",
  late: "#9a5b09",
  absent: "#c4362a",
  excused: "#2a5caa",
  brand: "#0e6b4f",
  accent: "#8a6a34",
  grid: "#e2e5dc",
};

export function ReportsClient({
  seasonName,
  attendanceTrend,
  pointsDistribution,
  circleComparison,
  overallAttendanceRate,
  totalStudents,
}: {
  seasonName: string;
  attendanceTrend: Record<string, string | number>[];
  pointsDistribution: { name: string; عدد_الطلاب: number }[];
  circleComparison: { name: string; متوسط_النقاط: number; عدد_الطلاب: number }[];
  overallAttendanceRate: number;
  totalStudents: number;
}) {
  return (
    <main className="p-(--space-4) md:p-(--space-8) max-w-[1100px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-(--space-3) mb-(--space-6)">
        <div>
          <h1 className="text-[22px] leading-[30px] font-bold text-ink">التقارير</h1>
          <p className="text-sm text-ink-muted mt-1">{seasonName}</p>
        </div>
        <Link href="/admin/reports/print">
          <Button variant="secondary">
            <Printer size={16} /> التقرير الكلاسيكي القابل للطباعة
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-(--space-4) mb-(--space-6)">
        <Card className="text-center">
          <p className="text-[36px] font-bold text-brand">{overallAttendanceRate}%</p>
          <p className="text-[12px] text-ink-muted font-medium">معدل الحضور العام</p>
        </Card>
        <Card className="text-center">
          <p className="text-[36px] font-bold text-ink">{totalStudents}</p>
          <p className="text-[12px] text-ink-muted font-medium">طالب مسجّل نشط</p>
        </Card>
      </div>

      <Card className="mb-(--space-6)">
        <CardTitle className="mb-(--space-4)">اتجاه الحضور اليومي</CardTitle>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={attendanceTrend}>
              <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="حاضر" stroke={COLORS.present} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="متأخر" stroke={COLORS.late} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="غائب" stroke={COLORS.absent} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="بعذر" stroke={COLORS.excused} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-(--space-6)">
        <Card>
          <CardTitle className="mb-(--space-4)">توزيع النقاط</CardTitle>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={pointsDistribution}>
                <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="عدد_الطلاب" fill={COLORS.brand} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-(--space-4)">مقارنة الحلقات (متوسط النقاط)</CardTitle>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={circleComparison} layout="vertical">
                <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="متوسط_النقاط" fill={COLORS.accent} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </main>
  );
}
