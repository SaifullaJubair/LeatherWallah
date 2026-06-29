// import { Cormorant_Garamond, DM_Sans, Yatra_One } from "next/font/google";

// export const bodyFont = DM_Sans({
//   subsets: ["latin"],
//   weight: ["300", "400", "500", "600"],
//   variable: "--font-body",
// });

// export const titleFont = Cormorant_Garamond({
//   subsets: ["latin"],
//   weight: ["500", "600", "700"],
//   variable: "--font-title",
// });

// export const yatra = Yatra_One({
//   subsets: ["latin"],
//   weight: ["400"],
//   display: "swap",
// });
import localFont from "next/font/local";
import { Montserrat } from "next/font/google";

// Default sans (TweakCN theme + shadcn components opt-in via Tailwind
// `font-sans` / `var(--font-sans)`). NOT applied to <body> — the existing
// DM Sans (`bodyFont`) keeps body Bangla/English rendering unchanged.
export const sansFont = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const bodyFont = localFont({
  src: [
    {
      path: "../../public/fonts/dm-sans/dm-sans-v17-latin-300.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/dm-sans/dm-sans-v17-latin-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/dm-sans/dm-sans-v17-latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/dm-sans/dm-sans-v17-latin-600.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-body",
});

export const titleFont = localFont({
  src: [
    {
      path: "../../public/fonts/cormorant-garamond/cormorant-garamond-v21-latin-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/cormorant-garamond/cormorant-garamond-v21-latin-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/cormorant-garamond/cormorant-garamond-v21-latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-title",
});

export const yatra = localFont({
  src: "../../public/fonts/yatra-one/yatra-one-v16-latin-regular.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
});
