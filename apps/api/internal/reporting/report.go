package reporting

import (
    "bytes"
    "fmt"
    "image/color"
    "io"
    "math/rand"
    "sort"
    "strings"
    "time"

    "github.com/go-pdf/fpdf"
    "github.com/xuri/excelize/v2"
)

// ExportFormat represents the output format for a report.
type ExportFormat string

const (
    FormatPDF   ExportFormat = "pdf"
    FormatExcel ExportFormat = "excel"
)

// ExportOptions controls report metadata and filtering.
type ExportOptions struct {
    Title     string
    StartDate time.Time
    EndDate   time.Time
    GroupBy   string // optional: category | region | salesperson
}

// Record is a single row in the report dataset.
type Record struct {
    Date        time.Time
    Category    string
    Item        string
    Region      string
    Salesperson string
    Quantity    int
    UnitPrice   float64
}

func (r Record) Revenue() float64 { return float64(r.Quantity) * r.UnitPrice }

var categories = []string{"Software", "Hardware", "Services", "Subscriptions"}
var regions = []string{"North", "South", "East", "West"}
var items = []string{"Alpha", "Beta", "Gamma", "Delta", "Omega"}
var people = []string{"Ava", "Ben", "Cara", "Drew", "Eli", "Fay", "Gus"}

// GenerateSampleData returns n pseudo-random records within the date range.
func GenerateSampleData(n int, start, end time.Time) []Record {
    if end.Before(start) {
        start, end = end, start
    }
    if n <= 0 {
        n = 50
    }

    dur := end.Sub(start)
    rng := rand.New(rand.NewSource(start.UnixNano() ^ end.UnixNano() ^ time.Now().UnixNano()))

    data := make([]Record, 0, n)
    for i := 0; i < n; i++ {
        var ts time.Time
        if dur > 0 {
            offset := time.Duration(rng.Int63n(int64(dur)))
            ts = start.Add(offset)
        } else {
            ts = start
        }

        rec := Record{
            Date:        ts,
            Category:    categories[rng.Intn(len(categories))],
            Item:        items[rng.Intn(len(items))],
            Region:      regions[rng.Intn(len(regions))],
            Salesperson: people[rng.Intn(len(people))],
            Quantity:    1 + rng.Intn(50),
            UnitPrice:   20 + rng.Float64()*480, // $20 - $500
        }
        data = append(data, rec)
    }

    sort.Slice(data, func(i, j int) bool { return data[i].Date.Before(data[j].Date) })
    return data
}

// WriteExcelReport writes an Excel file containing the provided records.
func WriteExcelReport(w io.Writer, records []Record, opts ExportOptions) error {
    f := excelize.NewFile()

    // Data sheet
    const dataSheet = "Data"
    f.SetSheetName("Sheet1", dataSheet)
    headers := []string{"Date", "Category", "Item", "Region", "Salesperson", "Quantity", "Unit Price", "Revenue"}
    // Write headers
    for colIdx, h := range headers {
        cell, _ := excelize.CoordinatesToCellName(colIdx+1, 1)
        _ = f.SetCellStr(dataSheet, cell, h)
    }
    // Header style
    headStyle, _ := f.NewStyle(&excelize.Style{
        Font:      &excelize.Font{Bold: true, Color: "#FFFFFF"},
        Fill:      excelize.Fill{Type: "pattern", Color: []string{"#1F497D"}, Pattern: 1},
        Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
        Border: []excelize.Border{
            {Type: "left", Color: "#D9D9D9", Style: 1},
            {Type: "right", Color: "#D9D9D9", Style: 1},
            {Type: "top", Color: "#D9D9D9", Style: 1},
            {Type: "bottom", Color: "#D9D9D9", Style: 1},
        },
    })
    _ = f.SetCellStyle(dataSheet, "A1", "H1", headStyle)
    _ = f.SetRowHeight(dataSheet, 1, 22)

    dateStyle, _ := f.NewStyle(&excelize.Style{NumFmt: 14})         // mm-dd-yy
    currencyStyle, _ := f.NewStyle(&excelize.Style{NumFmt: 44})     // _-"$"* #,##0.00_
    numberStyle, _ := f.NewStyle(&excelize.Style{NumFmt: 3})        // #,##0
    altFillStyle, _ := f.NewStyle(&excelize.Style{Fill: excelize.Fill{Type: "pattern", Color: []string{"#F2F2F2"}, Pattern: 1}})

    // Data rows
    for i, r := range records {
        row := i + 2
        _ = f.SetCellValue(dataSheet, fmt.Sprintf("A%d", row), r.Date)
        _ = f.SetCellValue(dataSheet, fmt.Sprintf("B%d", row), r.Category)
        _ = f.SetCellValue(dataSheet, fmt.Sprintf("C%d", row), r.Item)
        _ = f.SetCellValue(dataSheet, fmt.Sprintf("D%d", row), r.Region)
        _ = f.SetCellValue(dataSheet, fmt.Sprintf("E%d", row), r.Salesperson)
        _ = f.SetCellValue(dataSheet, fmt.Sprintf("F%d", row), r.Quantity)
        _ = f.SetCellValue(dataSheet, fmt.Sprintf("G%d", row), r.UnitPrice)
        _ = f.SetCellValue(dataSheet, fmt.Sprintf("H%d", row), r.Revenue())

        // Apply styles per column
        _ = f.SetCellStyle(dataSheet, fmt.Sprintf("A%d", row), fmt.Sprintf("A%d", row), dateStyle)
        _ = f.SetCellStyle(dataSheet, fmt.Sprintf("F%d", row), fmt.Sprintf("F%d", row), numberStyle)
        _ = f.SetCellStyle(dataSheet, fmt.Sprintf("G%d", row), fmt.Sprintf("H%d", row), currencyStyle)
        if i%2 == 1 {
            _ = f.SetCellStyle(dataSheet, fmt.Sprintf("A%d", row), fmt.Sprintf("H%d", row), altFillStyle)
        }
    }

    // Totals row
    lastRow := len(records) + 2
    if len(records) > 0 {
        _ = f.SetCellStr(dataSheet, fmt.Sprintf("E%d", lastRow), "Totals:")
        _ = f.SetCellFormula(dataSheet, fmt.Sprintf("F%d", lastRow), fmt.Sprintf("SUM(F2:F%d)", lastRow-1))
        _ = f.SetCellFormula(dataSheet, fmt.Sprintf("H%d", lastRow), fmt.Sprintf("SUM(H2:H%d)", lastRow-1))
        _ = f.SetCellStyle(dataSheet, fmt.Sprintf("F%d", lastRow), fmt.Sprintf("F%d", lastRow), numberStyle)
        _ = f.SetCellStyle(dataSheet, fmt.Sprintf("H%d", lastRow), fmt.Sprintf("H%d", lastRow), currencyStyle)
        boldStyle, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}})
        _ = f.SetCellStyle(dataSheet, fmt.Sprintf("E%d", lastRow), fmt.Sprintf("H%d", lastRow), boldStyle)
    }

    // Sizing and filters
    _ = f.AutoFilter(dataSheet, "A1", "H1", "")
    _ = f.SetPanes(dataSheet, &excelize.Panes{Freeze: true, Split: true, XSplit: 0, YSplit: 1, TopLeftCell: "A2", ActivePane: "bottomLeft"})
    _ = f.SetColWidth(dataSheet, "A", "A", 12)
    _ = f.SetColWidth(dataSheet, "B", "E", 16)
    _ = f.SetColWidth(dataSheet, "F", "G", 12)
    _ = f.SetColWidth(dataSheet, "H", "H", 14)

    // Summary sheet grouped by GroupBy (default Category)
    groupBy := strings.ToLower(strings.TrimSpace(opts.GroupBy))
    if groupBy == "" {
        groupBy = "category"
    }
    summarySheet := "Summary"
    _, _ = f.NewSheet(summarySheet)
    _ = f.SetCellStr(summarySheet, "A1", strings.Title(groupBy))
    _ = f.SetCellStr(summarySheet, "B1", "Quantity")
    _ = f.SetCellStr(summarySheet, "C1", "Revenue")
    _ = f.SetCellStyle(summarySheet, "A1", "C1", headStyle)
    _ = f.SetRowHeight(summarySheet, 1, 22)

    aggregates := aggregateBy(records, groupBy)
    row := 2
    for key, agg := range aggregates {
        _ = f.SetCellStr(summarySheet, fmt.Sprintf("A%d", row), key)
        _ = f.SetCellInt(summarySheet, fmt.Sprintf("B%d", row), agg.Quantity)
        _ = f.SetCellFloat(summarySheet, fmt.Sprintf("C%d", row), agg.Revenue, 2, 64)
        _ = f.SetCellStyle(summarySheet, fmt.Sprintf("B%d", row), fmt.Sprintf("B%d", row), numberStyle)
        _ = f.SetCellStyle(summarySheet, fmt.Sprintf("C%d", row), fmt.Sprintf("C%d", row), currencyStyle)
        row++
    }
    // Totals on summary
    _ = f.SetCellStr(summarySheet, fmt.Sprintf("A%d", row), "Totals:")
    _ = f.SetCellFormula(summarySheet, fmt.Sprintf("B%d", row), fmt.Sprintf("SUM(B2:B%d)", row-1))
    _ = f.SetCellFormula(summarySheet, fmt.Sprintf("C%d", row), fmt.Sprintf("SUM(C2:C%d)", row-1))
    boldStyle, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}})
    _ = f.SetCellStyle(summarySheet, fmt.Sprintf("A%d", row), fmt.Sprintf("C%d", row), boldStyle)
    _ = f.SetColWidth(summarySheet, "A", "A", 20)
    _ = f.SetColWidth(summarySheet, "B", "C", 14)

    f.SetActiveSheet(f.GetSheetIndex(summarySheet))

    // Metadata sheet title
    if opts.Title != "" {
        _ = f.SetSheetPrOptions(dataSheet, excelize.ShowGridLines(false))
        meta := "Meta"
        _, _ = f.NewSheet(meta)
        _ = f.SetCellStr(meta, "A1", opts.Title)
        _ = f.SetCellStr(meta, "A2", fmt.Sprintf("Date Range: %s - %s", opts.StartDate.Format("2006-01-02"), opts.EndDate.Format("2006-01-02")))
        _ = f.SetColWidth(meta, "A", "A", 60)
        titleStyle, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true, Size: 16}})
        _ = f.SetCellStyle(meta, "A1", "A1", titleStyle)
    }

    // Write to the provided writer
    buf, err := f.WriteToBuffer()
    if err != nil {
        return err
    }
    _, err = io.Copy(w, bytes.NewReader(buf.Bytes()))
    return err
}

type agg struct {
    Quantity int
    Revenue  float64
}

func aggregateBy(records []Record, by string) map[string]agg {
    m := make(map[string]agg)
    for _, r := range records {
        key := ""
        switch by {
        case "region":
            key = r.Region
        case "salesperson":
            key = r.Salesperson
        default:
            key = r.Category
        }
        a := m[key]
        a.Quantity += r.Quantity
        a.Revenue += r.Revenue()
        m[key] = a
    }
    return m
}

// WritePDFReport writes a PDF file containing the provided records.
func WritePDFReport(w io.Writer, records []Record, opts ExportOptions) error {
    pdf := fpdf.New("L", "mm", "A4", "")
    pdf.SetMargins(10, 15, 10)
    pdf.SetAutoPageBreak(true, 12)

    // Header for each page
    pdf.SetHeaderFuncMode(func() {
        pdf.SetFont("Arial", "B", 14)
        pdf.CellFormat(0, 8, nonEmpty(opts.Title, "Sales Report"), "", 1, "L", false, 0, "")
        pdf.SetFont("Arial", "", 10)
        rangeText := fmt.Sprintf("Date Range: %s - %s", opts.StartDate.Format("2006-01-02"), opts.EndDate.Format("2006-01-02"))
        pdf.CellFormat(0, 6, rangeText, "", 1, "L", false, 0, "")
        pdf.Ln(2)
    }, true)
    pdf.SetFooterFunc(func() {
        pdf.SetY(-10)
        pdf.SetFont("Arial", "I", 8)
        pdf.CellFormat(0, 10, fmt.Sprintf("Page %d", pdf.PageNo()), "", 0, "C", false, 0, "")
    })

    pdf.AddPage()

    // Table headers
    headers := []string{"Date", "Category", "Item", "Region", "Salesperson", "Qty", "Unit Price", "Revenue"}
    widths := []float64{25, 40, 35, 30, 40, 15, 30, 30}
    align := []string{"L", "L", "L", "L", "L", "R", "R", "R"}

    pdf.SetFillColor(31, 73, 125)
    pdf.SetTextColor(255, 255, 255)
    pdf.SetDrawColor(217, 217, 217)
    pdf.SetLineWidth(0.1)
    pdf.SetFont("Arial", "B", 10)
    for i, h := range headers {
        pdf.CellFormat(widths[i], 8, h, "1", 0, "C", true, 0, "")
    }
    pdf.Ln(-1)

    // Reset text color for rows
    pdf.SetTextColor(0, 0, 0)
    pdf.SetFont("Arial", "", 9)

    alt := false
    var totalQty int
    var totalRev float64
    for _, r := range records {
        if alt {
            pdf.SetFillColor(242, 242, 242)
        } else {
            pdf.SetFillColor(255, 255, 255)
        }
        alt = !alt

        row := []string{
            r.Date.Format("2006-01-02"),
            r.Category,
            r.Item,
            r.Region,
            r.Salesperson,
            fmt.Sprintf("%d", r.Quantity),
            fmt.Sprintf("$%.2f", r.UnitPrice),
            fmt.Sprintf("$%.2f", r.Revenue()),
        }

        for i, cell := range row {
            pdf.CellFormat(widths[i], 7, cell, "1", 0, align[i], true, 0, "")
        }
        pdf.Ln(-1)

        totalQty += r.Quantity
        totalRev += r.Revenue()
    }

    // Totals row
    pdf.SetFont("Arial", "B", 10)
    pdf.SetFillColor(255, 255, 255)
    // Merge first five columns for label
    labelWidth := 25 + 40 + 35 + 30 + 40
    pdf.CellFormat(labelWidth, 8, "Totals:", "1", 0, "R", false, 0, "")
    pdf.CellFormat(15, 8, fmt.Sprintf("%d", totalQty), "1", 0, "R", false, 0, "")
    pdf.CellFormat(30, 8, "", "1", 0, "R", false, 0, "")
    pdf.CellFormat(30, 8, fmt.Sprintf("$%.2f", totalRev), "1", 0, "R", false, 0, "")

    return pdf.Output(w)
}

func nonEmpty(s, fallback string) string {
    if strings.TrimSpace(s) == "" {
        return fallback
    }
    return s
}

// helper to convert hex color to RGB (for potential future use)
func hexToRGB(hex string) (r, g, b int) {
    hx := strings.TrimPrefix(strings.TrimSpace(hex), "#")
    if len(hx) == 6 {
        var rr, gg, bb uint8
        _, _ = fmt.Sscanf(hx, "%02x%02x%02x", &rr, &gg, &bb)
        return int(rr), int(gg), int(bb)
    }
    c := color.White
    return int(c.R), int(c.G), int(c.B)
}
