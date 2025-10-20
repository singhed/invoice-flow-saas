# Reporting Export Endpoints (PDF/Excel)

This document describes the advanced reporting export endpoints added to the Go API service.

- Service: apps/api (Go)
- Base URL (local): http://localhost:8080

## Endpoints

GET /api/v1/reports/export

Query parameters:
- format: pdf | excel (xlsx alias supported via format=xlsx). Default: pdf
- start: Start date of range (YYYY-MM-DD or RFC3339). Default: 30 days ago
- end: End date of range (YYYY-MM-DD or RFC3339). Default: today
- count: Number of sample records to include (1-5000). Default: 100
- title: Optional report title shown in the PDF and metadata sheet in Excel
- groupBy: Grouping for the summary in Excel. Values: category | region | salesperson. Default: category

The endpoint streams a file download with the appropriate Content-Type and Content-Disposition headers.

Examples:

- Download PDF:
  curl -L "http://localhost:8080/api/v1/reports/export?format=pdf&start=2024-01-01&end=2024-03-31&count=250&title=Q1%20Sales%20Report"

- Download Excel:
  curl -L "http://localhost:8080/api/v1/reports/export?format=excel&start=2024-01-01&end=2024-03-31&groupBy=region"

## Output Details

PDF:
- Landscape A4 layout
- Branded header with title and date range
- Tabular data with alternating row fill, borders, and totals row
- Footer with page number

Excel (xlsx):
- Sheets: Data, Summary, and Meta (Meta only if a title is provided)
- Data sheet: frozen header row, auto-filter enabled, sensible column widths and number/date formatting, totals row for Quantity and Revenue
- Summary sheet: grouped totals by the chosen groupBy field, with bold totals row

Note: Data is synthetic for demonstration. Integrate with your data source by replacing the GenerateSampleData function in apps/api/internal/reporting/report.go.

## S3 Storage

Terraform now provisions a dedicated S3 bucket for exports:
- Bucket name: <project>-<env>-reports
- Versioning, default encryption (SSE-S3), lifecycle (IA/Glacier), and public access blocks enabled

Root Terraform outputs include:
- s3_report_bucket_name
- s3_report_bucket_arn

The API optionally uploads each generated export to this S3 bucket when configured via env vars:

Environment variables (in .env):
- REPORTS_S3_BUCKET: Bucket name (e.g., invoice-saas-dev-reports)
- REPORTS_S3_PREFIX: Optional key prefix (e.g., exports/advanced)

When REPORTS_S3_BUCKET is set, the export is streamed back to the client and also uploaded to S3 using the filename pattern: report_YYYYMMDD_hhmmss.(pdf|xlsx).
