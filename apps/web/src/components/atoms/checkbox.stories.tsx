import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Atoms/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
  args: { label: "Accept terms" },
};
export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};
