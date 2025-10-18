import type { Meta, StoryObj } from "@storybook/react";
import { Pagination } from "./pagination";
import * as React from "react";

const meta: Meta<typeof Pagination> = {
  title: "Molecules/Pagination",
  component: Pagination,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  render: () => {
    const [page, setPage] = React.useState(2);
    return <Pagination page={page} pageCount={10} onPageChange={setPage} />;
  },
};
