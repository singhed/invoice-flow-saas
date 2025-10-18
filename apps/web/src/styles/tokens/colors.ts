// Color design tokens mapped to CSS custom properties
// Use HSL channel tuples so Tailwind can apply opacity via hsl(var(--token) / <alpha-value>)
export type SemanticColor =
  | "background"
  | "foreground"
  | "muted"
  | "muted-foreground"
  | "card"
  | "card-foreground"
  | "popover"
  | "popover-foreground"
  | "border"
  | "input"
  | "ring"
  | "primary"
  | "primary-foreground"
  | "secondary"
  | "secondary-foreground"
  | "accent"
  | "accent-foreground"
  | "destructive"
  | "destructive-foreground";

export const colors: Record<SemanticColor, string> = {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  muted: "hsl(var(--muted))",
  "muted-foreground": "hsl(var(--muted-foreground))",
  card: "hsl(var(--card))",
  "card-foreground": "hsl(var(--card-foreground))",
  popover: "hsl(var(--popover))",
  "popover-foreground": "hsl(var(--popover-foreground))",
  border: "hsl(var(--border))",
  input: "hsl(var(--input))",
  ring: "hsl(var(--ring))",
  primary: "hsl(var(--primary))",
  "primary-foreground": "hsl(var(--primary-foreground))",
  secondary: "hsl(var(--secondary))",
  "secondary-foreground": "hsl(var(--secondary-foreground))",
  accent: "hsl(var(--accent))",
  "accent-foreground": "hsl(var(--accent-foreground))",
  destructive: "hsl(var(--destructive))",
  "destructive-foreground": "hsl(var(--destructive-foreground))",
};
