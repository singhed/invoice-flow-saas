import type { Meta, StoryObj } from "@storybook/react";
import { AuthForm } from "./auth-form";

const meta: Meta<typeof AuthForm> = {
  title: "Templates/AuthForm",
  component: AuthForm,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof AuthForm>;

export const Default: Story = {
  args: {
    onSubmit: async () => new Promise((r) => setTimeout(r, 300)),
  },
};
