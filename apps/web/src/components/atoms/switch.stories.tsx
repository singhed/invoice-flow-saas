import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "./switch";

const meta: Meta<typeof Switch> = {
  title: "Atoms/Switch",
  component: Switch,
  parameters: { layout: "centered" },
  args: { label: "Notifications" },
};
export default meta;

type Story = StoryObj<typeof Switch>;

export const Default: Story = {};
