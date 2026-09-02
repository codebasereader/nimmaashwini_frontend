import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Box,
  FileBox,
  FileText,
  Inbox,
  Package,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  loadInsightsOverview,
  loadProductAnalysis,
} from "../../store/slices/insightsSlice";
import { iconProps } from "../../lib/icons";
import { formatINR } from "../lib/purchaseMath";
import DateRangeFilter, {
  defaultMonthRange,
} from "../components/DateRangeFilter";

const CHART_COLORS = {
  sales: "#3d6b4f",
  expenses: "#b85c68",
  income: "#5a8f6e",
  revenue: "#3d6b4f",
  grid: "#e8dfd0",
};

const PIE_COLORS = ["#3d6b4f", "#c4704b", "#5a8f6e", "#8b7355", "#b85c68", "#6b8cae"];

function formatCompactINR(value) {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 10000000) {
    return `₹ ${(n / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(n) >= 100000) {
    return `₹ ${(n / 100000).toFixed(2)} L`;
  }
  return formatINR(n);
}

function ChartEmpty({ label = "No data", hint }) {
  return (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-center px-4 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200 text-brown-400">
        <Inbox {...iconProps(26)} />
      </div>
      <p className="text-body-sm font-medium text-brown-600">{label}</p>
      {hint && <p className="mt-1 text-caption text-brown-400">{hint}</p>}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, accent = "text-olive-700" }) {
  return (
    <div className="rounded-lg border border-cream-300 bg-white px-4 py-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-md bg-cream-100 ${accent}`}
        >
          <Icon {...iconProps(16)} />
        </span>
        <p className="text-caption font-semibold tracking-[0.1em] text-brown-500 uppercase">
          {label}
        </p>
      </div>
      <p className="font-display text-xl text-brown-900 sm:text-2xl">{value}</p>
    </div>
  );
}

function TotalCard({ label, value, className }) {
  return (
    <div className={`rounded-lg px-4 py-3.5 ${className}`}>
      <p className="text-caption font-semibold tracking-[0.1em] uppercase opacity-80">
        {label}
      </p>
      <p className="mt-1 font-display text-lg leading-tight">{value}</p>
    </div>
  );
}

function Panel({ title, children, action, className = "" }) {
  return (
    <div
      className={`flex flex-col rounded-lg border border-cream-300 bg-white shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-200 px-4 py-3">
        <h3 className="text-body-sm font-semibold text-brown-900">{title}</h3>
        {action}
      </div>
      <div className="min-h-0 flex-1 p-4">{children}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, isCurrency = true }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-cream-300 bg-white px-3 py-2 shadow-md">
      <p className="mb-1 text-caption font-semibold text-brown-500">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-body-sm text-brown-800"
          style={{ color: entry.color }}
        >
          {entry.name}:{" "}
          {isCurrency
            ? formatCompactINR(entry.value)
            : Number(entry.value || 0).toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
}

export default function InsightsPage() {
  const dispatch = useDispatch();
  const {
    overview,
    productAnalysis,
    overviewStatus,
    productStatus,
    overviewError,
    productError,
  } = useSelector((state) => state.insights);

  const initialRange = useMemo(() => defaultMonthRange(), []);
  const [fromDate, setFromDate] = useState(initialRange.fromDate);
  const [toDate, setToDate] = useState(initialRange.toDate);
  const [productFrom, setProductFrom] = useState(initialRange.fromDate);
  const [productTo, setProductTo] = useState(initialRange.toDate);

  const loadOverview = (from = fromDate, to = toDate) => {
    if (!from || !to || from > to) return;
    dispatch(loadInsightsOverview({ fromDate: from, toDate: to }));
  };

  const loadProducts = (from = productFrom, to = productTo) => {
    if (!from || !to || from > to) return;
    dispatch(loadProductAnalysis({ fromDate: from, toDate: to }));
  };

  useEffect(() => {
    loadOverview(initialRange.fromDate, initialRange.toDate);
    loadProducts(initialRange.fromDate, initialRange.toDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const kpis = overview.kpis;
  const totals = overview.totals;
  const hasReports = overview.reportsSeries?.length > 0;
  const hasPayments = overview.paymentsBreakdown?.length > 0;
  const hasPending = overview.pendingInvoices?.length > 0;
  const hasWeekly = overview.weeklyRevenue?.length > 0;
  const hasProductSeries = productAnalysis.series?.length > 0;
  const hasProductRows = productAnalysis.products?.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="section-label mb-2">Analytics</p>
        <h1 className="font-display text-display-sm text-brown-900">Insights</h1>
        <p className="mt-1 text-body-sm text-brown-500">
          Sales, expenses, and product performance at a glance
        </p>
      </div>

      {/* KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          icon={ArrowDownLeft}
          label="Cash In"
          value={formatCompactINR(kpis.cashIn)}
          accent="text-olive-700"
        />
        <KpiCard
          icon={ArrowUpRight}
          label="Cash Out"
          value={formatCompactINR(kpis.cashOut)}
          accent="text-terracotta-600"
        />
        <KpiCard
          icon={Box}
          label="Products Sold"
          value={Number(kpis.productsSold || 0).toLocaleString("en-IN")}
          accent="text-olive-700"
        />
        <KpiCard
          icon={Users}
          label="Customers"
          value={Number(kpis.customers || 0).toLocaleString("en-IN")}
          accent="text-olive-700"
        />
        <KpiCard
          icon={FileText}
          label="Pending Invoices"
          value={formatCompactINR(kpis.pendingInvoicesAmount)}
          accent="text-amber-700"
        />
        <KpiCard
          icon={FileBox}
          label="Invoices Created"
          value={Number(kpis.invoicesCreated || 0).toLocaleString("en-IN")}
          accent="text-olive-700"
        />
      </div>

      {/* Reports Overview */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl text-brown-900">
            Reports Overview
          </h2>
          <DateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromChange={setFromDate}
            onToChange={setToDate}
            onApply={() => loadOverview()}
            applying={overviewStatus === "loading"}
          />
        </div>

        {overviewError && (
          <div className="rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
            {overviewError}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
          <div className="rounded-lg border border-cream-300 bg-white p-4 shadow-[var(--shadow-card)]">
            {overviewStatus === "loading" && !hasReports ? (
              <ChartEmpty label="Loading chart..." />
            ) : hasReports ? (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview.reportsSeries}>
                    <defs>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={CHART_COLORS.sales}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor={CHART_COLORS.sales}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                      <linearGradient
                        id="expenseFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={CHART_COLORS.expenses}
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="95%"
                          stopColor={CHART_COLORS.expenses}
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke={CHART_COLORS.grid}
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#8b7355" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#8b7355" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCompactINR(v)}
                      width={72}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      name="Sales"
                      stroke={CHART_COLORS.sales}
                      fill="url(#salesFill)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke={CHART_COLORS.expenses}
                      fill="url(#expenseFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmpty
                label="No data"
                hint="No sales or expenses in this date range"
              />
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <TotalCard
              label="Total Sales"
              value={formatCompactINR(totals.sales)}
              className="bg-olive-100 text-olive-900"
            />
            <TotalCard
              label="Total Expenses"
              value={formatCompactINR(totals.expenses)}
              className="bg-[#f3e0e4] text-[#8a3d4a]"
            />
            <TotalCard
              label="Total Indirect Income"
              value={formatCompactINR(totals.indirectIncome)}
              className="bg-[#e3efe6] text-[#3d6b4f]"
            />
          </div>
        </div>
      </section>

      {/* Middle charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Payments">
          {hasPayments ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overview.paymentsBreakdown}
                    dataKey="amount"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {overview.paymentsBreakdown.map((entry, index) => (
                      <Cell
                        key={entry.label || index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty label="No data" hint="No payments in this range" />
          )}
        </Panel>

        <Panel title="Pending Invoices">
          {hasPending ? (
            <div className="max-h-[220px] space-y-2 overflow-y-auto">
              {overview.pendingInvoices.map((invoice) => (
                <div
                  key={invoice.id || invoice.invoiceNumber}
                  className="flex items-start justify-between gap-3 rounded-md border border-cream-200 bg-cream-50 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-body-sm font-medium text-brown-900">
                      {invoice.invoiceNumber || invoice.customerName || "Invoice"}
                    </p>
                    <p className="truncate text-caption text-brown-500">
                      {invoice.customerName || invoice.dueDate || "—"}
                    </p>
                  </div>
                  <p className="shrink-0 text-body-sm font-semibold text-brown-800">
                    {formatCompactINR(invoice.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <ChartEmpty label="No Pending Invoices" />
          )}
        </Panel>

        <Panel title="Weekly Revenue (Past 7 Days)">
          {hasWeekly ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview.weeklyRevenue}>
                  <CartesianGrid
                    stroke={CHART_COLORS.grid}
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#8b7355" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#8b7355" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCompactINR(v)}
                    width={64}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill={CHART_COLORS.revenue}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty label="No data" hint="No revenue in the past 7 days" />
          )}
        </Panel>
      </div>

      {/* Product Analysis */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package {...iconProps(18)} className="text-olive-700" />
            <h2 className="font-display text-xl text-brown-900">
              Product Analysis
            </h2>
          </div>
          <DateRangeFilter
            fromDate={productFrom}
            toDate={productTo}
            onFromChange={setProductFrom}
            onToChange={setProductTo}
            onApply={() => loadProducts()}
            applying={productStatus === "loading"}
          />
        </div>

        {productError && (
          <div className="rounded-lg border border-terracotta-400/40 bg-terracotta-500/10 px-4 py-3 text-body-sm text-terracotta-600">
            {productError}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-lg border border-cream-300 bg-white p-4 shadow-[var(--shadow-card)]">
            {productStatus === "loading" && !hasProductSeries ? (
              <ChartEmpty label="Loading product trends..." />
            ) : hasProductSeries ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={productAnalysis.series}>
                    <CartesianGrid
                      stroke={CHART_COLORS.grid}
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#8b7355" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#8b7355" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => formatCompactINR(v)}
                      width={64}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke={CHART_COLORS.sales}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmpty
                label="No data"
                hint="No product sales in this date range"
              />
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-cream-300 bg-white shadow-[var(--shadow-card)]">
            {hasProductRows ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-body-sm">
                  <thead className="border-b border-cream-300 bg-cream-100">
                    <tr>
                      <th className="px-4 py-3 text-[0.65rem] font-semibold tracking-[0.12em] text-olive-800 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-3 text-right text-[0.65rem] font-semibold tracking-[0.12em] text-olive-800 uppercase">
                        Units
                      </th>
                      <th className="px-4 py-3 text-right text-[0.65rem] font-semibold tracking-[0.12em] text-olive-800 uppercase">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {productAnalysis.products.map((row) => (
                      <tr
                        key={row.productId || row.name}
                        className="border-b border-cream-200 last:border-b-0"
                      >
                        <td className="px-4 py-3 text-brown-800">
                          {row.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-brown-800">
                          {Number(row.unitsSold || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-right text-brown-800">
                          {formatCompactINR(row.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4">
                <ChartEmpty label="No products sold in this range" />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
