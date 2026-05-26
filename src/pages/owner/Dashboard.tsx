import { useRequest } from "ahooks";
import { dashboardApi } from "../../api/dashboard";
import StatCard from "../../components/common/StatCard";
import {
  RiStore2Line,
  RiCalendarLine,
  RiTimeLine,
  RiAlertLine,
} from "react-icons/ri";
import PageLoading from "../../components/common/PageLoading";
import PageError from "../../components/common/PageError";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

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

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useRequest(
    () => dashboardApi.ownerStats().then((r) => r.data.data),
  );

  if (loading) return <PageLoading title="Loading dashboard…" subtitle="Fetching your stats" />;
  if (error) return <PageError message="Could not load dashboard stats." onRetry={refresh} />;

  const stats = data ?? {
    totalRestaurants: 0,
    activeRestaurants: 0,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    todayBookings: 0,
    canAddRestaurant: true,
    recentBookings: [],
  };

  return (
    <div className="space-y-6">
      {/* Alert: can't add more restaurants */}
      {!stats.canAddRestaurant && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <RiAlertLine
            className="text-amber-500 flex-shrink-0 mt-0.5"
            size={18}
          />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Restaurant limit reached ({stats.totalRestaurants}/{stats.restaurantLimit ?? 3})
            </p>
            <p className="text-sm text-amber-600 mt-0.5">
              You've reached the maximum of {stats.restaurantLimit ?? 3} restaurants.{" "}
              <button
                onClick={() => navigate("/owner/requests")}
                className="underline font-medium">
                Submit a request
              </button>{" "}
              to add more.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Restaurants"
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
        />
        <StatCard
          title="Pending"
          value={stats.pendingBookings}
          icon={<RiAlertLine size={22} className="text-amber-600" />}
          color="bg-amber-50"
          subtitle="Awaiting confirmation"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/owner/restaurants")}
          className="card p-5 text-left hover:shadow-card-hover transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
            <RiStore2Line size={20} className="text-primary-500" />
          </div>
          <p className="font-semibold text-slate-800">Manage Restaurants</p>
          <p className="text-sm text-slate-400 mt-1">
            Add or update your restaurants
          </p>
        </button>
        <button
          onClick={() => navigate("/owner/bookings")}
          className="card p-5 text-left hover:shadow-card-hover transition-shadow group">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
            <RiCalendarLine size={20} className="text-blue-500" />
          </div>
          <p className="font-semibold text-slate-800">Manage Bookings</p>
          <p className="text-sm text-slate-400 mt-1">
            Confirm or update bookings
          </p>
        </button>
      </div>

      {/* Recent bookings */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Recent Bookings</h3>
          <button
            onClick={() => navigate("/owner/bookings")}
            className="text-sm text-primary-500 hover:text-primary-600 font-medium">
            View all →
          </button>
        </div>
        {stats.recentBookings.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50">
                {[
                  "Customer",
                  "Restaurant",
                  "Date & Time",
                  "Party",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentBookings.map((b: any) => (
                <tr
                  key={b.id}
                  className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-6 py-3 font-medium">{b.customerName}</td>
                  <td className="px-6 py-3 text-slate-500">
                    {b.restaurantName}
                  </td>
                  <td className="px-6 py-3">
                    {dayjs(b.date).format("MMM D")} at {b.time}
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
            No recent bookings yet.
          </div>
        )}
      </div>
    </div>
  );
}
