import type { Meta, StoryObj } from "@storybook/react";
import { IconButton } from "./icon-button";

const meta: Meta<typeof IconButton> = {
  title: "Atoms/IconButton",
  component: IconButton,
  parameters: { layout: "centered" },
  args: { children: "⭐", "aria-label": "Star" },
};
export default meta;

type Story = StoryObj<typeof IconButton>;

export const Default: Story = {};
export const Ghost: Story = { args: { variant: "ghost" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Secondary: Story = { args: { variant: "secondary" } };
