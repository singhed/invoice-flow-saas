import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "../../molecules/dialog-modal";
import { Button } from "../../atoms/button";

describe("Modal (Dialog)", () => {
  it("opens when trigger clicked and renders content", async () => {
    const user = userEvent.setup();
    render(
      <Modal title="Confirm" description="Are you sure?" trigger={<Button>Open</Button>}>
        <p>Content</p>
      </Modal>
    );
    await user.click(screen.getByRole("button", { name: /open/i }));
    expect(screen.getByRole("heading", { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByText(/content/i)).toBeInTheDocument();
  });
});
