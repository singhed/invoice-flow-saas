import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "@/providers/theme-provider";

function Consumer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}

describe("ThemeProvider", () => {
  it("toggles dark class on documentElement", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="light">
        <Consumer />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains("dark")).toBe(false);

    await user.click(screen.getByRole("button", { name: /toggle theme/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
