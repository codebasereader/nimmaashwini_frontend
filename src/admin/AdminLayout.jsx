import { Outlet } from "react-router-dom";
import Seo from "../components/Seo";
import {
  AdminSidebar,
  CONTENT_COLLAPSED_PL,
  CONTENT_EXPANDED_PL,
  useAdminSidebarCollapsed,
} from "./components/AdminNav";

export default function AdminLayout() {
  const { collapsed, toggle } = useAdminSidebarCollapsed();

  return (
    <div className="min-h-screen bg-cream-100">
      <Seo title="Admin" noindex />
      <AdminSidebar collapsed={collapsed} onToggle={toggle} />
      <div
        className={`min-h-screen transition-[padding] duration-200 ease-out ${
          collapsed ? CONTENT_COLLAPSED_PL : CONTENT_EXPANDED_PL
        }`}
      >
        <main className="px-4 py-6 sm:px-6 md:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
