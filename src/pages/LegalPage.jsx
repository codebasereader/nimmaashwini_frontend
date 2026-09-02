import { useEffect } from "react";
import { Link } from "react-router-dom";
import LeafMark from "../components/icons/LeafMark";
import Seo from "../components/Seo";
import { LEGAL_NAV, LEGAL_PAGES } from "../data/legalPages";

export default function LegalPage({ pageKey }) {
  const page = LEGAL_PAGES[pageKey];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pageKey]);

  if (!page) return null;

  return (
    <div className="pb-16 sm:pb-20">
      <Seo title={page.title} description={page.intro} />
      <section className="product-hero-bg relative overflow-hidden">
        <div className="container-ashwini section-padding">
          <div className="mx-auto max-w-3xl">
            <p className="section-label mb-4 flex items-center gap-2">
              <LeafMark size={14} className="h-3.5 w-3.5 text-olive-600" />
              <span>{page.label}</span>
            </p>
            <h1 className="font-display text-display-sm text-balance text-brown-900 sm:text-display-md">
              {page.title}
            </h1>
            {page.intro ? (
              <p className="mt-4 max-w-2xl text-body leading-relaxed text-brown-600">
                {page.intro}
              </p>
            ) : null}

            <article className="product-info-panel mt-8 space-y-8 p-6 sm:mt-10 sm:p-8 lg:p-10">
              {page.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="font-display text-xl font-semibold text-brown-900 sm:text-2xl">
                    {section.heading}
                  </h2>
                  <div className="mt-3 space-y-3">
                    {section.paragraphs.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-body-sm leading-relaxed text-brown-700 sm:text-body"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </article>

            <nav
              aria-label="Other policies"
              className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-cream-300 pt-6"
            >
              {LEGAL_NAV.filter((item) => item.to !== `/${page.slug}`).map(
                (item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="text-body-sm font-medium text-olive-800 underline-offset-4 transition-colors hover:text-olive-900 hover:underline"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>

            <div className="mt-8">
              <Link
                to="/"
                className="btn focus-ring border border-cream-300 bg-white px-6 py-3 text-brown-800 hover:border-olive-500 hover:text-olive-800"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
