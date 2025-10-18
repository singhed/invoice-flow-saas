import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "./data-table";
import type { ColumnDef } from "@tanstack/react-table";

interface Row { id: number; name: string; amount: number }

const columns: ColumnDef<Row>[] = [
  { header: "Name", accessorKey: "name" },
  { header: "Amount", accessorKey: "amount" },
];

const rows: Row[] = [
  { id: 1, name: "Alpha", amount: 100 },
  { id: 2, name: "Beta", amount: 50 },
];

const meta: Meta<typeof DataTable<Row, unknown>> = {
  title: "Organisms/DataTable",
  component: DataTable as any,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof DataTable<Row, unknown>>;

export const Default: Story = {
  render: () => <DataTable columns={columns} data={rows} />,
};
