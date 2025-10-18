import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "../data-table";
import type { ColumnDef } from "@tanstack/react-table";

type Row = { name: string; value: number };

const columns: ColumnDef<Row>[] = [
  {
    header: "Name",
    accessorKey: "name",
  },
  {
    header: "Value",
    accessorKey: "value",
  },
];

const data: Row[] = [
  { name: "B", value: 2 },
  { name: "A", value: 1 },
];

describe("DataTable", () => {
  it("renders and sorts by column", async () => {
    const user = userEvent.setup();
    render(<DataTable columns={columns} data={data} />);

    const sortBtn = screen.getByRole("button", { name: /sort by name/i });
    await user.click(sortBtn);

    const rows = screen.getAllByRole("row");
    // rows[0] is header; check first data row content after sorting asc
    expect(rows[1]).toHaveTextContent(/a/i);
  });
});
