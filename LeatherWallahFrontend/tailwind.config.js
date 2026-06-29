/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Primary palette — vibrant brand green for FruitSnacks (fresh,
        //    natural, fruity). DEFAULT ≈ emerald-600, more saturated than
        //    the previous forest-green so CTAs/buttons pop. Shades follow
        //    the Tailwind green/emerald curve so 500 is the strong brand
        //    tone and 50/100 stay legible as backgrounds.
        primary: {
          50: "#E8F5E9",
          100: "#C8E6C9",
          200: "#A5D6A7",
          300: "#81C784",
          400: "#4CAF50",
          500: "#1B5E20",   // brand — deep rich green
          600: "#174D1B",
          700: "#133D16",
          800: "#0F2E11",
          900: "#0A1F0C",
          DEFAULT: "#1B5E20",
        },
        secondary: {
          50: "#F0E9E8",
          100: "#D7C3C0",
          200: "#BC9D98",
          300: "#9F7973",
          400: "#82554F",
          500: "#673E39",
          600: "#53312D",
          700: "#402521",
          800: "#2D1815",
          900: "#1D0E0B",
          DEFAULT: "#3E2723",
        },
        accent: {
          50: "#FDF9F4",
          100: "#FAF4EC",
          200: "#F5E9DD",
          300: "#EFDECD",
          400: "#E9D3BE",
          500: "#E2C8AE",
          600: "#D5B08C",
          700: "#C79869",
          800: "#B88146",
          900: "#A96923",
          DEFAULT: "#EDE0D4",
        },
        neutral: {
          50: "#F5F5F5",
          100: "#E9E9E9",
          200: "#D2D2D2",
          300: "#BCBCBC",
          400: "#A5A5A5",
          500: "#8F8F8F",
          600: "#787878",
          700: "#626262",
          800: "#4B4B4B",
          900: "#353535",
          DEFAULT: "#8F8F8F",
        },
        complementary: {
          50: "#F9EEED",
          100: "#F2D9D7",
          200: "#E6B3AF",
          300: "#D98D87",
          400: "#CD675F",
          500: "#C04137",
          600: "#9A342C",
          700: "#732721",
          800: "#4D1A16",
          900: "#260D0B",
          DEFAULT: "#C04137",
        },
        orange: {
          100: "#ffe9db",
          200: "#ffd3b8",
          300: "#ffbd94",
          400: "#ffa771",
          500: "#ff914d",
          550: "#FF784B",
          600: "#cc743e",
          700: "#99572e",
          800: "#663a1f",
          900: "#331d0f",
        },

        blackVariant: {
          obsidian: "#0B1215",
          lavaBlack: "#352f36",
          oilBlack: "#0C0C0C",
        },
        text: {
          Lightest: "#9ca3af",
          Lighter: "#6b7280",
          light: "#4b5563",
          semiLight: "#374151",
          default: "#1f2937",
          dark: "#111827",
        },
        darkblack: {
          300: "#747681",
          400: "#2A313C",
          500: "#23262B",
          600: "#1D1E24",
          700: "#151515",
        },
        success: {
          50: "#D9FBE6",
          100: "#B7FFD1",
          200: "#4ADE80",
          300: "#22C55E",
          400: "#16A34A",
        },
        warning: {
          100: "#FDE047",
          200: "#FACC15",
          300: "#EAB308",
        },
        error: {
          50: "#FCDEDE",
          100: "#FF7171",
          200: "#FF4747",
          300: "#DD3333",
          400: "#B91C1C",
          500: "#d22e2e",
          600: "#a82525",
          700: "#7e1c1c",
          800: "#541212",
        },
        bgray: {
          50: "#FAFAFA",
          100: "#F7FAFC",
          200: "#EDF2F7",
          300: "#E2E8F0",
          400: "#CBD5E0",
          500: "#A0AEC0",
          600: "#718096",
          700: "#4A5568",
          800: "#2D3748",
          900: "#1A202C",
        },
        bamber: {
          50: "#FFFBEB",
          100: "#FFC837",
          500: "#F6A723",
        },
        purple: "#936DFF",
        // Dynamic Product Page System — resolve from CSS variables injected
        // on the product page server component. Defaults are sensible neutrals
        // so existing pages render unchanged when not on a themed product page.
        brand: {
          DEFAULT: "var(--brand-primary, #10B981)",
          light: "var(--brand-primary-light, #6EE7B7)",
          dark: "var(--brand-primary-dark, #047857)",
        },
        "page-bg": "var(--page-bg, #FAFAFA)",
        "section-bg": "var(--section-bg, #F3F4F6)",
        heading: "var(--heading-color, #111827)",
        body: "var(--body-color, #374151)",
        accent2: "var(--accent-color, #F59E0B)",
        // Default site theme (TweakCN-adapted, oklch direct — no HSL wrapper
        // because the vars in globals.css are oklch, not HSL channels).
        // NOTE: keys "primary", "secondary", "accent" already exist above as
        // the legacy palette objects (primary.50..900, primary.DEFAULT). To
        // avoid clashing with those existing utilities we expose the shadcn
        // tokens under namespaced keys: "surface", "fg" (with foregrounds)
        // and "ui-*" for the rest. shadcn-ui primitive components are wired
        // to these in components/ui/* if used.
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      fontFamily: {
        // English-leaning sans (shadcn / mixed content). Bangla components
        // keep their own family (Hind Siliguri etc.) via utils/font.js.
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwind-scrollbar"),
    require("tailwindcss-animate"),
    [require("tailwindcss-motion")],
  ],
};
