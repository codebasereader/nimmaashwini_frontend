import { Link, useLocation } from "react-router-dom";

function parseHashTarget(to) {
  const value = String(to || "");
  const hashIndex = value.indexOf("#");
  if (hashIndex === -1) {
    return { pathname: value || "/", hash: "", id: "" };
  }

  const pathname = value.slice(0, hashIndex) || "/";
  const id = value.slice(hashIndex + 1);
  return { pathname, hash: id ? `#${id}` : "", id };
}

/**
 * Like React Router <Link>, but re-scrolls when the URL hash is already active
 * (e.g. clicking Shop Our Products again while already on /#products).
 */
export default function HashScrollLink({ to, onClick, children, ...props }) {
  const location = useLocation();
  const target = parseHashTarget(to);

  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented || !target.id) return;

    const samePage =
      location.pathname === target.pathname && location.hash === target.hash;

    if (!samePage) return;

    event.preventDefault();
    document
      .getElementById(target.id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Link to={to} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
