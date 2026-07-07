"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiChevronRight, FiFileText } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import useGetSettingData from "@/components/lib/getSettingData";
import CustomLoader from "@/components/shared/loader/CustomLoader";
import { POLICY_PAGES, getPolicyBySlug } from "./policyMeta";
import PolicyToc from "./PolicyToc";
import "@/styles/richtext.css"; // same styles the admin editor + PDP use

// Shared layout for every content/legal page (About, Terms, Privacy, …). The
// body is admin-authored rich HTML from site settings; this wraps it in a
// premium reading layout: header band, sticky policy-nav + on-this-page TOC
// sidebar, a readable prose column, and a support CTA.
export default function PolicyPageLayout({ slug }) {
  const pathname = usePathname();
  const { data: settingsData, isLoading } = useGetSettingData();
  const site = settingsData?.data?.[0];

  const meta = getPolicyBySlug(slug);
  const html = site?.[meta?.settingKey];

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      {/* ── Header band ── */}
      <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12">
          {/* breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <FiChevronRight size={12} />
            <span className="text-white/90">{meta?.label}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            {meta?.title}
          </h1>
          {meta?.subtitle && (
            <p className="mt-3 text-sm md:text-base text-white/75 max-w-xl">
              {meta.subtitle}
            </p>
          )}
          {/* gold hairline */}
          <div className="mt-6 h-px w-24 bg-accent-500/70" />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-8">
              {/* policy nav */}
              <nav aria-label="Policies">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Information
                </p>
                <ul className="space-y-0.5">
                  {POLICY_PAGES.map((p) => {
                    const active = pathname === `/${p.slug}`;
                    return (
                      <li key={p.slug}>
                        <Link
                          href={`/${p.slug}`}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            active
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          <FiFileText size={14} className="shrink-0 opacity-70" />
                          {p.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              {/* on-this-page TOC */}
              {!isLoading && html && <PolicyToc containerId="policy-content" />}
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0">
            {/* Mobile policy switcher */}
            <div className="lg:hidden mb-6">
              <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Jump to
              </label>
              <select
                className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
                value={`/${slug}`}
                onChange={(e) => { window.location.href = e.target.value; }}
              >
                {POLICY_PAGES.map((p) => (
                  <option key={p.slug} value={`/${p.slug}`}>{p.label}</option>
                ))}
              </select>
            </div>

            <article className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 sm:px-8 lg:px-10 py-8 lg:py-10">
              {isLoading ? (
                <CustomLoader />
              ) : html ? (
                <div
                  id="policy-content"
                  className="rt-content mx-auto"
                  style={{ maxWidth: "72ch" }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <div className="text-center py-16">
                  <FiFileText size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">This page hasn&apos;t been set up yet.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Content can be added from Admin → Settings → Policies.
                  </p>
                </div>
              )}
            </article>

            {/* Support CTA */}
            {site?.watsapp && (
              <div className="mt-8 rounded-2xl bg-primary-900 text-white px-6 py-6 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold text-lg">Still have questions?</p>
                  <p className="text-white/70 text-sm mt-0.5">
                    Our team is happy to help with anything you need.
                  </p>
                </div>
                <a
                  href={site.watsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 hover:bg-accent-600 text-primary-900 font-semibold px-5 py-2.5 text-sm transition-colors shrink-0"
                >
                  <FaWhatsapp size={16} /> Chat with us
                </a>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
