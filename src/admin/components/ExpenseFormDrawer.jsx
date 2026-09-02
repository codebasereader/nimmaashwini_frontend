import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Check,
  ChevronDown,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  addExpense,
  clearExpenseErrors,
  editExpense,
} from "../../store/slices/expensesSlice";
import {
  loadExpenseCategories,
  loadExpenseCategoryById,
  removeExpenseCategory,
} from "../../store/slices/expenseCategoriesSlice";
import { loadVendors } from "../../store/slices/vendorsSlice";
import { getEntityId } from "../../store/slices/crudHelpers";
import { iconProps } from "../../lib/icons";
import { formatINR, roundMoney } from "../lib/purchaseMath";
import {
  gstSplitLabel,
  isIntraStateKarnataka,
  splitGstByPlaceOfSupply,
  TAX_TYPE_IGST,
} from "../../lib/gst";
import AdminDrawer from "./AdminDrawer";
import ConfirmDialog from "./ConfirmDialog";
import ExpenseCategoryFormDrawer from "./ExpenseCategoryFormDrawer";
import VendorFormDrawer from "./VendorFormDrawer";
import {
  AdminField,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from "./AdminFormFields";

export const PAYMENT_TYPES = [
  "UPI",
  "Cash",
  "Card",
  "Net Banking",
  "Cheque",
  "EMI",
];

export const TAX_PERCENT_OPTIONS = [5, 18];

export const AMOUNT_TYPES = [
  { value: "total", label: "Total Amount" },
  { value: "taxable", label: "Taxable Amount" },
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function toInputDate(value) {
  if (!value) return todayISO();
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return todayISO();
  return parsed.toISOString().slice(0, 10);
}

function calcLineFromTotal(total, taxPercent, place = {}) {
  const rate = Number(taxPercent) || 0;
  const totalAmount = roundMoney(total);
  const taxableAmount =
    rate > 0 ? roundMoney(totalAmount / (1 + rate / 100)) : totalAmount;
  const taxAmount = roundMoney(totalAmount - taxableAmount);
  const gst = splitGstByPlaceOfSupply(taxAmount, rate, place);
  return { taxableAmount, taxAmount, totalAmount, ...gst };
}

function calcLineFromTaxable(taxable, taxPercent, place = {}) {
  const taxableAmount = roundMoney(taxable);
  const rate = Number(taxPercent) || 0;
  const taxAmount = roundMoney(taxableAmount * (rate / 100));
  const gst = splitGstByPlaceOfSupply(taxAmount, rate, place);
  return {
    taxableAmount,
    taxAmount,
    totalAmount: roundMoney(taxableAmount + taxAmount),
    ...gst,
  };
}

function createEmptyLine(taxPercent = 5, place = {}) {
  const rate = Number(taxPercent) || 5;
  const gst = splitGstByPlaceOfSupply(0, rate, place);
  return {
    key: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    itemName: "",
    categoryId: "",
    categoryLabel: "",
    taxPercent: rate,
    taxableAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
    ...gst,
  };
}

function recalcLine(line, amountType, place = {}) {
  const taxPercent = Number(line.taxPercent) || 5;
  if (amountType === "taxable") {
    return {
      ...line,
      ...calcLineFromTaxable(line.taxableAmount, taxPercent, place),
      taxPercent,
    };
  }
  return {
    ...line,
    ...calcLineFromTotal(line.totalAmount, taxPercent, place),
    taxPercent,
  };
}

function vendorPlaceOfSupply(vendor, fallbackState) {
  const state =
    vendor?.billingAddress?.state ||
    vendor?.state ||
    fallbackState ||
    "";
  const gstin = vendor?.gstin || "";
  return {
    state,
    gstin,
    isIntraState: isIntraStateKarnataka(state, { gstin }),
  };
}

/** Searchable category picker with quick-add (same UX as vendor search). */
function CategorySearchSelect({
  categories = [],
  categoryId,
  categoryLabel = "",
  onSelect,
  onClear,
  onAdd,
}) {
  const [query, setQuery] = useState(categoryLabel || "");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const menuPortalRef = useRef(null);

  useEffect(() => {
    const selected = categories.find((item) => getEntityId(item) === categoryId);
    if (selected) {
      setQuery(selected.name || "");
    } else if (categoryLabel) {
      setQuery(categoryLabel);
    } else if (!categoryId) {
      setQuery("");
    }
  }, [categoryId, categoryLabel, categories]);

  useEffect(() => {
    if (!menuOpen || !rootRef.current) {
      setMenuStyle(null);
      return;
    }
    const updatePosition = () => {
      const rect = rootRef.current.getBoundingClientRect();
      const width = Math.max(rect.width, 240);
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 220 && rect.top > spaceBelow;
      setMenuStyle({
        position: "fixed",
        left: Math.min(rect.left, window.innerWidth - width - 8),
        width,
        zIndex: 450,
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
      });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event) => {
      const inRoot = rootRef.current?.contains(event.target);
      const inMenu = menuPortalRef.current?.contains(event.target);
      if (!inRoot && !inMenu) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((item) =>
      [item.name, item.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [categories, query]);

  const menu = menuOpen && menuStyle
    ? createPortal(
        <div
          ref={menuPortalRef}
          style={menuStyle}
          className="max-h-56 overflow-auto rounded-md border border-cream-300 bg-white shadow-[var(--shadow-card-hover)]"
        >
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onAdd?.();
            }}
            className="flex w-full items-center gap-2 border-b border-cream-200 px-3.5 py-2.5 text-left text-body-sm font-semibold text-terracotta-600 hover:bg-terracotta-500/5"
          >
            <Plus {...iconProps(14)} />
            Add New Category
          </button>
          {filtered.length === 0 ? (
            <p className="px-3.5 py-3 text-body-sm text-brown-500">
              No categories found
            </p>
          ) : (
            filtered.map((item) => {
              const id = getEntityId(item);
              const selected = id === categoryId;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onSelect?.(item);
                    setQuery(item.name || "");
                    setMenuOpen(false);
                  }}
                  className={`flex w-full px-3.5 py-2.5 text-left text-body-sm hover:bg-olive-50 ${
                    selected
                      ? "bg-olive-100/70 font-medium text-brown-900"
                      : "text-brown-800"
                  }`}
                >
                  {item.name}
                </button>
              );
            })
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="relative w-full min-w-[12rem]" ref={rootRef}>
      <div className="relative">
        <Search
          {...iconProps(14)}
          className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-brown-400"
        />
        <AdminInput
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setMenuOpen(true);
            if (categoryId) onClear?.();
          }}
          onFocus={() => setMenuOpen(true)}
          placeholder="Search category..."
          className="px-2.5 py-2 pr-14 pl-8"
          autoComplete="off"
        />
        <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center">
          {categoryId && (
            <button
              type="button"
              onClick={() => {
                onClear?.();
                setQuery("");
              }}
              className="focus-ring rounded-sm p-1 text-brown-400 hover:text-terracotta-600"
              aria-label="Clear category"
            >
              <X {...iconProps(12)} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="focus-ring rounded-sm p-1 text-brown-500"
            aria-label="Toggle category list"
          >
            <ChevronDown {...iconProps(14)} />
          </button>
        </div>
      </div>
      {menu}
    </div>
  );
}

const EMPTY_FORM = {
  withTax: false,
  amount: "",
  vendorId: "",
  amountType: "total",
  supplierInvoiceDate: todayISO(),
  supplierInvoiceSerialNo: "",
  expenseDate: todayISO(),
  categoryId: "",
  notes: "",
  items: [createEmptyLine()],
  reverseCharge: false,
  tdsApplicable: false,
  tdsPercent: "",
  tdsAmount: "",
  isPaid: true,
  paymentDate: todayISO(),
  paymentNotes: "",
  paymentType: "UPI",
  bankDetails: "",
};

function resolveCategoryId(expense) {
  return (
    getEntityId(expense?.categoryId) ||
    getEntityId(expense?.category) ||
    expense?.categoryId ||
    ""
  );
}

function resolveVendorId(expense) {
  return (
    getEntityId(expense?.vendorId) ||
    getEntityId(expense?.vendor) ||
    expense?.vendorId ||
    ""
  );
}

function normalizeItems(expense, amountType, place = {}) {
  const raw = Array.isArray(expense?.items) ? expense.items : [];
  if (raw.length === 0) {
    const taxPercent = Number(expense?.taxPercent ?? expense?.taxRate ?? 5);
    const total = Number(expense?.totalAmount ?? expense?.amount ?? 0);
    const taxable = Number(expense?.netAmount ?? expense?.taxableAmount ?? 0);
    if (!total && !taxable) return [createEmptyLine(taxPercent, place)];
    const seed = {
      key: `line-${Date.now()}`,
      itemName: expense?.itemName || expense?.notes || "",
      categoryId: String(resolveCategoryId(expense) || ""),
      categoryLabel:
        expense?.categorySnapshot?.name ||
        expense?.category?.name ||
        expense?.categoryName ||
        "",
      taxPercent,
      taxableAmount: taxable,
      taxAmount: Number(expense?.taxAmount ?? 0),
      totalAmount: total || taxable,
    };
    return [recalcLine(seed, amountType, place)];
  }
  return raw.map((item, index) =>
    recalcLine(
      {
        key: item.key || item.id || `line-${index}-${Date.now()}`,
        itemName: item.itemName || item.name || "",
        categoryId: String(
          getEntityId(item.categoryId) ||
            getEntityId(item.category) ||
            item.categoryId ||
            "",
        ),
        categoryLabel:
          item.categorySnapshot?.name ||
          item.category?.name ||
          item.categoryName ||
          "",
        taxPercent: Number(item.taxPercent ?? item.taxRate ?? 5),
        taxableAmount: Number(item.taxableAmount ?? item.netAmount ?? 0),
        taxAmount: Number(item.taxAmount ?? 0),
        totalAmount: Number(item.totalAmount ?? 0),
      },
      amountType,
      place,
    ),
  );
}

export default function ExpenseFormDrawer({
  open,
  onClose,
  expense,
  detailLoading = false,
  detailError = null,
}) {
  const dispatch = useDispatch();
  const mutationStatus = useSelector((state) => state.expenses.mutationStatus);
  const mutationError = useSelector((state) => state.expenses.mutationError);
  const categories = useSelector((state) => state.expenseCategories.items);
  const categoryMutationStatus = useSelector(
    (state) => state.expenseCategories.mutationStatus,
  );
  const vendors = useSelector((state) => state.vendors.items);

  const isEditing = Boolean(expense);
  const [form, setForm] = useState(EMPTY_FORM);

  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [categoryEditing, setCategoryEditing] = useState(null);
  const [categoryDetailLoading, setCategoryDetailLoading] = useState(false);
  const [categoryDetailError, setCategoryDetailError] = useState(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState(null);
  /** When set, newly created category is assigned to this item line. */
  const [categoryTargetLineKey, setCategoryTargetLineKey] = useState(null);

  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorMenuOpen, setVendorMenuOpen] = useState(false);
  const vendorMenuRef = useRef(null);

  const activeCategories = useMemo(() => {
    const selectedIds = new Set(
      [
        form.categoryId,
        ...(form.items || []).map((line) => line.categoryId),
      ].filter(Boolean),
    );
    return (categories || []).filter(
      (item) => item.isActive !== false || selectedIds.has(getEntityId(item)),
    );
  }, [categories, form.categoryId, form.items]);

  const filteredVendors = useMemo(() => {
    const q = vendorSearch.trim().toLowerCase();
    const list = vendors || [];
    if (!q) return list;
    return list.filter((vendor) => {
      const haystack = [
        vendor.name,
        vendor.company,
        vendor.phone,
        vendor.gstin,
        vendor.email,
        ...(Array.isArray(vendor.tags) ? vendor.tags : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [vendors, vendorSearch]);

  const selectedVendor = useMemo(
    () => (vendors || []).find((item) => getEntityId(item) === form.vendorId),
    [vendors, form.vendorId],
  );

  const vendorPlace = useMemo(
    () =>
      vendorPlaceOfSupply(
        selectedVendor,
        expense?.vendorSnapshot?.state || expense?.vendor?.state,
      ),
    [selectedVendor, expense],
  );

  const itemTotals = useMemo(() => {
    const taxableAmount = roundMoney(
      form.items.reduce(
        (sum, line) => sum + (Number(line.taxableAmount) || 0),
        0,
      ),
    );
    const taxAmount = roundMoney(
      form.items.reduce((sum, line) => sum + (Number(line.taxAmount) || 0), 0),
    );
    const cgstAmount = roundMoney(
      form.items.reduce((sum, line) => sum + (Number(line.cgstAmount) || 0), 0),
    );
    const sgstAmount = roundMoney(
      form.items.reduce((sum, line) => sum + (Number(line.sgstAmount) || 0), 0),
    );
    const igstAmount = roundMoney(
      form.items.reduce((sum, line) => sum + (Number(line.igstAmount) || 0), 0),
    );
    const totalAmount = roundMoney(taxableAmount + taxAmount);
    const taxType =
      igstAmount > 0 && cgstAmount === 0 && sgstAmount === 0
        ? TAX_TYPE_IGST
        : form.items[0]?.taxType || "cgst_sgst";
    return {
      taxableAmount,
      taxAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
      taxType,
      cgstRate: form.items[0]?.cgstRate ?? 0,
      sgstRate: form.items[0]?.sgstRate ?? 0,
      igstRate: form.items[0]?.igstRate ?? 0,
    };
  }, [form.items]);

  // Re-split GST when vendor (place of supply) changes.
  useEffect(() => {
    if (!open) return;
    setForm((prev) => {
      if (!prev.withTax) return prev;
      return {
        ...prev,
        items: prev.items.map((line) =>
          recalcLine(line, prev.amountType, vendorPlace),
        ),
      };
    });
  }, [
    open,
    vendorPlace.state,
    vendorPlace.gstin,
    vendorPlace.isIntraState,
  ]);

  useEffect(() => {
    if (!open) return;
    dispatch(clearExpenseErrors());
    dispatch(loadExpenseCategories({ limit: 100 }));
    dispatch(loadVendors({ limit: 100 }));
  }, [open, dispatch]);

  useEffect(() => {
    if (!open) return;
    if (detailLoading) return;
    if (expense) {
      const withTax = Boolean(expense.withTax ?? expense.isTaxable);
      const amountType =
        expense.amountType === "taxable" ||
        expense.amountType === "exclusive" ||
        expense.amountType === "net"
          ? "taxable"
          : "total";

      const place = vendorPlaceOfSupply(
        null,
        expense?.vendorSnapshot?.state ||
          expense?.vendor?.billingAddress?.state ||
          expense?.vendor?.state,
      );
      // Prefer GSTIN from snapshot when state missing
      if (!place.state && expense?.vendorSnapshot?.gstin) {
        place.gstin = expense.vendorSnapshot.gstin;
        place.isIntraState = isIntraStateKarnataka("", {
          gstin: expense.vendorSnapshot.gstin,
        });
      }

      setForm({
        withTax,
        amount:
          expense.amount !== undefined && expense.amount !== null
            ? String(expense.amount)
            : "",
        vendorId: String(resolveVendorId(expense) || ""),
        amountType,
        supplierInvoiceDate: toInputDate(
          expense.supplierInvoiceDate || expense.invoiceDate,
        ),
        supplierInvoiceSerialNo:
          expense.supplierInvoiceSerialNo ||
          expense.invoiceId ||
          expense.supplierInvoiceId ||
          "",
        expenseDate: toInputDate(expense.expenseDate || expense.date),
        categoryId: String(resolveCategoryId(expense) || ""),
        notes: expense.notes || "",
        items: withTax
          ? normalizeItems(expense, amountType, place)
          : [createEmptyLine()],
        reverseCharge: Boolean(
          expense.reverseCharge || expense.reverseChargeMechanism,
        ),
        tdsApplicable: Boolean(expense.tdsApplicable),
        tdsPercent:
          expense.tdsPercent !== undefined && expense.tdsPercent !== null
            ? String(expense.tdsPercent)
            : "",
        tdsAmount:
          expense.tdsAmount !== undefined && expense.tdsAmount !== null
            ? String(expense.tdsAmount)
            : "",
        isPaid: expense.isPaid !== false,
        paymentDate: toInputDate(
          expense.paymentDate || expense.payment?.paymentDate,
        ),
        paymentNotes:
          expense.paymentNotes || expense.payment?.paymentNotes || "",
        paymentType:
          expense.paymentType || expense.payment?.paymentType || "UPI",
        bankDetails:
          expense.bankDetails ||
          expense.transactionDetails ||
          expense.payment?.bankDetails ||
          expense.payment?.transactionDetails ||
          expense.bankAccountLabel ||
          "",
      });
      setVendorSearch(
        expense.vendorSnapshot?.name ||
          expense.vendor?.name ||
          expense.vendorName ||
          "",
      );
    } else {
      setForm({
        ...EMPTY_FORM,
        expenseDate: todayISO(),
        paymentDate: todayISO(),
        supplierInvoiceDate: todayISO(),
        items: [createEmptyLine()],
      });
      setVendorSearch("");
    }
    setVendorMenuOpen(false);
    setCategoryTargetLineKey(null);
  }, [open, expense, detailLoading]);

  useEffect(() => {
    if (!vendorMenuOpen) return;
    const onPointerDown = (event) => {
      if (!vendorMenuRef.current?.contains(event.target)) {
        setVendorMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [vendorMenuOpen]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setWithTax = (value) => {
    setForm((prev) => ({
      ...prev,
      withTax: value,
      items: value
        ? prev.items?.length
          ? prev.items
          : [createEmptyLine(5, vendorPlace)]
        : prev.items,
    }));
  };

  const setAmountType = (amountType) => {
    setForm((prev) => ({
      ...prev,
      amountType,
      items: prev.items.map((line) =>
        recalcLine(line, amountType, vendorPlace),
      ),
    }));
  };

  const updateLine = (key, patch) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((line) => {
        if (line.key !== key) return line;
        const next = { ...line, ...patch };
        if (
          patch.taxPercent !== undefined ||
          patch.totalAmount !== undefined ||
          patch.taxableAmount !== undefined
        ) {
          return recalcLine(next, prev.amountType, vendorPlace);
        }
        return next;
      }),
    }));
  };

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyLine(5, vendorPlace)],
    }));
  };

  const removeLine = (key) => {
    setForm((prev) => ({
      ...prev,
      items:
        prev.items.length <= 1
          ? [createEmptyLine(5, vendorPlace)]
          : prev.items.filter((line) => line.key !== key),
    }));
  };

  const openCreateCategory = (lineKey = null) => {
    setCategoryTargetLineKey(lineKey);
    setCategoryEditing(null);
    setCategoryDetailError(null);
    setCategoryDetailLoading(false);
    setCategoryDrawerOpen(true);
  };

  const openEditCategory = async () => {
    const selected = activeCategories.find(
      (item) => getEntityId(item) === form.categoryId,
    );
    if (!selected) return;
    setCategoryTargetLineKey(null);
    const id = getEntityId(selected);
    setCategoryDetailError(null);
    setCategoryDetailLoading(true);
    setCategoryEditing(null);
    setCategoryDrawerOpen(true);
    const result = await dispatch(loadExpenseCategoryById(id));
    setCategoryDetailLoading(false);
    if (result.meta.requestStatus === "fulfilled") {
      setCategoryEditing(result.payload);
    } else {
      setCategoryDetailError(result.payload || "Failed to load category");
    }
  };

  const handleCategorySaved = (saved) => {
    const id = getEntityId(saved);
    if (!id) {
      dispatch(loadExpenseCategories({ limit: 100 }));
      return;
    }
    if (categoryTargetLineKey) {
      updateLine(categoryTargetLineKey, {
        categoryId: id,
        categoryLabel: saved.name || "",
      });
    } else {
      updateField("categoryId", id);
    }
    setCategoryTargetLineKey(null);
    dispatch(loadExpenseCategories({ limit: 100 }));
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    const id = getEntityId(deleteCategoryTarget);
    const result = await dispatch(removeExpenseCategory(id));
    if (result.meta.requestStatus === "fulfilled") {
      if (form.categoryId === id) updateField("categoryId", "");
      setForm((prev) => ({
        ...prev,
        items: prev.items.map((line) =>
          line.categoryId === id
            ? { ...line, categoryId: "", categoryLabel: "" }
            : line,
        ),
      }));
      setDeleteCategoryTarget(null);
    }
  };

  const handleVendorSaved = (saved) => {
    const id = getEntityId(saved);
    if (id) {
      updateField("vendorId", id);
      setVendorSearch(saved.name || "");
    }
    dispatch(loadVendors({ limit: 100 }));
  };

  const selectVendor = (vendor) => {
    const id = getEntityId(vendor);
    updateField("vendorId", id || "");
    setVendorSearch(vendor?.name || "");
    setVendorMenuOpen(false);
  };

  const clearVendor = () => {
    updateField("vendorId", "");
    setVendorSearch("");
  };

  const buildPaymentFields = () => {
    if (!form.isPaid) return {};
    const bankDetails = form.bankDetails.trim() || undefined;
    return {
      paymentDate: form.paymentDate,
      paymentNotes: form.paymentNotes.trim() || undefined,
      paymentType: form.paymentType,
      bankDetails,
      transactionDetails: bankDetails,
      payment: {
        paymentDate: form.paymentDate,
        paymentNotes: form.paymentNotes.trim() || undefined,
        paymentType: form.paymentType,
        bankDetails,
        transactionDetails: bankDetails,
      },
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedCategory = activeCategories.find(
      (item) => getEntityId(item) === form.categoryId,
    );

    let payload;

    if (form.withTax) {
      if (!form.vendorId) return;
      if (itemTotals.totalAmount <= 0) return;

      const items = form.items
        .filter(
          (line) =>
            line.itemName.trim() ||
            Number(line.totalAmount) > 0 ||
            Number(line.taxableAmount) > 0,
        )
        .map((line) => {
          const category = activeCategories.find(
            (item) => getEntityId(item) === line.categoryId,
          );
          return {
            itemName: line.itemName.trim() || undefined,
            categoryId: line.categoryId || undefined,
            categorySnapshot: category
              ? { id: getEntityId(category), name: category.name }
              : undefined,
            taxPercent: Number(line.taxPercent) || 5,
            taxRate: Number(line.taxPercent) || 5,
            taxType: line.taxType || itemTotals.taxType,
            taxableAmount: Number(line.taxableAmount) || 0,
            netAmount: Number(line.taxableAmount) || 0,
            taxAmount: Number(line.taxAmount) || 0,
            cgstRate: Number(line.cgstRate) || 0,
            sgstRate: Number(line.sgstRate) || 0,
            igstRate: Number(line.igstRate) || 0,
            cgstAmount: Number(line.cgstAmount) || 0,
            sgstAmount: Number(line.sgstAmount) || 0,
            igstAmount: Number(line.igstAmount) || 0,
            totalAmount: Number(line.totalAmount) || 0,
          };
        });

      if (!items.length) return;

      // Under RCM, GST is paid by recipient to govt; vendor is paid taxable value.
      // Still persist full tax breakdown for GST returns.
      const payableAmount = form.reverseCharge
        ? itemTotals.taxableAmount
        : itemTotals.totalAmount;

      payload = {
        amount: roundMoney(payableAmount),
        currency: "INR",
        expenseDate: form.expenseDate,
        notes: form.notes.trim() || undefined,
        withTax: true,
        isTaxable: true,
        vendorId: form.vendorId,
        vendorSnapshot: selectedVendor
          ? {
              id: getEntityId(selectedVendor),
              name: selectedVendor.name,
              gstin: selectedVendor.gstin || undefined,
              state:
                selectedVendor.billingAddress?.state ||
                selectedVendor.state ||
                undefined,
            }
          : undefined,
        amountType: form.amountType,
        supplierInvoiceDate: form.supplierInvoiceDate || undefined,
        supplierInvoiceSerialNo:
          form.supplierInvoiceSerialNo.trim() || undefined,
        invoiceId: form.supplierInvoiceSerialNo.trim() || undefined,
        items,
        taxableAmount: itemTotals.taxableAmount,
        netAmount: itemTotals.taxableAmount,
        taxAmount: itemTotals.taxAmount,
        taxType: itemTotals.taxType,
        cgstAmount: itemTotals.cgstAmount,
        sgstAmount: itemTotals.sgstAmount,
        igstAmount: itemTotals.igstAmount,
        cgstRate: itemTotals.cgstRate,
        sgstRate: itemTotals.sgstRate,
        igstRate: itemTotals.igstRate,
        totalAmount: itemTotals.totalAmount,
        reverseCharge: form.reverseCharge,
        reverseChargeMechanism: form.reverseCharge,
        tdsApplicable: form.tdsApplicable,
        tdsPercent: form.tdsApplicable
          ? Number(form.tdsPercent) || undefined
          : undefined,
        tdsAmount: form.tdsApplicable
          ? Number(form.tdsAmount) || undefined
          : undefined,
        isPaid: form.isPaid,
        ...buildPaymentFields(),
      };
    } else {
      const amount = Number(form.amount);
      if (!amount || amount <= 0) return;

      payload = {
        amount,
        currency: "INR",
        expenseDate: form.expenseDate,
        categoryId: form.categoryId || undefined,
        categorySnapshot: selectedCategory
          ? {
              id: getEntityId(selectedCategory),
              name: selectedCategory.name,
            }
          : undefined,
        notes: form.notes.trim() || undefined,
        withTax: false,
        isTaxable: false,
        reverseCharge: false,
        reverseChargeMechanism: false,
        tdsApplicable: form.tdsApplicable,
        tdsPercent: form.tdsApplicable
          ? Number(form.tdsPercent) || undefined
          : undefined,
        tdsAmount: form.tdsApplicable
          ? Number(form.tdsAmount) || undefined
          : undefined,
        isPaid: form.isPaid,
        ...buildPaymentFields(),
      };
    }

    const id = getEntityId(expense);
    const action = isEditing
      ? await dispatch(editExpense({ id, payload }))
      : await dispatch(addExpense(payload));

    if (action.meta.requestStatus === "fulfilled") {
      onClose();
    }
  };

  const saving = mutationStatus === "loading";
  const canSubmit = form.withTax
    ? Boolean(form.vendorId) &&
      itemTotals.totalAmount > 0 &&
      !saving &&
      !detailLoading
    : Number(form.amount) > 0 && !saving && !detailLoading;

  const selectedCategory = activeCategories.find(
    (item) => getEntityId(item) === form.categoryId,
  );

  const amountColumnLabel =
    form.amountType === "taxable" ? "Taxable Amount" : "Total Amount";

  return (
    <>
      <AdminDrawer
        open={open}
        onClose={onClose}
        title="Expenses"
        size="xl"
        headerActions={
          <button
            type="submit"
            form="expense-form"
            disabled={!canSubmit}
            className="btn btn-primary px-4 py-2 text-[0.68rem]"
          >
            {saving
              ? "Saving..."
              : isEditing
                ? "Save Expense"
                : "Add Expense"}
          </button>
        }
        footer={
          <button
            type="submit"
            form="expense-form"
            disabled={!canSubmit}
            className="btn btn-primary w-full px-4 py-3 text-[0.72rem] sm:w-auto"
          >
            {saving
              ? "Saving..."
              : isEditing
                ? "Save Expense"
                : "Add Expense"}
          </button>
        }
      >
        <form id="expense-form" onSubmit={handleSubmit} className="space-y-8">
          {detailLoading && (
            <p className="text-body-sm text-brown-500">
              Loading expense details...
            </p>
          )}
          {detailError && (
            <div className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
              {detailError}
            </div>
          )}
          {mutationError && (
            <div className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
              {mutationError}
            </div>
          )}

          <fieldset disabled={detailLoading} className="space-y-8 border-0 p-0">
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
                  Basic Details
                </h3>
                <button
                  type="button"
                  onClick={() => setWithTax(!form.withTax)}
                  className={`focus-ring inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-body-sm font-semibold transition-colors ${
                    form.withTax
                      ? "border-olive-700 bg-olive-800 text-white"
                      : "border-cream-300 bg-white text-olive-800 hover:border-olive-500"
                  }`}
                >
                  <Plus {...iconProps(14)} />
                  Create with tax
                </button>
              </div>

              {form.withTax ? (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
                        Select Vendor
                        <span className="text-terracotta-500"> *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setVendorDrawerOpen(true)}
                        className="focus-ring text-body-sm font-semibold text-terracotta-600 hover:text-terracotta-700"
                      >
                        Add New Vendor?
                      </button>
                    </div>
                    <div className="relative" ref={vendorMenuRef}>
                      <div className="relative">
                        <Search
                          {...iconProps(16)}
                          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brown-400"
                        />
                        <AdminInput
                          value={vendorSearch}
                          onChange={(e) => {
                            setVendorSearch(e.target.value);
                            setVendorMenuOpen(true);
                            if (form.vendorId) updateField("vendorId", "");
                          }}
                          onFocus={() => setVendorMenuOpen(true)}
                          placeholder="Search existing Vendors, Company Name, GSTIN, tags..."
                          className="pr-16 pl-10"
                          autoComplete="off"
                        />
                        <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-0.5">
                          {form.vendorId && (
                            <button
                              type="button"
                              onClick={clearVendor}
                              className="focus-ring rounded-sm p-1 text-brown-400 hover:text-terracotta-600"
                              aria-label="Clear vendor"
                            >
                              <X {...iconProps(14)} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setVendorMenuOpen((v) => !v)}
                            className="focus-ring rounded-sm p-1 text-brown-500"
                            aria-label="Toggle vendor list"
                          >
                            <ChevronDown {...iconProps(16)} />
                          </button>
                        </div>
                      </div>
                      {vendorMenuOpen && (
                        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-cream-300 bg-white shadow-[var(--shadow-card)]">
                          <button
                            type="button"
                            onClick={() => {
                              setVendorMenuOpen(false);
                              setVendorDrawerOpen(true);
                            }}
                            className="flex w-full items-center gap-2 border-b border-cream-200 px-3.5 py-2.5 text-left text-body-sm font-semibold text-terracotta-600 hover:bg-terracotta-500/5"
                          >
                            <Plus {...iconProps(14)} />
                            Add New Vendor
                          </button>
                          {filteredVendors.length === 0 ? (
                            <p className="px-3.5 py-3 text-body-sm text-brown-500">
                              No vendors found
                            </p>
                          ) : (
                            filteredVendors.map((vendor) => {
                              const id = getEntityId(vendor);
                              const selected = id === form.vendorId;
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => selectVendor(vendor)}
                                  className={`flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left hover:bg-olive-50 ${
                                    selected ? "bg-olive-100/70" : ""
                                  }`}
                                >
                                  <span className="text-body-sm font-medium text-brown-900">
                                    {vendor.name}
                                  </span>
                                  {(vendor.company || vendor.gstin) && (
                                    <span className="text-caption text-brown-500">
                                      {[vendor.company, vendor.gstin]
                                        .filter(Boolean)
                                        .join(" · ")}
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <AdminField label="Expense Date" required>
                      <AdminInput
                        type="date"
                        value={form.expenseDate}
                        onChange={(e) =>
                          updateField("expenseDate", e.target.value)
                        }
                        required
                      />
                    </AdminField>
                    <AdminField label="Supplier Invoice Date">
                      <AdminInput
                        type="date"
                        value={form.supplierInvoiceDate}
                        onChange={(e) =>
                          updateField("supplierInvoiceDate", e.target.value)
                        }
                      />
                    </AdminField>
                  </div>

                  <AdminField label="Supplier Invoice Serial No">
                    <AdminInput
                      value={form.supplierInvoiceSerialNo}
                      onChange={(e) =>
                        updateField("supplierInvoiceSerialNo", e.target.value)
                      }
                      placeholder="Optional"
                    />
                  </AdminField>

                  <AdminField label="Amount Type" required>
                    <AdminSelect
                      value={form.amountType}
                      onChange={(e) => setAmountType(e.target.value)}
                    >
                      {AMOUNT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>

                  <AdminField label="Notes">
                    <AdminTextarea
                      value={form.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      rows={3}
                      placeholder="Add notes (optional)"
                    />
                  </AdminField>
                </>
              ) : (
                <>
                  <AdminField label="Expense Amount" required>
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-body-sm text-brown-500">
                        ₹
                      </span>
                      <AdminInput
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) => updateField("amount", e.target.value)}
                        placeholder="Enter amount"
                        className="pl-8"
                        required
                      />
                    </div>
                  </AdminField>

                  <AdminField label="Expense Date" required>
                    <AdminInput
                      type="date"
                      value={form.expenseDate}
                      onChange={(e) =>
                        updateField("expenseDate", e.target.value)
                      }
                      required
                    />
                  </AdminField>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
                        Category
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openCreateCategory(null)}
                          className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-sm text-terracotta-600 hover:bg-terracotta-500/10"
                          title="Add category"
                          aria-label="Add category"
                        >
                          <Plus {...iconProps(16)} />
                        </button>
                        <button
                          type="button"
                          onClick={openEditCategory}
                          disabled={!form.categoryId}
                          className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-sm text-olive-800 hover:bg-olive-100 disabled:opacity-40"
                          title="Edit selected category"
                          aria-label="Edit selected category"
                        >
                          <Pencil {...iconProps(14)} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            selectedCategory &&
                            setDeleteCategoryTarget(selectedCategory)
                          }
                          disabled={!selectedCategory}
                          className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-sm text-terracotta-600 hover:bg-terracotta-500/10 disabled:opacity-40"
                          title="Delete selected category"
                          aria-label="Delete selected category"
                        >
                          <Trash2 {...iconProps(14)} />
                        </button>
                      </div>
                    </div>
                    <AdminSelect
                      value={form.categoryId}
                      onChange={(e) =>
                        updateField("categoryId", e.target.value)
                      }
                    >
                      <option value="">Select Category</option>
                      {activeCategories.map((item) => {
                        const id = getEntityId(item);
                        return (
                          <option key={id} value={id}>
                            {item.name}
                          </option>
                        );
                      })}
                    </AdminSelect>
                  </div>

                  <AdminField label="Notes">
                    <AdminTextarea
                      value={form.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                      rows={3}
                      placeholder="Add notes (optional)"
                    />
                  </AdminField>
                </>
              )}
            </section>

            {form.withTax && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
                    Item Details
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      openCreateCategory(form.items[0]?.key || null)
                    }
                    className="focus-ring text-body-sm font-semibold text-terracotta-600 hover:text-terracotta-700"
                  >
                    Add New Category?
                  </button>
                </div>

                <div className="overflow-x-auto rounded-md border border-cream-300 bg-white">
                  <table className="min-w-[780px] w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-cream-300 bg-cream-100/80">
                        <th className="px-3 py-2.5 text-caption font-semibold tracking-[0.1em] text-olive-800 uppercase">
                          Item Name
                        </th>
                        <th className="min-w-[14rem] px-3 py-2.5 text-caption font-semibold tracking-[0.1em] text-olive-800 uppercase">
                          Category
                        </th>
                        <th className="w-28 px-3 py-2.5 text-caption font-semibold tracking-[0.1em] text-olive-800 uppercase">
                          Tax
                        </th>
                        <th className="w-32 px-3 py-2.5 text-caption font-semibold tracking-[0.1em] text-olive-800 uppercase">
                          Tax Amount
                        </th>
                        <th className="w-36 px-3 py-2.5 text-caption font-semibold tracking-[0.1em] text-olive-800 uppercase">
                          {amountColumnLabel}
                        </th>
                        <th className="w-12 px-2 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((line) => (
                        <tr
                          key={line.key}
                          className="border-b border-cream-200 last:border-b-0"
                        >
                          <td className="px-2 py-2 align-top">
                            <AdminInput
                              value={line.itemName}
                              onChange={(e) =>
                                updateLine(line.key, {
                                  itemName: e.target.value,
                                })
                              }
                              placeholder="Item name"
                              className="px-2.5 py-2"
                            />
                          </td>
                          <td className="px-2 py-2 align-top">
                            <CategorySearchSelect
                              categories={activeCategories}
                              categoryId={line.categoryId}
                              categoryLabel={line.categoryLabel}
                              onSelect={(category) =>
                                updateLine(line.key, {
                                  categoryId: getEntityId(category) || "",
                                  categoryLabel: category.name || "",
                                })
                              }
                              onClear={() =>
                                updateLine(line.key, {
                                  categoryId: "",
                                  categoryLabel: "",
                                })
                              }
                              onAdd={() => openCreateCategory(line.key)}
                            />
                          </td>
                          <td className="px-2 py-2 align-top">
                            <AdminSelect
                              value={String(line.taxPercent)}
                              onChange={(e) =>
                                updateLine(line.key, {
                                  taxPercent: Number(e.target.value),
                                })
                              }
                              className="px-2.5 py-2"
                            >
                              {TAX_PERCENT_OPTIONS.map((rate) => (
                                <option key={rate} value={String(rate)}>
                                  {rate}%
                                </option>
                              ))}
                            </AdminSelect>
                          </td>
                          <td className="px-2 py-2 align-top">
                            <div className="relative">
                              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-caption text-brown-500">
                                ₹
                              </span>
                              <AdminInput
                                type="number"
                                value={line.taxAmount}
                                readOnly
                                tabIndex={-1}
                                className="bg-cream-100 px-2.5 py-2 pl-6"
                              />
                            </div>
                          </td>
                          <td className="px-2 py-2 align-top">
                            <div className="relative">
                              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-caption text-brown-500">
                                ₹
                              </span>
                              <AdminInput
                                type="number"
                                min="0"
                                step="0.01"
                                value={
                                  form.amountType === "taxable"
                                    ? line.taxableAmount || ""
                                    : line.totalAmount || ""
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (form.amountType === "taxable") {
                                    updateLine(line.key, {
                                      taxableAmount: value,
                                    });
                                  } else {
                                    updateLine(line.key, {
                                      totalAmount: value,
                                    });
                                  }
                                }}
                                placeholder="0"
                                className="px-2.5 py-2 pl-6"
                              />
                            </div>
                          </td>
                          <td className="px-1 py-2 align-top">
                            <button
                              type="button"
                              onClick={() => removeLine(line.key)}
                              className="focus-ring rounded-sm p-2 text-terracotta-600 hover:bg-terracotta-500/10"
                              aria-label="Remove item"
                            >
                              <Trash2 {...iconProps(16)} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-4">
                  <button
                    type="button"
                    onClick={addLine}
                    className="focus-ring inline-flex items-center gap-1.5 text-body-sm font-semibold text-olive-800 hover:text-olive-700"
                  >
                    <Plus {...iconProps(16)} />
                    Add Item
                  </button>

                  <div className="min-w-[16rem] space-y-2 text-body-sm">
                    <div className="flex items-center justify-between gap-6">
                      <span className="text-brown-600">Taxable Amount</span>
                      <span className="font-medium text-brown-900">
                        {formatINR(itemTotals.taxableAmount)}
                      </span>
                    </div>
                    {itemTotals.taxType === TAX_TYPE_IGST ? (
                      <div className="flex items-center justify-between gap-6">
                        <span className="text-brown-600">
                          IGST ({itemTotals.igstRate || "—"}%)
                          {form.reverseCharge ? " (RCM)" : ""}
                        </span>
                        <span className="font-medium text-brown-900">
                          {formatINR(itemTotals.igstAmount)}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-6">
                          <span className="text-brown-600">
                            CGST ({itemTotals.cgstRate || "—"}%)
                            {form.reverseCharge ? " (RCM)" : ""}
                          </span>
                          <span className="font-medium text-brown-900">
                            {formatINR(itemTotals.cgstAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-6">
                          <span className="text-brown-600">
                            SGST ({itemTotals.sgstRate || "—"}%)
                            {form.reverseCharge ? " (RCM)" : ""}
                          </span>
                          <span className="font-medium text-brown-900">
                            {formatINR(itemTotals.sgstAmount)}
                          </span>
                        </div>
                      </>
                    )}
                    <p className="text-right text-[0.65rem] text-brown-400">
                      {gstSplitLabel(
                        itemTotals.taxType,
                        itemTotals.taxType === TAX_TYPE_IGST
                          ? itemTotals.igstRate
                          : (Number(itemTotals.cgstRate) || 0) * 2 ||
                              form.items[0]?.taxPercent ||
                              5,
                      )}
                      {vendorPlace.state
                        ? ` · vendor: ${vendorPlace.state}`
                        : vendorPlace.isIntraState
                          ? " · Karnataka (default)"
                          : " · inter-state"}
                    </p>
                    <div className="flex items-center justify-between gap-6 border-t border-cream-300 pt-2">
                      <span className="font-semibold text-brown-900">
                        {form.reverseCharge
                          ? "Payable to Vendor"
                          : "Total Amount"}
                      </span>
                      <span className="font-display text-lg text-brown-900">
                        {formatINR(
                          form.reverseCharge
                            ? itemTotals.taxableAmount
                            : itemTotals.totalAmount,
                        )}
                      </span>
                    </div>
                    {form.reverseCharge && (
                      <div className="flex items-center justify-between gap-6 text-caption text-brown-500">
                        <span>Invoice total (incl. tax)</span>
                        <span>{formatINR(itemTotals.totalAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className="space-y-3">
              {form.withTax &&
                (!form.reverseCharge ? (
                  <button
                    type="button"
                    onClick={() => updateField("reverseCharge", true)}
                    className="focus-ring inline-flex items-center gap-1.5 text-body-sm font-semibold text-olive-800 hover:text-olive-700"
                  >
                    <Plus {...iconProps(16)} />
                    Reverse Charge Mechanism
                  </button>
                ) : (
                  <div className="space-y-2 rounded-md border border-cream-300 bg-white p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
                        Reverse Charge Mechanism
                      </p>
                      <button
                        type="button"
                        onClick={() => updateField("reverseCharge", false)}
                        className="focus-ring rounded-sm p-1 text-brown-500 hover:text-terracotta-600"
                        aria-label="Remove reverse charge"
                      >
                        <X {...iconProps(16)} />
                      </button>
                    </div>
                    <p className="text-body-sm text-brown-600">
                      GST on this expense is payable by you (recipient) under
                      reverse charge. Tax is kept for GST reporting; amount
                      payable to the vendor is the taxable value.
                    </p>
                    <div className="grid gap-2 text-body-sm sm:grid-cols-2">
                      <div className="flex justify-between gap-3 rounded-sm bg-cream-100 px-3 py-2">
                        <span className="text-brown-600">Tax liability (RCM)</span>
                        <span className="font-medium text-brown-900">
                          {formatINR(itemTotals.taxAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 rounded-sm bg-cream-100 px-3 py-2">
                        <span className="text-brown-600">Pay vendor</span>
                        <span className="font-medium text-brown-900">
                          {formatINR(itemTotals.taxableAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

              {!form.tdsApplicable ? (
                <button
                  type="button"
                  onClick={() => updateField("tdsApplicable", true)}
                  className="focus-ring inline-flex items-center gap-1.5 text-body-sm font-semibold text-olive-800 hover:text-olive-700"
                >
                  <Plus {...iconProps(16)} />
                  TDS Applicable
                </button>
              ) : (
                <div className="space-y-3 rounded-md border border-cream-300 bg-white p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
                      TDS Details
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        updateField("tdsApplicable", false);
                        updateField("tdsPercent", "");
                        updateField("tdsAmount", "");
                      }}
                      className="focus-ring rounded-sm p-1 text-brown-500 hover:text-terracotta-600"
                      aria-label="Remove TDS"
                    >
                      <X {...iconProps(16)} />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <AdminField label="TDS %">
                      <AdminInput
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.tdsPercent}
                        onChange={(e) => {
                          const percent = e.target.value;
                          updateField("tdsPercent", percent);
                          const base = form.withTax
                            ? itemTotals.taxableAmount
                            : Number(form.amount) || 0;
                          if (percent !== "" && base > 0) {
                            updateField(
                              "tdsAmount",
                              String(
                                roundMoney(
                                  base * ((Number(percent) || 0) / 100),
                                ),
                              ),
                            );
                          }
                        }}
                        placeholder="e.g. 10"
                      />
                    </AdminField>
                    <AdminField label="TDS Amount">
                      <AdminInput
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.tdsAmount}
                        onChange={(e) =>
                          updateField("tdsAmount", e.target.value)
                        }
                        placeholder="₹"
                      />
                    </AdminField>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
                  Payments
                </h3>
                <button
                  type="button"
                  onClick={() => updateField("isPaid", !form.isPaid)}
                  className={`focus-ring inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-body-sm transition-colors ${
                    form.isPaid
                      ? "border-olive-600 bg-olive-100 text-olive-900"
                      : "border-cream-300 bg-white text-brown-600"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                      form.isPaid
                        ? "border-olive-700 bg-olive-700 text-white"
                        : "border-cream-400"
                    }`}
                  >
                    {form.isPaid && <Check {...iconProps(12)} />}
                  </span>
                  Mark as Paid
                </button>
              </div>

              {form.isPaid && (
                <>
                  <AdminField label="Payment Date">
                    <AdminInput
                      type="date"
                      value={form.paymentDate}
                      onChange={(e) =>
                        updateField("paymentDate", e.target.value)
                      }
                    />
                  </AdminField>

                  <AdminField label="Payment Notes">
                    <AdminTextarea
                      value={form.paymentNotes}
                      onChange={(e) =>
                        updateField("paymentNotes", e.target.value)
                      }
                      rows={2}
                      placeholder="Optional payment notes"
                    />
                  </AdminField>

                  <div className="space-y-2">
                    <p className="text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase">
                      Payment Type
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PAYMENT_TYPES.map((type) => {
                        const selected = form.paymentType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => updateField("paymentType", type)}
                            className={`focus-ring inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-[0.72rem] font-semibold transition-colors ${
                              selected
                                ? "border-olive-700 bg-olive-800 text-white"
                                : "border-cream-300 bg-white text-brown-700 hover:border-olive-500"
                            }`}
                          >
                            {selected && <Check {...iconProps(14)} />}
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <AdminField label="Bank / Transaction Details">
                    <AdminTextarea
                      value={form.bankDetails}
                      onChange={(e) =>
                        updateField("bankDetails", e.target.value)
                      }
                      rows={3}
                      placeholder="Bank name, account, UTR / transaction ID (optional)"
                    />
                  </AdminField>
                </>
              )}
            </section>
          </fieldset>
        </form>
      </AdminDrawer>

      <ExpenseCategoryFormDrawer
        open={categoryDrawerOpen}
        nested
        onClose={() => {
          setCategoryDrawerOpen(false);
          setCategoryEditing(null);
          setCategoryDetailError(null);
          setCategoryTargetLineKey(null);
        }}
        category={categoryEditing}
        detailLoading={categoryDetailLoading}
        detailError={categoryDetailError}
        onSaved={handleCategorySaved}
      />

      <VendorFormDrawer
        open={vendorDrawerOpen}
        nested
        onClose={() => setVendorDrawerOpen(false)}
        vendor={null}
        onSaved={handleVendorSaved}
      />

      <ConfirmDialog
        open={Boolean(deleteCategoryTarget)}
        title="Delete expense category?"
        message={`"${deleteCategoryTarget?.name}" will be permanently removed.`}
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeleteCategoryTarget(null)}
        loading={categoryMutationStatus === "loading"}
      />
    </>
  );
}
