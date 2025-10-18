import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextField } from "../text-field";

describe("TextField", () => {
  it("associates label and input via id", () => {
    render(<TextField label="Email" placeholder="you@example.com" />);
    const input = screen.getByLabelText(/email/i);
    expect(input).toBeInTheDocument();
  });

  it("shows helper text and describedby", () => {
    render(<TextField label="Email" helperText="We will not spam" />);
    const input = screen.getByLabelText(/email/i);
    const helper = screen.getByText(/we will not spam/i);
    expect(helper).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-describedby", helper.id);
  });

  it("shows error text and sets aria-invalid", () => {
    render(<TextField label="Email" error="Invalid email" />);
    const input = screen.getByLabelText(/email/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(/invalid email/i);
  });

  it("accepts user typing", async () => {
    const user = userEvent.setup();
    render(<TextField label="Name" />);
    const input = screen.getByLabelText(/name/i) as HTMLInputElement;
    await user.type(input, "John");
    expect(input.value).toBe("John");
  });
});
