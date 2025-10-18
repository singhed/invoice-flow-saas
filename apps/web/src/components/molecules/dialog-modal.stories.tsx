import type { Meta, StoryObj } from "@storybook/react";
import { Modal } from "./dialog-modal";
import { Button } from "@/components/atoms/button";

const meta: Meta<typeof Modal> = {
  title: "Molecules/Modal",
  component: Modal,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => (
    <Modal title="Confirm" description="Are you sure?" trigger={<Button variant="outline">Open</Button>}>
      <p>Modal body content</p>
    </Modal>
  ),
};
