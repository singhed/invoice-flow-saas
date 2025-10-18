import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup } from "./radio-group";

const meta: Meta<typeof RadioGroup> = {
  title: "Atoms/RadioGroup",
  component: RadioGroup,
  parameters: { layout: "centered" },
  args: {
    name: "plan",
    items: [
      { label: "Basic", value: "basic" },
      { label: "Pro", value: "pro" },
    ],
  },
};
export default meta;

type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {};
