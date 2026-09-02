import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import HashScrollLink from "../HashScrollLink";
import LeafMark from "../icons/LeafMark";
import { LEGAL_NAV } from "../../data/legalPages";
import { useStorefrontProducts } from "../../hooks/useStorefrontProducts";
import { getProductPath, sortStorefrontProducts } from "../../lib/product";
import { iconProps } from "../../lib/icons";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/#about" },
  { label: "Products", to: "/#products" },
  { label: "Our Process", to: "/#process" },
  { label: "Reviews", to: "/#reviews" },
  { label: "Contact Us", to: "/#contact" },
];

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[1.125rem] w-[1.125rem]"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-[1.125rem] w-[1.125rem]"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/ashwininaturalproducts/",
    icon: InstagramIcon,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@nimmaashwini09/videos",
    icon: YouTubeIcon,
  },
];

const CONTACT_ITEMS = [
  {
    label: "Phone",
    value: "+91 63632 50586",
    href: "tel:+916363250586",
    icon: Phone,
  },
  {
    label: "Email",
    value: "hello@ashwinibynatural.com",
    href: "mailto:hello@ashwinibynatural.com",
    icon: Mail,
  },
  {
    label: "Location",
    value: "Bengaluru, Karnataka, India",
    icon: MapPin,
  },
];

function FooterMenuColumn({ title, links, emptyLabel }) {
  return (
    <div className="min-w-[9rem]">
      <h3 className="mb-4 text-caption font-semibold tracking-[0.16em] text-gold-400 uppercase">
        {title}
      </h3>
      {links.length === 0 ? (
        <p className="text-body-sm text-cream-400">{emptyLabel || "—"}</p>
      ) : (
        <ul className="space-y-2.5">
          {links.map((link) => (
            <li key={link.to || link.label}>
              <HashScrollLink
                to={link.to}
                className="text-body-sm text-cream-200 transition-colors hover:text-white"
              >
                {link.label}
              </HashScrollLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SocialIcon({ label, href, icon: Icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="focus-ring flex h-11 w-11 items-center justify-center rounded-full border border-cream-300 bg-white text-brown-950 shadow-soft transition-colors hover:border-olive-600 hover:bg-cream-50 hover:text-olive-800"
    >
      <Icon />
    </a>
  );
}

function ContactCard({ item }) {
  const Icon = item.icon;
  const content = (
    <>
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-olive-200 bg-olive-100 text-olive-800">
        <Icon {...iconProps(20)} />
      </span>
      <span className="text-caption mb-1.5 font-semibold tracking-[0.14em] text-olive-700 uppercase">
        {item.label}
      </span>
      <span className="text-body-sm font-medium leading-snug text-brown-800">
        {item.value}
      </span>
    </>
  );

  const cardClass =
    "footer-contact-card focus-ring flex h-full flex-col items-center rounded-xl border border-cream-300 bg-white/80 p-6 text-center shadow-soft backdrop-blur-sm transition-shadow hover:shadow-card";

  if (item.href) {
    return (
      <a href={item.href} className={cardClass}>
        {content}
      </a>
    );
  }

  return <div className={cardClass}>{content}</div>;
}

export default function Footer() {
  const { items: products, status } = useStorefrontProducts();

  const productLinks = useMemo(
    () =>
      sortStorefrontProducts(products || [])
        .filter((product) => product.slug && product.name)
        .map((product) => ({
          label: product.name,
          to: getProductPath(product.slug),
        })),
    [products],
  );

  return (
    <footer id="contact" className="relative overflow-hidden">
      <div className="relative overflow-hidden border-t border-cream-300 bg-cream-100">
        <img
          src="/footerbg_anp.webp"
          alt=""
          aria-hidden="true"
          className="footer-contact-decor footer-contact-decor-top pointer-events-none absolute top-0 left-0 z-0 hidden h-[min(28vh,14rem)] w-auto max-w-[min(26vw,13rem)] object-contain object-top-left md:block lg:h-[min(32vh,16rem)] lg:max-w-[min(22vw,15rem)]"
        />
        <img
          src="/footerbg_anp.webp"
          alt=""
          aria-hidden="true"
          className="footer-contact-decor pointer-events-none absolute right-0 bottom-0 hidden h-[min(36vh,18rem)] w-auto max-w-[min(38vw,20rem)] object-contain object-right-bottom md:block lg:h-[min(40vh,22rem)] lg:max-w-[min(34vw,24rem)] hero-branches-decor"
        />

        <div className="container-ashwini relative z-10 py-12 sm:py-14 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <span className="products-heading-line hidden sm:block" />
              <LeafMark className="h-3.5 w-3.5 text-olive-600" size={14} />
              <h2 className="section-label text-olive-800">Connect With Us</h2>
              <LeafMark className="h-3.5 w-3.5 text-olive-600" size={14} />
              <span className="products-heading-line hidden sm:block" />
            </div>

            <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-3 sm:gap-5">
              {CONTACT_ITEMS.map((item) => (
                <ContactCard key={item.label} item={item} />
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center gap-4 sm:mt-12">
              <p className="text-caption font-semibold tracking-[0.14em] text-olive-700 uppercase">
                Follow Us
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {SOCIAL_LINKS.map((social) => (
                  <SocialIcon
                    key={social.label}
                    label={social.label}
                    href={social.href}
                    icon={social.icon}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-olive-900 text-white">
        <div className="container-ashwini py-10 lg:py-12">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,18rem)_1fr] lg:items-start lg:gap-12">
            <div className="flex flex-col items-start text-left">
              <Link
                to="/"
                className="focus-ring inline-flex h-20 w-20 items-center justify-center rounded-full bg-white p-2 sm:h-24 sm:w-24 sm:p-2.5 lg:h-28 lg:w-28 lg:p-3 xl:h-32 xl:w-32"
              >
                <img
                  src="/anp_logo.webp"
                  alt="Nimma Ashwini Be Natural"
                  className="h-full w-full object-contain"
                />
              </Link>
              <p className="mt-4 max-w-[14rem] text-body-sm leading-relaxed text-cream-300">
                Rooted in tradition. Committed to your wellness.
              </p>
            </div>

            <div className="grid grid-cols-2 justify-items-start gap-8 sm:grid-cols-3 sm:justify-items-center sm:gap-12 lg:flex lg:justify-center lg:gap-16 xl:gap-24">
              <FooterMenuColumn title="Quick Links" links={QUICK_LINKS} />
              <FooterMenuColumn
                title="Our Products"
                links={productLinks}
                emptyLabel={
                  status === "loading" ? "Loading products…" : "No products yet"
                }
              />
              <FooterMenuColumn title="Policies" links={LEGAL_NAV} />
            </div>
          </div>
        </div>

        <div className="border-t border-olive-800">
          <div className="container-ashwini flex flex-col gap-4 py-5 text-body-sm text-cream-200 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1 text-left">
              <p className="text-cream-200">
                © {new Date().getFullYear()} Nimma Ashwini Be Natural. All
                rights reserved.
              </p>
              <p className="text-cream-200">
                Designed &amp; Developed by{" "}
                <a
                  href="https://www.naviinfo.tech/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-cream-100 underline-offset-2 transition-colors hover:text-white hover:underline"
                >
                  Navi Infotech
                </a>
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 text-cream-200 sm:justify-end">
              {LEGAL_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-cream-200 hover:text-cream-100"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
