import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Star } from "lucide-react";
import { fetchProductBySlug } from "../api/products";
import ProductImageGallery from "../components/product/ProductImageGallery";
import ProductCustomerReviews from "../components/product/ProductCustomerReviews";
import ProductMakingVideos, {
  HAIR_CARE_VIDEOS,
  MALT_MAKING_VIDEOS,
} from "../components/product/ProductMakingVideos";
import ProductSocialProof from "../components/product/ProductSocialProof";
import TraditionalSectionDecor from "../components/product/TraditionalSectionDecor";
import LeafMark from "../components/icons/LeafMark";
import { useCart } from "../context/CartContext";
import { isMultigrainMaltSlug, normalizeProduct } from "../lib/product";
import { iconProps } from "../lib/icons";
import {
  defaultTransition,
  fadeUp,
  springSnappy,
  staggerContainer,
  viewportOnce,
} from "../lib/motion";

const HAIR_OIL_SLUG = "herbal-hair-oil";

function SectionHeading({ label, title, description, light = false }) {
  return (
    <div className="max-w-2xl">
      <p
        className={`section-label mb-3 flex items-center gap-2 sm:mb-4 ${
          light ? "text-gold-300" : ""
        }`}
      >
        <LeafMark
          size={14}
          className={`h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5 ${
            light ? "text-gold-400" : "text-olive-600"
          }`}
        />
        <span>{label}</span>
      </p>
      <h2
        className={`font-display text-display-sm sm:text-display-md text-balance ${
          light ? "text-cream-100" : "text-brown-900"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-3 text-body-sm sm:text-body ${
            light ? "text-cream-300" : "text-brown-600"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

function BenefitCard({ benefit, index }) {
  return (
    <motion.article
      className="product-benefit-card p-5 sm:p-6"
      variants={fadeUp}
      transition={{ ...defaultTransition, delay: index * 0.06 }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-100 font-display text-sm font-bold text-olive-800">
          {index + 1}
        </span>
        <h3 className="font-display text-lg font-semibold text-brown-900">{benefit.title}</h3>
      </div>
      <p className="text-body-sm leading-relaxed text-brown-600">{benefit.description}</p>
    </motion.article>
  );
}

function StarRow({ rating = 5 }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          {...iconProps(16)}
          className={
            i < rating
              ? "fill-gold-500 text-gold-500"
              : "fill-cream-300 text-cream-300"
          }
        />
      ))}
    </div>
  );
}

function FaqItem({ faq, index }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="product-faq-item border-b border-cream-300 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="focus-ring flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-display text-base font-semibold text-brown-900 sm:text-lg">
          {faq.question}
        </span>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cream-300 text-olive-700 transition-transform duration-300 ${
            open ? "rotate-45" : ""
          }`}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-hidden"
      >
        <p className="pb-4 text-body-sm leading-relaxed text-brown-600">{faq.answer}</p>
      </motion.div>
    </div>
  );
}

function ProductLoading() {
  return (
    <div className="container-ashwini py-24 text-center">
      <p className="text-body-sm text-brown-600">Loading product...</p>
    </div>
  );
}

function ProductNotFound() {
  return (
    <div className="container-ashwini py-24 text-center">
      <h1 className="font-display text-3xl text-brown-900">Product not found</h1>
      <p className="mt-3 text-body-sm text-brown-600">
        The product you are looking for may have been moved or is no longer available.
      </p>
      <Link to="/" className="btn btn-primary focus-ring mt-8 inline-flex">
        Back to Home
      </Link>
    </div>
  );
}

function ProductPageDecor({ motif = "mandala" }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 right-0 h-64 w-64 rounded-full bg-olive-300/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 hidden h-48 w-48 rounded-full bg-gold-300/12 blur-3xl md:block"
      />
      <TraditionalSectionDecor
        motif={motif}
        layout={motif === "mandala" ? "corners" : "sides"}
        className="text-olive-700/20"
      />
    </>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState("loading");
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantityByVariant, setQuantityByVariant] = useState({});
  const [added, setAdded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setStatus("loading");
      setProduct(null);
      setSelectedVariant(null);
      setQuantityByVariant({});
      setAdded(false);

      try {
        const data = await fetchProductBySlug(slug);
        if (cancelled) return;

        const normalized = normalizeProduct(data);
        const firstVariant = normalized.variants[0] ?? null;
        setProduct(normalized);
        setSelectedVariant(firstVariant);
        if (firstVariant?.id) {
          setQuantityByVariant({ [firstVariant.id]: 1 });
        }
        setStatus("success");
      } catch {
        if (cancelled) return;
        setStatus("not-found");
      }
    }

    if (slug) {
      loadProduct();
    } else {
      setStatus("not-found");
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const maxQuantity =
    selectedVariant?.maxQuantityPerOrder ?? product?.maxQuantityPerOrder ?? 1;
  const selectedVariantId = selectedVariant?.id;
  const quantity = selectedVariantId
    ? (quantityByVariant[selectedVariantId] ?? 1)
    : 1;

  const setQuantity = (nextOrFn) => {
    if (!selectedVariantId) return;
    setQuantityByVariant((prev) => {
      const current = prev[selectedVariantId] ?? 1;
      const raw =
        typeof nextOrFn === "function" ? nextOrFn(current) : nextOrFn;
      return {
        ...prev,
        [selectedVariantId]: Math.max(1, Math.min(Number(raw) || 1, maxQuantity)),
      };
    });
  };

  const handleVariantSelect = (variant) => {
    if (!variant?.id) return;
    setSelectedVariant(variant);
    setQuantityByVariant((prev) => {
      if (prev[variant.id] != null) return prev;
      const fromQty = selectedVariantId ? (prev[selectedVariantId] ?? 1) : 1;
      const variantMax =
        variant.maxQuantityPerOrder ?? product?.maxQuantityPerOrder ?? 1;
      return {
        ...prev,
        [variant.id]: Math.max(1, Math.min(fromQty, variantMax)),
      };
    });
  };

  if (status === "loading") {
    return <ProductLoading />;
  }

  if (!product) {
    return <ProductNotFound />;
  }

  const hasReviews = product.reviews.length > 0;
  const avgRating = hasReviews
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      product.reviews.length
    : 0;

  const handleAddToCart = () => {
    addItem(product, { quantity, variant: selectedVariant });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  const handleBuyNow = () => {
    const nextItems = addItem(product, {
      quantity,
      variant: selectedVariant,
    });
    const uniqueProducts = new Set(nextItems.map((item) => item.productId))
      .size;

    // One product → address/checkout. Multiple products → review cart first.
    navigate(uniqueProducts > 1 ? "/cart" : "/checkout");
  };

  return (
    <div className="pb-16 sm:pb-20">
      <div className="border-b border-cream-300/80 bg-cream-100/90 backdrop-blur-sm">
        <div className="container-ashwini py-4">
          <nav aria-label="Breadcrumb" className="text-body-sm text-brown-500">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to="/" className="hover:text-olive-800">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to="/#products" className="hover:text-olive-800">
                  Products
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-brown-800">{product.name}</li>
            </ol>
          </nav>
        </div>
      </div>

      <section className="product-hero-bg relative overflow-hidden">
        <ProductPageDecor
          motif={
            isMultigrainMaltSlug(product.slug)
              ? "grain"
              : product.slug === HAIR_OIL_SLUG
                ? "oil"
                : "mandala"
          }
        />

        <motion.div
          className="container-ashwini relative z-10 section-padding pb-10 sm:pb-12"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
            <motion.div variants={fadeUp} transition={defaultTransition}>
              <ProductImageGallery images={product.images} alt={product.name} />
            </motion.div>

            <motion.div variants={fadeUp} transition={{ ...defaultTransition, delay: 0.08 }}>
              <p className="section-label mb-3 text-olive-700">Nimma Ashwini</p>
              <h1 className="font-display text-display-sm sm:text-display-md text-brown-900">
                {product.name}
              </h1>
              <p className="mt-2 text-body text-brown-600">{product.tagline}</p>

              <ProductSocialProof slug={product.slug} />

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {hasReviews ? (
                  <>
                    <StarRow rating={Math.round(avgRating)} />
                    <span className="text-body-sm text-brown-500">
                      {avgRating.toFixed(1)} · {product.reviews.length} reviews
                    </span>
                  </>
                ) : null}
              </div>

              <p className="mt-5 font-display text-3xl font-semibold text-olive-800">
                {selectedVariant.priceDisplay}
              </p>

              <p className="mt-4 max-w-lg text-body-sm leading-relaxed text-brown-700 sm:text-body">
                {product.description}
              </p>

              <ul className="mt-5 space-y-2">
                {product.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex items-start gap-2 text-body-sm text-brown-700"
                  >
                    <LeafMark className="mt-0.5 h-3.5 w-3.5 shrink-0 text-olive-600" />
                    {highlight}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <p className="mb-2 text-caption font-semibold tracking-[0.14em] text-brown-600 uppercase">
                  Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => handleVariantSelect(variant)}
                      className={`focus-ring rounded-full border px-4 py-2 text-body-sm font-medium transition-colors ${
                        selectedVariant.id === variant.id
                          ? "border-olive-700 bg-olive-800 text-white"
                          : "border-cream-300 bg-white text-brown-700 hover:border-olive-500"
                      }`}
                    >
                      {variant.label} — {variant.priceDisplay}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-2 text-caption font-semibold tracking-[0.14em] text-brown-600 uppercase">
                  Quantity
                </p>
                <div className="inline-flex items-center rounded-full border border-cream-300 bg-white">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="focus-ring flex h-10 w-10 items-center justify-center text-lg text-brown-700 hover:text-olive-800"
                  >
                    −
                  </button>
                  <span className="min-w-10 text-center text-body-sm font-semibold text-brown-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                    disabled={quantity >= maxQuantity}
                    className="focus-ring flex h-10 w-10 items-center justify-center text-lg text-brown-700 hover:text-olive-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <motion.button
                  type="button"
                  onClick={handleBuyNow}
                  className="btn btn-primary focus-ring min-w-[10rem] px-8 py-3.5"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={springSnappy}
                >
                  Buy Now
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleAddToCart}
                  className="btn focus-ring min-w-[10rem] border border-cream-300 bg-white px-8 py-3.5 text-brown-800 hover:border-olive-500 hover:text-olive-800"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={springSnappy}
                >
                  {added ? "Added to Cart ✓" : "Add to Cart"}
                </motion.button>
                <Link
                  to="/#products"
                  className="btn focus-ring inline-flex items-center justify-center border border-transparent px-4 py-3.5 text-brown-700 hover:text-olive-800"
                >
                  View All Products
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {isMultigrainMaltSlug(product.slug) ? (
        <ProductMakingVideos videos={MALT_MAKING_VIDEOS} />
      ) : null}

      {product.slug === HAIR_OIL_SLUG ? (
        <ProductMakingVideos
          label="Hair Care"
          title="Hair Care Video"
          description="For Hair Care Video — click below to watch how to use Nimma Ashwini Herbal Hair Oil."
          videos={HAIR_CARE_VIDEOS}
        />
      ) : null}

      <ProductCustomerReviews productName={product.name} />

      {product.specifications.length > 0 ? (
      <section className="product-section-cream relative overflow-hidden border-t border-cream-300/80 section-padding">
        <TraditionalSectionDecor motif="kolam" />
        <div className="container-ashwini relative">
          <SectionHeading
            label="Details"
            title="Specifications"
            description={`Everything you need to know about ${product.name}.`}
          />
          <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {product.specifications.map((spec) => (
              <div
                key={spec.label}
                className="product-info-panel p-4 sm:p-5"
              >
                <dt className="text-caption font-semibold tracking-[0.12em] text-brown-500 uppercase">
                  {spec.label}
                </dt>
                <dd className="mt-1.5 text-body-sm font-medium text-brown-800">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      ) : null}

      {product.benefits.length > 0 ? (
      <section className="product-section-olive relative overflow-hidden section-padding">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 left-1/2 h-56 w-[32rem] -translate-x-1/2 rounded-full bg-olive-600/15 blur-3xl"
        />
        <motion.div
          className="container-ashwini relative"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} transition={defaultTransition}>
            <SectionHeading
              label="Benefits"
              title="Why You'll Love It"
              description={`Discover how ${product.name} supports your natural wellness routine.`}
              light
            />
          </motion.div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:gap-5">
            {product.benefits.map((benefit, index) => (
              <BenefitCard key={benefit.title} benefit={benefit} index={index} />
            ))}
          </div>
        </motion.div>
      </section>
      ) : null}

      {product.faqs.length > 0 ? (
      <section className="relative overflow-hidden bg-cream-50 section-padding">
        <TraditionalSectionDecor motif="mandala" layout="corners" />
        <div className="container-ashwini relative">
          <SectionHeading
            label="Questions"
            title="Frequently Asked Questions"
            description={`Common questions about ${product.name}.`}
          />
          <div className="product-faq-list mt-8 rounded-xl border border-cream-300 bg-white/90 px-5 shadow-soft backdrop-blur-sm sm:px-6">
            {product.faqs.map((faq, index) => (
              <FaqItem key={faq.question} faq={faq} index={index} />
            ))}
          </div>
        </div>
      </section>
      ) : null}
    </div>
  );
}
