import { Link } from "react-router-dom";
import Seo from "../components/Seo";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <Seo title="Page Not Found" noindex />
      <p className="section-label mb-4 text-olive-600">404</p>
      <h1 className="font-display text-display-md text-brown-900">
        We couldn't find that page
      </h1>
      <p className="mt-3 text-body text-brown-600">
        The page you're looking for may have moved or no longer exists.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-brown-900 px-6 py-3 text-body-sm font-semibold text-cream-100 transition hover:bg-brown-800"
      >
        Back to Home
      </Link>
    </div>
  );
}
