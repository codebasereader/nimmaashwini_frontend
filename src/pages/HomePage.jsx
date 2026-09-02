import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AboutUs from "../components/sections/AboutUs";
import Hero from "../components/sections/Hero";
import Products from "../components/sections/Products";
import Process from "../components/sections/Process";
import Reviews from "../components/sections/Reviews";
import VoteofThanks from "../components/sections/VoteofThanks";
import WhyChoose from "../components/sections/WhyChoose";
import Youtube from "../components/sections/Youtube";
import Seo from "../components/Seo";
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "../lib/seoConfig";

const HOME_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: DEFAULT_OG_IMAGE,
    description: DEFAULT_DESCRIPTION,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  },
];

export default function HomePage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const id = hash.replace("#", "");
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <>
      <Seo path="/" jsonLd={HOME_JSON_LD} />
      <Hero />
      <AboutUs />
      <Products />
      <Reviews />
      <Process />
      <VoteofThanks />
      <Youtube />
      <WhyChoose />
    </>
  );
}
