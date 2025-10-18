import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "../switch";

describe("Switch", () => {
  it("toggles state on click", async () => {
    const user = userEvent.setup();
    render(<Switch label="Notify" />);
    const sw = screen.getByLabelText(/notify/i);
    expect(sw).toHaveAttribute("data-state", "unchecked");
    await user.click(sw);
    expect(sw).toHaveAttribute("data-state", "checked");
  });
});
