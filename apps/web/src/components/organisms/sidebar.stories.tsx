import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "./sidebar";

const meta: Meta<typeof Sidebar> = {
  title: "Organisms/Sidebar",
  component: Sidebar,
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  render: () => (
    <div className="h-64">
      <Sidebar items={[{ label: "Home", href: "/" }, { label: "Invoices", href: "/invoices" }]} />
    </div>
  ),
};
