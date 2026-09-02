// "Midnight Ink" — the shared token system for every generated SVG.
// Warm amber prompt against a cool indigo ground. Both themes are defined here
// so the dark and light variants can never drift apart.

export const themes = {
  dark: {
    ground: "#12131C",
    chrome: "#1A1B27",
    edge: "#272939",
    text: "#E4E4EF",
    dim: "#6B6F8A",
    prompt: "#F0A868",
    accent: "#5CC9C4",
    keyword: "#A79CF2",
    // Categorical ramp for the language bar, harmonised with the palette
    // rather than using GitHub's stock language colors.
    ramp: ["#5CC9C4", "#A79CF2", "#F0A868", "#E8798F", "#9BC77E"],
    rampRest: "#3A3D52",
  },
  light: {
    ground: "#F2F3F8",
    chrome: "#E6E8F2",
    edge: "#D2D6E4",
    text: "#1B1D2A",
    dim: "#71768F",
    prompt: "#B4611B",
    accent: "#0F7C77",
    keyword: "#5A45D6",
    ramp: ["#0F7C77", "#5A45D6", "#B4611B", "#B8365A", "#4C7A2E"],
    rampRest: "#C6CAD9",
  },
};

// JetBrains Mono is a true monospace at 1000 upem with a 600 advance,
// so every glyph is exactly 0.6em wide. All layout maths depends on this.
export const CHAR_RATIO = 0.6;
