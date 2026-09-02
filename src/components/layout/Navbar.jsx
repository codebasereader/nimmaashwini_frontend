import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Menu, ShoppingBag, X } from "lucide-react";
import HashScrollLink from "../HashScrollLink";
import { useCart } from "../../context/CartContext";
import { useStorefrontProducts } from "../../hooks/useStorefrontProducts";
import { useScrollDirection } from "../../hooks/useScrollDirection";
import { getProductPath, sortStorefrontProducts } from "../../lib/product";
import { iconProps } from "../../lib/icons";
import {
  fadeUp,
  smoothEase,
  springSnappy,
  staggerContainer,
} from "../../lib/motion";
import AnnouncementBar from "./AnnouncementBar";

const BASE_NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/#about" },
  { label: "Products", to: "/#products", hasProductDropdown: true },
  { label: "Our Process", to: "/#process" },
  { label: "Reviews", to: "/#reviews" },
  { label: "Contact Us", to: "/#contact" },
];

function useNavLinks() {
  const { items: products } = useStorefrontProducts();

  return useMemo(
    () =>
      BASE_NAV_LINKS.map((link) => {
        if (!link.hasProductDropdown) return link;

        return {
          ...link,
          children: sortStorefrontProducts(products).map((product) => ({
            label: product.name,
            to: getProductPath(product.slug),
          })),
        };
      }),
    [products],
  );
}

function IconButton({ label, children, onClick, className = "" }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`focus-ring flex h-10 w-10 items-center justify-center rounded-full text-brown-800 transition-colors hover:bg-cream-200 hover:text-olive-800 ${className}`}
    >
      {children}
    </button>
  );
}

function StickyCart() {
  const { itemCount } = useCart();

  return (
    <motion.div
      className="fixed top-4 right-4 z-[var(--z-float)] lg:top-5 lg:right-6"
      initial={{ opacity: 0, y: -16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...springSnappy, delay: 0.3 }}
    >
      <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} transition={springSnappy}>
        <Link
          to="/cart"
          aria-label={`Shopping cart, ${itemCount} items`}
          className="focus-ring relative flex h-11 w-11 items-center justify-center rounded-full border border-cream-300 bg-cream-50/95 text-brown-800 shadow-card backdrop-blur-sm transition-colors hover:border-olive-400"
        >
          <ShoppingBag {...iconProps(20)} />
          {itemCount > 0 ? (
            <motion.span
              key={itemCount}
              className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-olive-800 px-1 text-[0.65rem] font-semibold text-white"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={springSnappy}
            >
              {itemCount}
            </motion.span>
          ) : null}
        </Link>
      </motion.div>
    </motion.div>
  );
}

function NavLinks({ links, className = "", onNavigate, compact = false }) {
  const [openDropdown, setOpenDropdown] = useState(null);

  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 xl:gap-x-7 ${className}`}
    >
      {links.map((link) => (
        <li
          key={link.label}
          className="relative"
          onMouseEnter={() => link.children && setOpenDropdown(link.label)}
          onMouseLeave={() => link.children && setOpenDropdown(null)}
        >
          <HashScrollLink
            to={link.to}
            onClick={onNavigate}
            className={`font-display flex items-center gap-1 font-semibold whitespace-nowrap tracking-wide text-brown-800 transition-colors hover:text-olive-800 ${
              compact
                ? "text-[0.88rem] lg:text-[0.92rem]"
                : "text-[0.92rem] lg:text-[1rem] xl:text-[1.05rem]"
            }`}
          >
            {link.label}
            {link.children && <ChevronDown {...iconProps(12)} />}
          </HashScrollLink>

          <AnimatePresence>
            {link.children && openDropdown === link.label && (
              <motion.div
                className="absolute top-full left-1/2 z-[var(--z-dropdown)] mt-3 w-52 -translate-x-1/2 rounded-lg border border-cream-300 bg-cream-50 py-2 shadow-card"
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.22, ease: smoothEase }}
              >
                {link.children.map((child, index) => (
                  <motion.div
                    key={child.to}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    <Link
                      to={child.to}
                      onClick={onNavigate}
                      className="block px-4 py-2.5 text-body-sm text-brown-700 transition-colors hover:bg-cream-200 hover:text-olive-800"
                    >
                      {child.label}
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </li>
      ))}
    </ul>
  );
}

export default function Navbar() {
  const navLinks = useNavLinks();
  const { menuVisible, isAtTop } = useScrollDirection();
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const measure = () => {
      setHeaderHeight(headerRef.current?.offsetHeight ?? 0);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [isAtTop, mobileOpen, menuVisible]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);
  const showMenu = isAtTop || menuVisible;

  return (
    <>
      <StickyCart />

      {!isAtTop && <div aria-hidden="true" style={{ height: headerHeight }} />}

      <motion.div
        ref={headerRef}
        className={[
          "left-0 right-0 z-[var(--z-sticky)] bg-cream-100/95 backdrop-blur-sm",
          isAtTop ? "relative" : "fixed top-0 shadow-nav",
          !showMenu && !isAtTop && "pointer-events-none",
        ].join(" ")}
        animate={{ y: showMenu || isAtTop ? 0 : "-100%" }}
        transition={{ duration: 0.32, ease: smoothEase }}
      >
        {/* Announcement bar temporarily hidden */}
        {false && isAtTop && <AnnouncementBar />}

        <header className="border-b border-cream-300/80">
          <div className="container-ashwini py-3 pr-14 sm:py-4 sm:pr-16 lg:py-4 lg:pr-6">
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 lg:grid-cols-[minmax(0,15rem)_1fr_minmax(0,6rem)] lg:gap-6 xl:grid-cols-[minmax(0,17rem)_1fr_minmax(0,7rem)]">
              {/* Logo — left, larger */}
              <motion.div
                className="shrink-0 justify-self-start"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={springSnappy}
              >
                <Link to="/" className="focus-ring inline-block">
                  <img
                    src="/anp_logo.webp"
                    alt="Nimma Ashwini Be Natural"
                    className={`w-auto object-contain transition-all duration-300 ${
                      isAtTop
                        ? "h-[4.25rem] sm:h-20 lg:h-[5.5rem] xl:h-28"
                        : "h-16 sm:h-[4.25rem] lg:h-20"
                    }`}
                  />
                </Link>
              </motion.div>

              {/* Menus — centered on desktop */}
              <nav
                aria-label="Main navigation"
                className="hidden min-w-0 justify-self-center lg:block"
              >
                <NavLinks links={navLinks} compact={!isAtTop} />              </nav>

              {/* Actions — right */}
              <div className="flex items-center justify-end gap-0.5 justify-self-end sm:gap-1">
                <IconButton
                  label={mobileOpen ? "Close menu" : "Open menu"}
                  onClick={() => setMobileOpen((open) => !open)}
                  className="lg:hidden"
                >
                  {mobileOpen ? <X {...iconProps(20)} /> : <Menu {...iconProps(20)} />}
                </IconButton>
              </div>
            </div>
          </div>
        </header>
      </motion.div>

      <AnimatePresence>
        {mobileOpen && showMenu && (
          <motion.div
            className="fixed inset-0 z-[var(--z-overlay)] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.button
              type="button"
              aria-label="Close menu overlay"
              className="absolute inset-0 bg-brown-950/40"
              onClick={closeMobile}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="absolute top-0 left-0 flex h-full w-[min(20rem,85vw)] flex-col bg-cream-100 p-6 shadow-card"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.35, ease: smoothEase }}
            >
              <div className="mb-8 flex items-center justify-between gap-4">
                <img
                  src="/anp_logo.webp"
                  alt="Nimma Ashwini Be Natural"
                  className="h-16 w-auto object-contain sm:h-[4.5rem]"
                />
                <IconButton label="Close menu" onClick={closeMobile}>
                  <X {...iconProps(20)} />
                </IconButton>
              </div>

              <motion.nav
                aria-label="Mobile navigation"
                className="flex-1 overflow-y-auto"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                <ul className="space-y-1">
                  {navLinks.map((link) => (
                    <motion.li key={link.label} variants={fadeUp}>
                      <HashScrollLink
                        to={link.to}
                        onClick={closeMobile}
                        className="block rounded-md px-3 py-3 font-display text-xl font-semibold text-brown-800 hover:bg-cream-200"
                      >
                        {link.label}
                      </HashScrollLink>
                      {link.children && (
                        <ul className="mb-2 ml-4 space-y-1 border-l border-cream-300 pl-3">
                          {link.children.map((child) => (
                            <li key={child.to}>                              <Link
                                to={child.to}
                                onClick={closeMobile}
                                className="block rounded-md px-3 py-2 text-body-sm text-brown-600 hover:bg-cream-200 hover:text-olive-800"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.li>
                  ))}
                </ul>
              </motion.nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
