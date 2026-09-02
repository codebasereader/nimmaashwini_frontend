import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  Database,
  FileSpreadsheet,
  LayoutDashboard,
  LayoutList,
  LogOut,
  Package,
  Receipt,
  Ticket,
  Users,
} from "lucide-react";
import { logout } from "../../store/slices/authSlice";
import { iconProps } from "../../lib/icons";

const SIDEBAR_KEY = "ashwini_admin_sidebar_collapsed";

export const SIDEBAR_EXPANDED_W = "w-52 sm:w-56";
export const SIDEBAR_COLLAPSED_W = "w-16";
export const CONTENT_EXPANDED_PL = "pl-52 sm:pl-56";
export const CONTENT_COLLAPSED_PL = "pl-16";

/** Shared admin nav — parent items may include `children` for submenus. */
export const ADMIN_NAV_ITEMS = [
  {
    id: "categories",
    label: "Categories",
    to: "/admin/categories",
    icon: LayoutList,
  },
  {
    id: "catalog-products",
    label: "Catalog",
    to: "/admin/products",
    icon: Package,
  },
  {
    id: "coupons",
    label: "Coupons",
    to: "/admin/coupons",
    icon: Ticket,
  },
  {
    id: "orders",
    label: "Orders",
    to: "/admin/orders",
    icon: ClipboardList,
  },
  {
    id: "customers",
    label: "Customer Data",
    to: "/admin/customers",
    icon: Users,
  },
  {
    id: "expenses",
    label: "Expenses",
    to: "/admin/expenses",
    icon: Receipt,
  },
  {
    id: "insights",
    label: "Insights",
    to: "/admin/insights",
    icon: LayoutDashboard,
  },
  {
    id: "master-data",
    label: "Master Data",
    icon: Database,
    children: [
      {
        id: "vendors",
        label: "Vendors",
        to: "/admin/vendors",
      },
      // {
      //   id: "master-products",
      //   label: "Products",
      //   to: "/admin/master-products",
      // },
      {
        id: "expense-categories",
        label: "Expense Categories",
        to: "/admin/expense-categories",
      },
      {
        id: "users",
        label: "Users",
        to: "/admin/users",
      },
      {
        id: "invoice-number",
        label: "Invoice Number",
        to: "/admin/invoice-number",
      },
    ],
  },
  {
    id: "gstr1",
    label: "GSTR-1 Filing",
    to: "/admin/gstr1",
    icon: FileSpreadsheet,
  },
];

export function useAdminSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const toggle = () => setCollapsed((value) => !value);

  return { collapsed, toggle };
}

function sideNavLinkClass(isActive, collapsed, nested = false) {
  return `flex items-center rounded-sm py-2.5 text-[0.72rem] font-semibold tracking-[0.1em] uppercase transition-colors ${
    collapsed ? "justify-center px-2" : nested ? "gap-2 pl-9 pr-3" : "gap-3 px-3"
  } ${
    isActive
      ? "bg-olive-800 text-white"
      : "text-brown-700 hover:bg-olive-100 hover:text-olive-800"
  }`;
}

function parentButtonClass(active, collapsed) {
  return `flex w-full items-center rounded-sm py-2.5 text-[0.72rem] font-semibold tracking-[0.1em] uppercase transition-colors ${
    collapsed ? "justify-center px-2" : "gap-3 px-3"
  } ${
    active
      ? "bg-olive-100 text-olive-800"
      : "text-brown-700 hover:bg-olive-100 hover:text-olive-800"
  }`;
}

function NavParentItem({ item, collapsed }) {
  const location = useLocation();
  const childPaths = useMemo(
    () => item.children.map((child) => child.to),
    [item.children],
  );
  const childActive = childPaths.some((path) =>
    location.pathname.startsWith(path),
  );
  const [open, setOpen] = useState(childActive);
  const Icon = item.icon;

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  if (collapsed) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          title={item.label}
          onClick={() => setOpen((value) => !value)}
          className={parentButtonClass(childActive, true)}
          aria-expanded={open}
        >
          <Icon
            {...iconProps(20)}
            className={`shrink-0 ${childActive ? "text-olive-800" : "text-brown-400"}`}
          />
        </button>
        {open &&
          item.children.map((child) => (
            <NavLink
              key={child.id}
              to={child.to}
              title={child.label}
              className={({ isActive }) => sideNavLinkClass(isActive, true)}
            >
              <span className="sr-only">{child.label}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            </NavLink>
          ))}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={parentButtonClass(childActive, false)}
        aria-expanded={open}
      >
        <Icon
          {...iconProps(20)}
          className={`shrink-0 ${childActive ? "text-olive-800" : "text-brown-400"}`}
        />
        <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
        <ChevronDown
          {...iconProps(14)}
          className={`shrink-0 text-brown-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-1 space-y-0.5">
          {item.children.map((child) => (
            <NavLink
              key={child.id}
              to={child.to}
              className={({ isActive }) =>
                sideNavLinkClass(isActive, false, true)
              }
            >
              <span className="truncate">{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminSidebar({ collapsed, onToggle }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[var(--z-sticky)] flex flex-col border-r border-cream-300 bg-cream-50 transition-[width] duration-200 ease-out ${
        collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W
      }`}
      aria-label="Admin navigation"
      aria-expanded={!collapsed}
    >
      <div
        className={`flex items-center border-b border-cream-300 py-4 ${
          collapsed ? "flex-col gap-3 px-2" : "justify-between gap-2 px-3"
        }`}
      >
        <div
          className={`flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-3"}`}
        >
          <img
            src="/anp_logo.webp"
            alt="Nimma Ashwini"
            className="h-9 w-auto shrink-0 object-contain"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display text-lg leading-tight text-brown-900">
                Admin
              </p>
              <p className="truncate text-[0.62rem] font-semibold tracking-[0.14em] text-olive-700 uppercase">
                Panel
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="focus-ring flex h-8 w-8 shrink-0 items-center justify-center rounded-sm text-brown-600 transition-colors hover:bg-cream-200 hover:text-olive-800"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            {...iconProps(16)}
            className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <nav
        className={`flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-4 ${
          collapsed ? "px-2" : "px-3"
        }`}
        aria-label="Admin sections"
      >
        {ADMIN_NAV_ITEMS.map((item) => {
          if (item.children?.length) {
            return (
              <NavParentItem
                key={item.id}
                item={item}
                collapsed={collapsed}
              />
            );
          }

          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) => sideNavLinkClass(isActive, collapsed)}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    {...iconProps(20)}
                    className={`shrink-0 ${isActive ? "text-white" : "text-brown-400"}`}
                  />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div
        className={`border-t border-cream-300 py-4 ${collapsed ? "px-2" : "px-4"}`}
      >
        {!collapsed && user && (
          <p className="mb-3 truncate text-body-sm text-brown-600">
            {user.name || user.email}
          </p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          className={`focus-ring inline-flex items-center justify-center gap-2 rounded-sm border border-terracotta-500/50 bg-transparent text-[0.68rem] font-semibold tracking-[0.12em] text-terracotta-600 uppercase transition-colors hover:border-terracotta-500 hover:bg-terracotta-500/10 ${
            collapsed ? "h-10 w-full px-0" : "w-full px-3 py-2"
          }`}
        >
          <LogOut {...iconProps(18)} className="shrink-0 text-terracotta-600" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
