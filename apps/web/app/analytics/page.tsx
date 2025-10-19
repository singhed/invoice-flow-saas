"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

// Types
type Channel = "Organic" | "Paid" | "Referral" | "Social" | "Email";
type Device = "Desktop" | "Mobile" | "Tablet";

interface Filters {
  start: string; // ISO date (yyyy-mm-dd)
  end: string; // ISO date
  channels: Record<Channel, boolean>;
  devices: Record<Device, boolean>;
}

interface GeneratedData {
  days: string[];
  dau: number[];
  dauMA7: number[];
  anomaliesIdx: number[];
  revenueByChannel: Record<Channel, number>;
  deviceDistribution: Record<Device, number>;
  funnel: { name: string; value: number }[];
  cohorts: {
    yLabels: string[]; // cohort labels (week start)
    xLabels: string[]; // +0..+7
    values: Array<[number, number, number]>; // [x, y, value]
  };
  kpis: {
    totalUsers: number;
    totalRevenue: number;
    conversionRate: number; // 0..1
    avgSessionMinutes: number;
  };
}

// Helpers
function formatNumber(n: number) {
  return n.toLocaleString();
}

function formatCurrency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

// Seeded random (Mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CHANNELS: Channel[] = ["Organic", "Paid", "Referral", "Social", "Email"];
const DEVICES: Device[] = ["Desktop", "Mobile", "Tablet"];

const CHANNEL_SHARES: Record<Channel, number> = {
  Organic: 0.35,
  Paid: 0.25,
  Referral: 0.15,
  Social: 0.15,
  Email: 0.1,
};

const DEVICE_SHARES: Record<Device, number> = {
  Desktop: 0.5,
  Mobile: 0.4,
  Tablet: 0.1,
};

const CHANNEL_ARPU: Record<Channel, number> = {
  Organic: 3.8,
  Paid: 5.2,
  Referral: 4.0,
  Social: 2.4,
  Email: 6.2,
};

const CHANNEL_CONV: Record<Channel, number> = {
  Organic: 0.032,
  Paid: 0.025,
  Referral: 0.028,
  Social: 0.018,
  Email: 0.045,
};

function getDefaultDateRange(daysBack = 90) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - daysBack);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

function toDate(s: string) {
  const parts = s.split("-");
  const y = parseInt(parts[0] || "1970", 10);
  const m = parseInt(parts[1] || "01", 10);
  const d = parseInt(parts[2] || "01", 10);
  return new Date(y, m - 1, d);
}

function eachDay(start: Date, end: Date): string[] {
  const days: string[] = [];
  const d = new Date(start);
  while (d <= end) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function movingAverage(values: number[], window = 7): number[] {
  const ma: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const from = Math.max(0, i - window + 1);
    const slice = values.slice(from, i + 1);
    ma.push(Math.round(slice.reduce((a, b) => a + b, 0) / slice.length));
  }
  return ma;
}

function detectAnomalies(values: number[], ma: number[]): number[] {
  // Simple anomaly detection: residuals vs stddev
  const residuals = values.map((v, i) => v - (ma[i] ?? v));
  const mean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
  const variance = residuals.reduce((a, b) => a + (b - mean) ** 2, 0) / residuals.length;
  const std = Math.sqrt(variance) || 1;
  const idx: number[] = [];
  residuals.forEach((r, i) => {
    const z = Math.abs((r - mean) / std);
    if (z > 2.0) idx.push(i);
  });
  return idx;
}

function generateData(filters: Filters): GeneratedData {
  const start = toDate(filters.start);
  const end = toDate(filters.end);
  const days = eachDay(start, end);
  const rng = mulberry32(42 + start.getTime() + end.getTime());

  const selectedChannels = CHANNELS.filter((c) => filters.channels[c]);
  const selectedDevices = DEVICES.filter((d) => filters.devices[d]);

  const channelWeight = selectedChannels.reduce((sum, c) => sum + CHANNEL_SHARES[c], 0);
  const deviceWeight = selectedDevices.reduce((sum, d) => sum + DEVICE_SHARES[d], 0);

  const dau: number[] = [];
  let totalRevenue = 0;
  const revenueByChannel: Record<Channel, number> = {
    Organic: 0,
    Paid: 0,
    Referral: 0,
    Social: 0,
    Email: 0,
  };
  const deviceDistribution: Record<Device, number> = {
    Desktop: 0,
    Mobile: 0,
    Tablet: 0,
  };

  // Synthesize traffic
  days.forEach((_, i) => {
    const seasonal = 600 + 300 * Math.sin((2 * Math.PI * i) / 7) + 120 * Math.sin((2 * Math.PI * i) / 30);
    const noise = (rng() - 0.5) * 120;
    const base = Math.max(100, seasonal + noise);
    const visits = Math.round(base * channelWeight * deviceWeight);
    dau.push(visits);

    // Revenue per channel (weighted by channel share and ARPU)
    selectedChannels.forEach((ch) => {
      const chVisits = visits * (CHANNEL_SHARES[ch] / channelWeight);
      const rev = chVisits * CHANNEL_ARPU[ch] * (0.85 + rng() * 0.3);
      revenueByChannel[ch] += rev;
    });

    // Device distribution
    selectedDevices.forEach((dv) => {
      const dvVisits = visits * (DEVICE_SHARES[dv] / deviceWeight);
      deviceDistribution[dv] += dvVisits;
    });
  });

  totalRevenue = Object.values(revenueByChannel).reduce((a, b) => a + b, 0);

  // Funnel aggregation
  const totalVisits = dau.reduce((a, b) => a + b, 0);
  const weightedConv = selectedChannels.length
    ? selectedChannels.reduce((a, ch) => a + CHANNEL_CONV[ch] * CHANNEL_SHARES[ch], 0) /
      selectedChannels.reduce((a, ch) => a + CHANNEL_SHARES[ch], 0)
    : 0.03;
  const productView = Math.round(totalVisits * clamp(0.65 + (rng() - 0.5) * 0.05, 0.5, 0.75));
  const addToCart = Math.round(productView * clamp(0.35 + (rng() - 0.5) * 0.05, 0.25, 0.5));
  const checkout = Math.round(addToCart * clamp(0.6 + (rng() - 0.5) * 0.08, 0.4, 0.8));
  const purchase = Math.round(totalVisits * weightedConv);

  const funnel = [
    { name: "Visits", value: totalVisits },
    { name: "Product View", value: productView },
    { name: "Add to Cart", value: addToCart },
    { name: "Checkout", value: checkout },
    { name: "Purchase", value: purchase },
  ];

  // Cohort retention (12 cohorts x 8 weeks)
  const cohortsY: string[] = [];
  const cohortsX: string[] = Array.from({ length: 8 }, (_, i) => `+${i}`);
  const heat: Array<[number, number, number]> = [];
  const startDate = toDate(filters.start);
  // Week starts on Monday
  const firstMonday = new Date(startDate);
  const day = firstMonday.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // days to Monday
  firstMonday.setDate(firstMonday.getDate() + diff);
  for (let c = 0; c < 12; c++) {
    const cohortStart = new Date(firstMonday);
    cohortStart.setDate(firstMonday.getDate() + c * 7);
    cohortsY.push(`Week of ${cohortStart.toISOString().slice(0, 10)}`);
    const baseRet = 1.0 - c * 0.01; // slight degradation for older cohorts
    for (let w = 0; w < 8; w++) {
      const retention = clamp(baseRet * Math.pow(0.82 + rng() * 0.06, w) + (rng() - 0.5) * 0.03, 0, 1);
      heat.push([w, c, Math.round(retention * 100)]);
    }
  }

  // MA7 and anomalies
  const dauMA7 = movingAverage(dau, 7);
  const anomaliesIdx = detectAnomalies(dau, dauMA7);

  const kpis = {
    totalUsers: dau.reduce((a, b) => a + b, 0),
    totalRevenue: totalRevenue,
    conversionRate: weightedConv,
    avgSessionMinutes: Math.round(3 + rng() * 4 + channelWeight * 2),
  };

  return {
    days,
    dau,
    dauMA7,
    anomaliesIdx,
    revenueByChannel,
    deviceDistribution,
    funnel,
    cohorts: { yLabels: cohortsY, xLabels: cohortsX, values: heat },
    kpis,
  };
}

export default function AdvancedAnalyticsPage() {
  const defaultRange = useMemo(() => getDefaultDateRange(90), []);
  const [filters, setFilters] = useState<Filters>({
    start: defaultRange.start,
    end: defaultRange.end,
    channels: { Organic: true, Paid: true, Referral: true, Social: true, Email: true },
    devices: { Desktop: true, Mobile: true, Tablet: true },
  });
  const [echartsReady, setEchartsReady] = useState(false);

  // Chart containers
  const dauRef = useRef<HTMLDivElement | null>(null);
  const revenueRef = useRef<HTMLDivElement | null>(null);
  const deviceRef = useRef<HTMLDivElement | null>(null);
  const funnelRef = useRef<HTMLDivElement | null>(null);
  const cohortRef = useRef<HTMLDivElement | null>(null);

  // ECharts instances
  const dauChart = useRef<any>(null);
  const revenueChart = useRef<any>(null);
  const deviceChart = useRef<any>(null);
  const funnelChart = useRef<any>(null);
  const cohortChart = useRef<any>(null);

  const data = useMemo(() => generateData(filters), [filters]);

  useEffect(() => {
    if (!echartsReady) return;
    const e = (window as any).echarts;
    if (!e) return;

    // Init if needed
    if (dauRef.current && !dauChart.current) dauChart.current = e.init(dauRef.current);
    if (revenueRef.current && !revenueChart.current) revenueChart.current = e.init(revenueRef.current);
    if (deviceRef.current && !deviceChart.current) deviceChart.current = e.init(deviceRef.current);
    if (funnelRef.current && !funnelChart.current) funnelChart.current = e.init(funnelRef.current);
    if (cohortRef.current && !cohortChart.current) cohortChart.current = e.init(cohortRef.current);

    // Options
    if (dauChart.current) {
      dauChart.current.setOption({
        animation: true,
        tooltip: { trigger: "axis" },
        legend: { data: ["DAU", "MA7", "Anomalies"], top: 0 },
        grid: { left: 40, right: 20, top: 40, bottom: 40 },
        xAxis: { type: "category", data: data.days },
        yAxis: { type: "value" },
        series: [
          {
            name: "DAU",
            type: "line",
            data: data.dau,
            smooth: true,
            symbol: "circle",
            symbolSize: 4,
            lineStyle: { width: 2, color: "#38bdf8" },
            areaStyle: { color: "rgba(56,189,248,0.08)" },
          },
          {
            name: "MA7",
            type: "line",
            data: data.dauMA7,
            smooth: true,
            lineStyle: { width: 2, color: "#22c55e" },
          },
          {
            name: "Anomalies",
            type: "scatter",
            data: data.anomaliesIdx.map((i) => [data.days[i], data.dau[i]]),
            symbolSize: 8,
            itemStyle: { color: "#ef4444" },
            tooltip: { formatter: (p: any) => `Anomaly: ${formatNumber(p.value[1])}` },
          },
        ],
      });
    }

    if (revenueChart.current) {
      const bars = CHANNELS.filter((c) => filters.channels[c]).map((ch) => ({
        name: ch,
        type: "bar",
        data: [Math.round(data.revenueByChannel[ch])],
      }));
      revenueChart.current.setOption({
        animation: true,
        tooltip: { trigger: "item", formatter: (p: any) => `${p.seriesName}: ${formatCurrency(p.value)}` },
        legend: { top: 0 },
        grid: { left: 40, right: 20, top: 40, bottom: 40 },
        xAxis: { type: "category", data: ["Revenue (by Channel)"] },
        yAxis: { type: "value" },
        series: bars,
      });
    }

    if (deviceChart.current) {
      const pieData = DEVICES.filter((d) => filters.devices[d]).map((dv) => ({
        name: dv,
        value: Math.round(data.deviceDistribution[dv]),
      }));
      deviceChart.current.setOption({
        tooltip: { trigger: "item", formatter: (p: any) => `${p.name}: ${formatNumber(p.value)} (${p.percent}%)` },
        legend: { top: 0 },
        series: [
          {
            name: "Devices",
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 6, borderColor: "#111827", borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } },
            data: pieData,
          },
        ],
      });
    }

    if (funnelChart.current) {
      funnelChart.current.setOption({
        tooltip: { trigger: "item", formatter: (p: any) => `${p.name}: ${formatNumber(p.value)}` },
        legend: { top: 0 },
        series: [
          {
            name: "Funnel",
            type: "funnel",
            left: "10%",
            top: 30,
            bottom: 10,
            width: "80%",
            minSize: "20%",
            maxSize: "100%",
            sort: "descending",
            label: { show: true, formatter: "{b}: {c}" },
            data: data.funnel,
          },
        ],
      });
    }

    if (cohortChart.current) {
      cohortChart.current.setOption({
        tooltip: {
          position: "top",
          formatter: (p: any) => {
            const y = data.cohorts.yLabels[p.value[1]];
            const x = data.cohorts.xLabels[p.value[0]];
            return `${y} · Week ${x}: ${p.value[2]}%`;
          },
        },
        grid: { left: 80, right: 20, bottom: 30, top: 30 },
        xAxis: { type: "category", data: data.cohorts.xLabels, splitArea: { show: true } },
        yAxis: { type: "category", data: data.cohorts.yLabels, splitArea: { show: true } },
        visualMap: {
          min: 0,
          max: 100,
          calculable: false,
          orient: "horizontal",
          left: "center",
          bottom: 0,
          inRange: { color: ["#fca5a5", "#fde68a", "#4ade80"] },
        },
        series: [
          {
            name: "Retention",
            type: "heatmap",
            data: data.cohorts.values,
            label: { show: false },
          },
        ],
      });
    }

    const onResize = () => {
      dauChart.current?.resize();
      revenueChart.current?.resize();
      deviceChart.current?.resize();
      funnelChart.current?.resize();
      cohortChart.current?.resize();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [echartsReady, data, filters]);

  const applyPreset = (daysBack: number) => {
    const range = getDefaultDateRange(daysBack);
    setFilters((f) => ({ ...f, start: range.start, end: range.end }));
  };

  return (
    <div className="space-y-6">
      <Script
        src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"
        strategy="afterInteractive"
        onLoad={() => setEchartsReady(true)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-sm text-muted-foreground">Interactive metrics, retention cohorts, funnels, and more.</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Slice the data by time range, channel, and device</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Date range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Date range</label>
              <div className="flex items-center gap-2">
                <input
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                  type="date"
                  value={filters.start}
                  max={filters.end}
                  onChange={(e) => setFilters((f) => ({ ...f, start: e.target.value }))}
                />
                <span className="text-muted-foreground">to</span>
                <input
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                  type="date"
                  value={filters.end}
                  min={filters.start}
                  onChange={(e) => setFilters((f) => ({ ...f, end: e.target.value }))}
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-2 text-xs">
                <button
                  className="rounded border border-border px-2 py-1 hover:bg-accent/30"
                  onClick={() => applyPreset(7)}
                >
                  Last 7 days
                </button>
                <button
                  className="rounded border border-border px-2 py-1 hover:bg-accent/30"
                  onClick={() => applyPreset(30)}
                >
                  Last 30 days
                </button>
                <button
                  className="rounded border border-border px-2 py-1 hover:bg-accent/30"
                  onClick={() => applyPreset(90)}
                >
                  Last 90 days
                </button>
              </div>
            </div>

            {/* Channels */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Channels</label>
              <div className="flex flex-wrap gap-3 text-sm">
                {CHANNELS.map((ch) => (
                  <label key={ch} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={filters.channels[ch]}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, channels: { ...f.channels, [ch]: e.target.checked } }))
                      }
                    />
                    <span>{ch}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Devices */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Devices</label>
              <div className="flex flex-wrap gap-3 text-sm">
                {DEVICES.map((dv) => (
                  <label key={dv} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={filters.devices[dv]}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, devices: { ...f.devices, [dv]: e.target.checked } }))
                      }
                    />
                    <span>{dv}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Users (period)</CardDescription>
            <CardTitle className="text-3xl">{formatNumber(data.kpis.totalUsers)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(data.kpis.totalRevenue)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Conversion Rate</CardDescription>
            <CardTitle className="text-3xl">{(data.kpis.conversionRate * 100).toFixed(2)}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Avg Session Duration</CardDescription>
            <CardTitle className="text-3xl">{data.kpis.avgSessionMinutes}m</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Active Users</CardTitle>
            <CardDescription>Trend with 7-day moving average and anomalies</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={dauRef} className="h-[320px] w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Channel</CardTitle>
            <CardDescription>Aggregated revenue within selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={revenueRef} className="h-[320px] w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Device Distribution</CardTitle>
            <CardDescription>Share of traffic by device category</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={deviceRef} className="h-[320px] w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>From visits to purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={funnelRef} className="h-[320px] w-full" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cohort Retention</CardTitle>
            <CardDescription>Weekly retention (12 cohorts × 8 weeks)</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={cohortRef} className="h-[420px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
