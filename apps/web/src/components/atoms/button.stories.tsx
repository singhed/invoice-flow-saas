import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "Atoms/Button",
  component: Button,
  parameters: {
    layout: "centered",
    controls: { expanded: true },
  },
  argTypes: {
    onClick: { action: "clicked" },
  },
  args: {
    children: "Button",
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Destructive: Story = { args: { variant: "destructive" } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
export const WithIcon: Story = { args: { leftIcon: "⭐" } };
