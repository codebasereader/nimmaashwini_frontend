import Footer from "./Footer";
import Navbar from "./Navbar";

export default function AppLayout({ children }) {
  return (
    <div className="grain-overlay min-h-screen bg-cream-100">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
