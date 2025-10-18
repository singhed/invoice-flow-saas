import type { Meta, StoryObj } from "@storybook/react";
import { DashboardShell } from "./dashboard-shell";

const meta: Meta<typeof DashboardShell> = {
  title: "Templates/DashboardShell",
  component: DashboardShell,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof DashboardShell>;

export const Default: Story = {
  render: () => (
    <DashboardShell sidebarItems={[{ label: "Home", href: "/" }, { label: "Invoices", href: "/invoices" }]}>
      <div className="p-4">Content area</div>
    </DashboardShell>
  ),
};
