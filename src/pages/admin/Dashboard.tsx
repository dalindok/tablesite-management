import { useRequest } from "ahooks";
import { dashboardApi } from "../../api/dashboard";
import StatCard from "../../components/common/StatCard";
import {
  RiUserLine,
  RiStore2Line,
  RiCalendarLine,
  RiTimeLine,
  RiUserStarLine,
  RiAlertLine,
} from "react-icons/ri";
import PageLoading from "../../components/common/PageLoading";
import PageError from "../../components/common/PageError";
import dayjs from "dayjs";

function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "badge-warning",
    confirmed: "badge-success",
    cancelled: "badge-danger",
    completed: "badge-info",
    no_show: "badge-neutral",
  };
  return (
    <span className={map[status] ?? "badge-neutral"}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function AdminDashboard() {
  const { data, loading, error, refresh } = useRequest(() =>
    dashboardApi.adminStats().then((r) => r.data.data),
  );

  if (loading)
    return (
      <PageLoading title="Loading dashboard…" subtitle="Fetching your stats" />
    );
  if (error)
    return (
      <PageError message="Could not load dashboard stats." onRetry={refresh} />
    );

  const stats = data ?? {
    totalUsers: 0,
    totalOwners: 0,
    totalCustomers: 0,
    totalRestaurants: 0,
    activeRestaurants: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    todayBookings: 0,
    pendingRequests: 0,
    recentBookings: [],
  };

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={<RiUserLine size={22} className="text-blue-600" />}
          color="bg-blue-50"
          subtitle={`${stats.totalOwners} owners · ${stats.totalCustomers} customers`}
        />
        <StatCard
          title="Restaurants"
          value={stats.totalRestaurants}
          icon={<RiStore2Line size={22} className="text-emerald-600" />}
          color="bg-emerald-50"
          subtitle={`${stats.activeRestaurants} active`}
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings.toLocaleString()}
          icon={<RiCalendarLine size={22} className="text-primary-600" />}
          color="bg-primary-50"
          subtitle={`${stats.confirmedBookings} confirmed`}
        />
        <StatCard
          title="Today's Bookings"
          value={stats.todayBookings}
          icon={<RiTimeLine size={22} className="text-purple-600" />}
          color="bg-purple-50"
          subtitle={`${stats.pendingBookings} pending`}
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <RiUserStarLine className="text-blue-500" />
            User Breakdown
          </h3>
          <div className="space-y-3">
            {[
              {
                label: "Customers",
                value: stats.totalCustomers,
                color: "bg-blue-500",
                pct: Math.round(
                  (stats.totalCustomers / stats.totalUsers) * 100,
                ),
              },
              {
                label: "Owners",
                value: stats.totalOwners,
                color: "bg-emerald-500",
                pct: Math.round((stats.totalOwners / stats.totalUsers) * 100),
              },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{r.label}</span>
                  <span className="font-medium">
                    {r.value.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${r.color} rounded-full`}
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <RiCalendarLine className="text-primary-500" />
            Booking Overview
          </h3>
          <div className="space-y-3">
            {[
              {
                label: "Confirmed",
                value: stats.confirmedBookings,
                color: "bg-emerald-500",
                pct: Math.round(
                  (stats.confirmedBookings / stats.totalBookings) * 100,
                ),
              },
              {
                label: "Pending",
                value: stats.pendingBookings,
                color: "bg-amber-500",
                pct: Math.round(
                  (stats.pendingBookings / stats.totalBookings) * 100,
                ),
              },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{r.label}</span>
                  <span className="font-medium">
                    {r.value.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${r.color} rounded-full`}
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <RiAlertLine className="text-amber-500" />
            Pending Actions
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
              <span className="text-sm text-amber-700">
                Restaurant Requests
              </span>
              <span className="font-bold text-amber-600 text-lg">
                {stats.pendingRequests}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
              <span className="text-sm text-blue-700">Pending Bookings</span>
              <span className="font-bold text-blue-600 text-lg">
                {stats.pendingBookings}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Recent Bookings</h3>
          <a
            href="/admin/bookings"
            className="text-sm text-primary-500 hover:text-primary-600 font-medium">
            View all →
          </a>
        </div>
        {stats.recentBookings.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50">
                {["Customer", "Restaurant", "Date", "Party", "Status"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {stats.recentBookings.map((b: any) => (
                <tr
                  key={b.id}
                  className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-6 py-3">{b.customerName}</td>
                  <td className="px-6 py-3">{b.restaurantName}</td>
                  <td className="px-6 py-3">
                    {dayjs(b.date).format("MMM D, YYYY")} {b.time}
                  </td>
                  <td className="px-6 py-3">{b.partySize} guests</td>
                  <td className="px-6 py-3">
                    <BookingStatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm">
            No recent bookings. Connect your API to see live data.
          </div>
        )}
      </div>
    </div>
  );
}
