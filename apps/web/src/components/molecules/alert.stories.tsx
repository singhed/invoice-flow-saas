import type { Meta, StoryObj } from "@storybook/react";
import { Alert } from "./alert";

const meta: Meta<typeof Alert> = {
  title: "Molecules/Alert",
  component: Alert,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Alert>;

export const Default: Story = { args: { title: "Heads up", description: "This is an example alert." } };
export const Destructive: Story = {
  args: { title: "Error", description: "Something went wrong.", variant: "destructive" },
};
export const Success: Story = {
  args: { title: "Success", description: "All good.", variant: "success" },
};
export const Warning: Story = {
  args: { title: "Warning", description: "Be careful.", variant: "warning" },
};
