import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "../checkbox";

describe("Checkbox", () => {
  it("toggles via mouse and label", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Accept" />);
    const input = screen.getByLabelText(/accept/i);
    expect(input).toHaveAttribute("data-state", "unchecked");
    await user.click(input);
    expect(input).toHaveAttribute("data-state", "checked");
    await user.click(screen.getByText(/accept/i));
    expect(input).toHaveAttribute("data-state", "unchecked");
  });
});
