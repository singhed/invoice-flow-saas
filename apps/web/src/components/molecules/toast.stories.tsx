import type { Meta, StoryObj } from "@storybook/react";
import { NotificationToastStack, useToast } from "./toast";
import { Button } from "@/components/atoms/button";

function Trigger() {
  const { pushToast } = useToast();
  return (
    <Button onClick={() => pushToast({ title: "Saved", description: "Your changes have been saved." })}>
      Show toast
    </Button>
  );
}

const meta: Meta = {
  title: "Molecules/ToastStack",
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <NotificationToastStack>
      <Trigger />
    </NotificationToastStack>
  ),
};
