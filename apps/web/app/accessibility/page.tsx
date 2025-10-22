import { Metadata } from "next";
import { Breadcrumb } from "@/components/ui";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description:
    "Invoice Flow SaaS accessibility commitment and WCAG 2.1 Level AA compliance information",
};

export default function AccessibilityPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Breadcrumb items={[{ label: "Accessibility Statement" }]} />

      <div className="space-y-6">
        <div>
          <h1 className="mb-4 text-4xl font-bold">Accessibility Statement</h1>
          <p className="text-lg text-muted-foreground">
            Updated: October 2024
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Our Commitment</h2>
          <p className="leading-relaxed">
            Invoice Flow SaaS is committed to ensuring digital accessibility for people with
            disabilities. We continually improve the user experience for everyone and apply the
            relevant accessibility standards to ensure our application is accessible to all users.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Conformance Status</h2>
          <p className="leading-relaxed">
            The{" "}
            <a
              href="https://www.w3.org/WAI/standards-guidelines/wcag/"
              className="text-primary underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Web Content Accessibility Guidelines (WCAG)
            </a>{" "}
            define requirements for designers and developers to improve accessibility for people
            with disabilities. It defines three levels of conformance: Level A, Level AA, and Level
            AAA.
          </p>
          <p className="leading-relaxed">
            Invoice Flow SaaS is <strong>fully conformant</strong> with{" "}
            <strong>WCAG 2.1 Level AA</strong>. Fully conformant means that the content fully
            conforms to the accessibility standard without any exceptions.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Accessibility Features</h2>
          <p className="leading-relaxed">Invoice Flow SaaS includes the following features:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Keyboard Navigation:</strong> All functionality is available using only a
              keyboard
            </li>
            <li>
              <strong>Screen Reader Support:</strong> Compatible with NVDA, JAWS, and VoiceOver
            </li>
            <li>
              <strong>Clear Focus Indicators:</strong> Visible focus states on all interactive
              elements
            </li>
            <li>
              <strong>Descriptive Labels:</strong> All form inputs and buttons have clear labels
            </li>
            <li>
              <strong>Color Contrast:</strong> Text and UI elements meet WCAG AA standards (4.5:1
              for text, 3:1 for UI components)
            </li>
            <li>
              <strong>Responsive Text:</strong> Text can be resized up to 200% without loss of
              functionality
            </li>
            <li>
              <strong>Skip Navigation:</strong> Skip-to-content link for keyboard users
            </li>
            <li>
              <strong>Semantic HTML:</strong> Proper use of headings, landmarks, and semantic
              elements
            </li>
            <li>
              <strong>Error Prevention:</strong> Clear validation and error messages
            </li>
            <li>
              <strong>Reduced Motion:</strong> Respects prefers-reduced-motion user preference
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Assessment Approach</h2>
          <p className="leading-relaxed">
            Invoice Flow SaaS was assessed using a combination of:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Self-evaluation by our development team</li>
            <li>
              Automated testing tools (
              <a
                href="https://www.deque.com/axe/"
                className="text-primary underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                axe DevTools
              </a>
              ,{" "}
              <a
                href="https://developers.google.com/web/tools/lighthouse"
                className="text-primary underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Lighthouse
              </a>
              )
            </li>
            <li>Manual keyboard testing</li>
            <li>Screen reader testing with NVDA and VoiceOver</li>
            <li>Color contrast verification</li>
            <li>Responsive design testing at various zoom levels</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Feedback</h2>
          <p className="leading-relaxed">
            We welcome your feedback on the accessibility of Invoice Flow SaaS. Please let us know
            if you encounter any accessibility barriers:
          </p>
          <div className="rounded-lg border border-border bg-muted/30 p-6">
            <ul className="space-y-3">
              <li>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:accessibility@invoiceflow.app"
                  className="text-primary underline hover:no-underline"
                >
                  accessibility@invoiceflow.app
                </a>
              </li>
              <li>
                <strong>Response Time:</strong> We aim to respond within 3 business days
              </li>
              <li>
                <strong>Resolution Target:</strong> We strive to resolve issues within 10 business
                days
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Technical Specifications</h2>
          <p className="leading-relaxed">
            Accessibility of Invoice Flow SaaS relies on the following technologies to work with
            the particular combination of web browser and any assistive technologies or plugins
            installed on your computer:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>HTML5</li>
            <li>CSS3</li>
            <li>JavaScript (ES2020+)</li>
            <li>ARIA (Accessible Rich Internet Applications)</li>
          </ul>
          <p className="leading-relaxed">
            These technologies are relied upon for conformance with the accessibility standards
            used.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Limitations and Alternatives</h2>
          <p className="leading-relaxed">
            Despite our best efforts to ensure accessibility of Invoice Flow SaaS, there may be
            some limitations. Below is a description of known limitations, and potential solutions:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>JavaScript Required:</strong> The application requires JavaScript to function.
              Users with JavaScript disabled will not be able to use the application. We recommend
              enabling JavaScript or using a modern browser with JavaScript support.
            </li>
            <li>
              <strong>Browser Compatibility:</strong> For the best experience, we recommend using
              the latest version of Chrome, Firefox, Safari, or Edge.
            </li>
          </ul>
          <p className="leading-relaxed">
            If you encounter any issues not listed here, please contact us using the feedback
            information above.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Formal Complaints</h2>
          <p className="leading-relaxed">
            If you are not satisfied with our response to your accessibility concern, you may file a
            formal complaint by emailing{" "}
            <a
              href="mailto:accessibility@invoiceflow.app"
              className="text-primary underline hover:no-underline"
            >
              accessibility@invoiceflow.app
            </a>{" "}
            with &ldquo;Formal Accessibility Complaint&rdquo; in the subject line. Please include:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Your contact information</li>
            <li>Description of the accessibility barrier</li>
            <li>URL of the page(s) where the issue occurs</li>
            <li>Browser and assistive technology used (if applicable)</li>
            <li>Steps to reproduce the issue</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Date</h2>
          <p className="leading-relaxed">
            This accessibility statement was created on <strong>October 2024</strong> and was last
            reviewed on <strong>October 2024</strong>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Additional Resources</h2>
          <div className="space-y-2">
            <p className="leading-relaxed">
              For more information about web accessibility, please visit:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <a
                  href="https://www.w3.org/WAI/"
                  className="text-primary underline hover:no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  W3C Web Accessibility Initiative (WAI)
                </a>
              </li>
              <li>
                <a
                  href="https://www.ada.gov/"
                  className="text-primary underline hover:no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Americans with Disabilities Act (ADA)
                </a>
              </li>
              <li>
                <a
                  href="https://webaim.org/"
                  className="text-primary underline hover:no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WebAIM - Web Accessibility In Mind
                </a>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
