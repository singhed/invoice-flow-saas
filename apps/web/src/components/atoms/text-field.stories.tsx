import type { Meta, StoryObj } from "@storybook/react";
import { TextField } from "./text-field";

const meta: Meta<typeof TextField> = {
  title: "Atoms/TextField",
  component: TextField,
  parameters: { layout: "centered" },
  args: { label: "Email", placeholder: "you@example.com" },
};
export default meta;

type Story = StoryObj<typeof TextField>;

export const Default: Story = {};
export const HelperText: Story = { args: { helperText: "We'll never share your email." } };
export const Error: Story = { args: { error: "Invalid email" } };
