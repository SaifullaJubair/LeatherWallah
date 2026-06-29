// src/app/(frontend)/page.js
import Home from "@/components/frontend/home/Home";
import { buildPageMeta } from "@/components/lib/buildPageMeta";

export async function generateMetadata() {
  return buildPageMeta("home");
}

export default function HomePage() {
  return <Home />;
}
