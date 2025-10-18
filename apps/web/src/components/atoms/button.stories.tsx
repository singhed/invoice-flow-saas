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

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
      <div className="grid grid-cols-4 items-center gap-3">
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" aria-label="icon only">⭐</Button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
        <Button leftIcon="⚡">With Icon</Button>
      </div>
    </div>
  ),
};
