import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, NavLink, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Bell,
  LayoutDashboard,
  CalendarDays,
  CarFront,
  Wallet,
  House,
  MapPin,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Settings2,
  Users,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { api, post, queryClient } from './api';
import { Logo, Guard, useAuth, useConfig, useToast, Empty } from './ui';
import type { Notification } from './types';
import { Landing, AuthPage, Explore, SpotDetails } from './public';
import {
  DriverDashboard,
  Bookings,
  BookingDetails,
  Vehicles,
  PaymentPage,
  PaymentHistory,
} from './driver';
import { OwnerDashboard, OwnerSpots, ListingEditor, Availability } from './owner';
import { Admin } from './admin';
const driverLinks = [
  ['/dashboard', 'Overview', LayoutDashboard],
  ['/bookings', 'My bookings', CalendarDays],
  ['/vehicles', 'My vehicles', CarFront],
  ['/payments', 'Payment history', Wallet],
] as const;
const ownerLinks = [
  ['/owner', 'Overview', LayoutDashboard],
  ['/owner/spots', 'My parking spaces', House],
  ['/owner/bookings', 'Reservations', CalendarDays],
  ['/owner/earnings', 'Earnings', Wallet],
] as const;
const adminLinks = [
  ['/admin', 'Overview', LayoutDashboard],
  ['/admin/listings', 'Listing approvals', ShieldCheck],
  ['/admin/users', 'User management', Users],
  ['/admin/disputes', 'Disputes', MessageSquare],
  ['/admin/bookings', 'Booking monitor', CalendarDays],
  ['/admin/payments', 'Payment records', Wallet],
] as const;
export default function App() {
  const { data: user } = useAuth();
  const { data: config } = useConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [mobile, setMobile] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const { data: alerts = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<Notification[]>('/notifications'),
    enabled: Boolean(user),
    refetchInterval: 15000,
  });
  const workspace = /^\/(dashboard|bookings|vehicles|payments|pay|owner|admin)/.test(
    location.pathname,
  );
  const section = location.pathname.startsWith('/owner')
    ? 'owner'
    : location.pathname.startsWith('/admin')
      ? 'admin'
      : 'driver';
  const links = section === 'owner' ? ownerLinks : section === 'admin' ? adminLinks : driverLinks;
  async function logout() {
    try {
      await post('/auth/logout');
      queryClient.clear();
      await queryClient.invalidateQueries();
      navigate('/');
    } catch (e) {
      toast((e as Error).message, true);
    }
  }
  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Logo />
          <nav className="public-nav" aria-label="Main navigation">
            <NavLink to="/explore">Find parking</NavLink>
            <Link to="/#how-it-works">How it works</Link>
            {user ? (
              <NavLink to="/owner">Become a host</NavLink>
            ) : (
              <Link to="/register?owner=true">
                Become a host
                <ArrowUpRight size={14} />
              </Link>
            )}
          </nav>
          <div className="header-actions">
            {config?.demo && (
              <span className="demo-pill">
                <span /> Demo mode
              </span>
            )}
            {user ? (
              <>
                <button
                  className="icon-button notification-button"
                  aria-label="Notifications"
                  onClick={() => setNotifications(!notifications)}
                >
                  <Bell size={20} />
                  {alerts.some((a) => !a.read) && <i />}
                </button>
                <Link className="avatar" to="/dashboard" aria-label="My dashboard">
                  {user.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </Link>
              </>
            ) : (
              <>
                <Link className="login-link" to="/login">
                  Log in
                </Link>
                <Link className="btn btn-sm" to="/register">
                  Get started
                  <ArrowUpRight size={15} />
                </Link>
              </>
            )}
            <button
              className="icon-button mobile-menu"
              aria-label="Toggle navigation"
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      {notifications && (
        <aside className="notification-panel">
          <div className="row">
            <h3>Your updates</h3>
            <button
              className="text-button"
              onClick={async () => {
                await post('/notifications/read');
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
              }}
            >
              Mark all read
            </button>
          </div>
          {alerts.length ? (
            alerts.slice(0, 20).map((a) => (
              <Link
                to={a.bookingId ? `/bookings/${a.bookingId}` : '/dashboard'}
                key={a.id}
                onClick={() => setNotifications(false)}
              >
                <span className={!a.read ? 'notification-unread' : ''} />
                <p>{a.message}</p>
              </Link>
            ))
          ) : (
            <p className="muted">You’re all caught up.</p>
          )}
        </aside>
      )}
      {mobile && (
        <div className="mobile-links">
          <Link onClick={() => setMobile(false)} to="/explore">
            Find parking
          </Link>
          <Link onClick={() => setMobile(false)} to="/dashboard">
            Dashboard
          </Link>
          <Link onClick={() => setMobile(false)} to="/owner">
            Host workspace
          </Link>
          {user?.roles.includes('ADMIN') && (
            <Link onClick={() => setMobile(false)} to="/admin">
              Administration
            </Link>
          )}
        </div>
      )}
      <div className={workspace ? 'workspace' : ''}>
        {workspace && user && (
          <aside className="sidebar">
            <div className="workspace-label">YOUR WORKSPACE</div>
            <div className="workspace-switch">
              <Link className={section === 'driver' ? 'active' : ''} to="/dashboard">
                Driver
              </Link>
              <Link className={section === 'owner' ? 'active' : ''} to="/owner">
                Host
              </Link>
              {user.roles.includes('ADMIN') && (
                <Link className={section === 'admin' ? 'active' : ''} to="/admin">
                  Admin
                </Link>
              )}
            </div>
            <nav aria-label="Workspace navigation">
              {links.map(([url, title, Icon]) => (
                <NavLink key={url} to={url} end>
                  <Icon size={18} />
                  {title}
                </NavLink>
              ))}
              <Link to="/explore">
                <MapPin size={18} />
                Explore parking
                <ArrowUpRight size={14} />
              </Link>
            </nav>
            {section === 'owner' && (
              <Link to="/owner/spots/new" className="btn sidebar-create">
                <Plus size={16} />
                List a space
              </Link>
            )}
            <div className="sidebar-bottom">
              <div className="soft-card">
                <span className="overline">A LITTLE SPACE. A BIG DIFFERENCE.</span>
                <p>Good neighbors make better cities.</p>
                <div className="tiny-road">
                  <CarFront size={26} />
                  <span>··············</span>
                  <House size={26} />
                </div>
              </div>
              <button onClick={logout}>
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          </aside>
        )}
        <main className={workspace ? 'workspace-main' : ''} id="main-content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage register />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/explore/:id" element={<SpotDetails />} />
            <Route
              path="/dashboard"
              element={
                <Guard>
                  <DriverDashboard />
                </Guard>
              }
            />
            <Route
              path="/bookings"
              element={
                <Guard>
                  <Bookings />
                </Guard>
              }
            />
            <Route
              path="/bookings/:id"
              element={
                <Guard>
                  <BookingDetails />
                </Guard>
              }
            />
            <Route
              path="/vehicles"
              element={
                <Guard>
                  <Vehicles />
                </Guard>
              }
            />
            <Route
              path="/payments"
              element={
                <Guard>
                  <PaymentHistory />
                </Guard>
              }
            />
            <Route
              path="/pay/:id"
              element={
                <Guard>
                  <PaymentPage />
                </Guard>
              }
            />
            <Route
              path="/owner"
              element={
                <Guard>
                  <OwnerDashboard />
                </Guard>
              }
            />
            <Route
              path="/owner/spots"
              element={
                <Guard role="OWNER">
                  <OwnerSpots />
                </Guard>
              }
            />
            <Route
              path="/owner/spots/new"
              element={
                <Guard role="OWNER">
                  <ListingEditor />
                </Guard>
              }
            />
            <Route
              path="/owner/spots/:id/edit"
              element={
                <Guard role="OWNER">
                  <ListingEditor />
                </Guard>
              }
            />
            <Route
              path="/owner/spots/:id/availability"
              element={
                <Guard role="OWNER">
                  <Availability />
                </Guard>
              }
            />
            <Route
              path="/owner/bookings"
              element={
                <Guard role="OWNER">
                  <Bookings owner />
                </Guard>
              }
            />
            <Route
              path="/owner/earnings"
              element={
                <Guard role="OWNER">
                  <PaymentHistory owner />
                </Guard>
              }
            />
            <Route
              path="/admin/*"
              element={
                <Guard role="ADMIN">
                  <Admin />
                </Guard>
              }
            />
            <Route
              path="*"
              element={
                <Empty
                  title="This road leads somewhere else"
                  text="The page could not be found."
                  action={
                    <Link className="btn" to="/">
                      Back home
                    </Link>
                  }
                />
              }
            />
          </Routes>
        </main>
      </div>
      {!workspace && (
        <footer className="footer">
          <div>
            <Logo />
            <p>A little space. A better city.</p>
          </div>
          <div>
            <Link to="/explore">Explore parking</Link>
            <Link to="/register?owner=true">Share your space</Link>
            <Link to="/#how-it-works">How it works</Link>
          </div>
          <small>
            Fictional demonstration · Bengaluru, India
            <br />
            Simulated payments only. No real money.
          </small>
        </footer>
      )}
    </>
  );
}
