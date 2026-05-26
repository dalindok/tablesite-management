import { useLocation } from 'react-router-dom';
import { RiBellLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard':   'Dashboard',
  '/admin/users':       'User Management',
  '/admin/restaurants': 'Restaurant Management',
  '/admin/bookings':    'Booking Management',
  '/admin/requests':    'Restaurant Requests',
  '/owner/dashboard':   'Dashboard',
  '/owner/restaurants': 'My Restaurants',
  '/owner/bookings':    'Bookings',
  '/owner/requests':    'My Requests',
};

export default function Header() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = PAGE_TITLES[pathname] ?? 'TableSite Admin';

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-100 px-6 py-4 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        <p className="text-sm text-slate-400 hidden sm:block">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors relative">
          <RiBellLine size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-700 leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
