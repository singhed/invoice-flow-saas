import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./select";

const meta: Meta<typeof Select> = {
  title: "Atoms/Select",
  component: Select,
  parameters: { layout: "centered" },
  args: {
    placeholder: "Select option",
    items: [
      { label: "Option A", value: "a" },
      { label: "Option B", value: "b" },
    ],
  },
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {};
