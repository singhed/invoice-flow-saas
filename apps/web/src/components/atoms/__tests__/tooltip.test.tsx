import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "../tooltip";
import { IconButton } from "../icon-button";

describe("Tooltip", () => {
  it("shows tooltip content on hover", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="More info" defaultOpen={false} delayDuration={0}>
        <IconButton aria-label="Info">i</IconButton>
      </Tooltip>
    );
    const trigger = screen.getByRole("button", { name: /info/i });
    await user.hover(trigger);
    expect(await screen.findByText(/more info/i)).toBeInTheDocument();
  });
});
