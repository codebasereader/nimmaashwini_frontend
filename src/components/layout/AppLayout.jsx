import Footer from "./Footer";
import Navbar from "./Navbar";
import TestingNoticeBar from "./TestingNoticeBar";
import TestingNoticePopup from "./TestingNoticePopup";

export default function AppLayout({ children }) {
  return (
    <div className="grain-overlay min-h-screen bg-cream-100">
      <TestingNoticeBar />
      <TestingNoticePopup />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
