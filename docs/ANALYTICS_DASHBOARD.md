# Advanced Analytics Dashboard

This document describes the Advanced Analytics Dashboard included in the web application (Next.js) under the route:

- /analytics

The dashboard provides interactive visualizations built with Apache ECharts (loaded via CDN). It uses synthetic, deterministic data for reliable demos without requiring any backend setup.

## Features

- KPI Cards
  - Total Users (within selected period)
  - Total Revenue
  - Conversion Rate
  - Average Session Duration
- Time Series
  - Daily Active Users (DAU)
  - 7-day Moving Average overlay
  - Simple anomaly detection highlighting outliers
- Revenue Breakdown by Channel
- Device Distribution (Desktop / Mobile / Tablet)
- Conversion Funnel (Visits → Product View → Add to Cart → Checkout → Purchase)
- Cohort Analysis Heatmap (12 cohorts × 8 weeks of retention)
- Filters
  - Date range (quick presets: 7, 30, 90 days)
  - Channel filter (Organic, Paid, Referral, Social, Email)
  - Device filter (Desktop, Mobile, Tablet)

## How It Works

- The page is a client component at apps/web/app/analytics/page.tsx.
- Charts are initialized after the ECharts CDN script loads (via next/script).
- Data is generated deterministically using a seeded RNG (Mulberry32) so the same selections produce consistent results.
- DAU Anomalies are detected by comparing residuals (value − MA7) against the series standard deviation and flagging points with |z| > 2.0.
- The Cohort Heatmap is indexed by cohort (weekly) on Y and weeks-since-start on X.
- Revenue is derived from visits using channel-specific ARPU multipliers.

## Tech Stack Choices

- Next.js 14 app router
- Tailwind CSS for layout and styling
- Apache ECharts from CDN for rich visualizations (no new npm dependencies)

## Extending with Real Data

You can replace the synthetic generator with real data in three steps:

1. Fetch Data
   - Replace the generateData(...) function with a call to your API(s) or use getServerSideProps-like endpoints if required.
2. Map to Dashboard Model
   - Normalize your backend shape into the GeneratedData interface used by the charts.
   - Ensure series data (e.g., days, dau) and aggregates (revenueByChannel, deviceDistribution) are computed.
3. Tune Visualizations
   - Adjust axis labels, tooltips, legend, and color scales to match your brand guidelines.

## Configuration

- Channels and devices are defined near the top of apps/web/app/analytics/page.tsx.
- You can edit channel/device shares and conversion rates to approximate your real business mix.
- Colors and chart options are set per chart using ECharts' option object (line colors, visualMap, legends, etc.).

## Accessibility and Responsiveness

- The dashboard layout is responsive and adapts from single-column on mobile to multi-column on desktop.
- Charts resize automatically on viewport changes.

## Troubleshooting

- If charts do not render:
  - Ensure the /analytics page is rendered as a client component (it is marked with "use client").
  - Verify the ECharts script loads (check the network tab). The app uses https://cdn.jsdelivr.net.
- If TypeScript complains about window.echarts:
  - The page uses (window as any).echarts to avoid typing issues since ECharts is loaded via CDN.

## Development Quick Start

- Run the dev server from the repo root:
  - pnpm dev
- Or run only the web app:
  - pnpm --filter web dev
- Open the dashboard at http://localhost:3000/analytics

## License

This dashboard is part of the main repository and is covered by the project's MIT license.
