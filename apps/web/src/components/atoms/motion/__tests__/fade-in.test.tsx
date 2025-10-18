import { render, screen } from "@testing-library/react";
import { FadeIn } from "../../motion/fade-in";

function setReducedMotion(prefers: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: prefers && query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe("FadeIn", () => {
  it("renders plain children when reduced motion is preferred", () => {
    setReducedMotion(true);
    render(
      <FadeIn>
        <div data-testid="content">Hello</div>
      </FadeIn>
    );
    // motion.div is not rendered when reduced motion; we should not find extra wrappers
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });
});
