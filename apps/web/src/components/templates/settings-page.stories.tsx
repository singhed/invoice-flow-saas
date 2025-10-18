import type { Meta, StoryObj } from "@storybook/react";
import { SettingsPage } from "./settings-page";

const meta: Meta<typeof SettingsPage> = {
  title: "Templates/SettingsPage",
  component: SettingsPage,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof SettingsPage>;

export const Default: Story = {};
