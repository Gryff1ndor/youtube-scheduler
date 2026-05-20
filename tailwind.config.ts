import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // Tremor module
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    transparent: "transparent",
    current: "currentColor",
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // Our Custom UI Colors
        background:           "var(--background)",
        surface:              "var(--surface)",
        "surface-elevated":   "var(--surface-elevated)",
        foreground:           "var(--foreground)",
        "foreground-muted":   "var(--foreground-muted)",
        "foreground-subtle":  "var(--foreground-subtle)",
        border:               "var(--border)",
        "border-strong":      "var(--border-strong)",
        ring:                 "var(--ring)",
        input:                "var(--input)",
        destructive: {
          DEFAULT:            "var(--destructive)",
          foreground:         "var(--destructive-foreground)",
        },
        accent: {
          DEFAULT:            "var(--accent)",
          hover:              "var(--accent-hover)",
          subtle:             "var(--accent-subtle)",
          foreground:         "var(--accent-foreground)",
        },
        // Tremor UI Colors overrides mapping to our variables
        tremor: {
          brand: {
            faint: "var(--accent-subtle)",
            muted: "var(--accent-subtle)",
            subtle: "var(--accent-subtle)",
            DEFAULT: "var(--accent)",
            emphasis: "var(--accent-hover)",
            inverted: "var(--accent-foreground)",
          },
          background: {
            muted: "var(--surface-elevated)",
            subtle: "var(--surface-elevated)",
            DEFAULT: "var(--surface)",
            emphasis: "var(--foreground-muted)",
          },
          border: {
            DEFAULT: "var(--border)",
          },
          ring: {
            DEFAULT: "var(--ring)",
          },
          content: {
            subtle: "var(--foreground-subtle)",
            DEFAULT: "var(--foreground-muted)",
            emphasis: "var(--foreground)",
            strong: "var(--foreground)",
            inverted: "var(--background)",
          },
        },
        // dark mode mappings for Tremor
        "dark-tremor": {
          brand: {
            faint: "var(--accent-subtle)",
            muted: "var(--accent-subtle)",
            subtle: "var(--accent-subtle)",
            DEFAULT: "var(--accent)",
            emphasis: "var(--accent-hover)",
            inverted: "var(--accent-foreground)",
          },
          background: {
            muted: "var(--surface-elevated)",
            subtle: "var(--surface-elevated)",
            DEFAULT: "var(--surface)",
            emphasis: "var(--foreground-muted)",
          },
          border: {
            DEFAULT: "var(--border)",
          },
          ring: {
            DEFAULT: "var(--ring)",
          },
          content: {
            subtle: "var(--foreground-subtle)",
            DEFAULT: "var(--foreground-muted)",
            emphasis: "var(--foreground)",
            strong: "var(--foreground)",
            inverted: "var(--background)",
          },
        },
      },
      boxShadow: {
        // Tremor specific shadows
        "tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "tremor-card": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "tremor-dropdown": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "dark-tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "dark-tremor-card": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "dark-tremor-dropdown": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
      borderRadius: {
        "tremor-small": "0.375rem",
        "tremor-default": "0.5rem",
        "tremor-full": "9999px",
        apple: "12px",
      },
      fontSize: {
        "tremor-label": ["0.75rem", { lineHeight: "1rem" }],
        "tremor-default": ["0.875rem", { lineHeight: "1.25rem" }],
        "tremor-title": ["1.125rem", { lineHeight: "1.75rem" }],
        "tremor-metric": ["1.875rem", { lineHeight: "2.25rem" }],
      },
    },
  },
  safelist: [
    {
      pattern: /^(bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ["hover", "ui-selected"],
    },
    {
      pattern: /^(text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ["hover", "ui-selected"],
    },
    {
      pattern: /^(border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ["hover", "ui-selected"],
    },
    {
      pattern: /^(ring-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern: /^(stroke-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
    {
      pattern: /^(fill-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    },
  ],
  plugins: [require("@headlessui/tailwindcss")({ prefix: "ui" })],
};

export default config;
