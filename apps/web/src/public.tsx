import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Search,
  ShieldCheck,
  Clock3,
  Leaf,
  Check,
  CarFront,
  Star,
  ChevronLeft,
  CalendarDays,
  LockKeyhole,
  House,
  ParkingSquare,
  SlidersHorizontal,
} from 'lucide-react';
import { api, post, money, queryClient, setCsrf, localInput, label } from './api';
import {
  useAuth,
  useToast,
  useConfig,
  SpotCard,
  Loading,
  ErrorState,
  Empty,
  PageTitle,
  Field,
  Badge,
} from './ui';
import type { Spot, Vehicle, User, Booking } from './types';
import { ParkingMap } from './Map';

export function Landing() {
  const [location, setLocation] = useState('');
  const navigate = useNavigate();
  const { data: spots = [] } = useQuery({
    queryKey: ['spots', 'featured'],
    queryFn: () => api<Spot[]>('/spots'),
  });
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span /> LESS CIRCLING. MORE LIVING.
          </div>
          <h1>
            Your spot.
            <br />
            Just around
            <br />
            <em>the corner.</em>
          </h1>
          <p>
            Discover unused driveways and neighborhood spaces.
            <br className="desktop" /> Park with peace of mind. Get on with your day.
          </p>
          <form
            className="hero-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/explore?q=${encodeURIComponent(location)}`);
            }}
          >
            <MapPin size={21} />
            <div>
              <label htmlFor="hero-location">Where are you headed?</label>
              <input
                id="hero-location"
                placeholder="Try Bengaluru or University campus"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button className="btn" type="submit">
              <Search size={18} />
              <span>Find a space</span>
            </button>
          </form>
          <div className="hero-trust">
            <div className="avatar-stack">
              <span>RN</span>
              <span>AS</span>
              <span>MK</span>
            </div>
            <div>
              <div className="stars">★★★★★</div>
              <span>Made for better neighborhood parking</span>
            </div>
          </div>
        </div>
        <div className="hero-art">
          <img
            src="/demo/hero-neighborhood.svg"
            alt="Illustrated leafy neighborhood with private parking spaces, homes and a teal car"
          />
          <div className="floating-card available-float">
            <span className="check-circle">
              <Check size={18} />
            </span>
            <div>
              <strong>A space for your day</strong>
              <small>Good parking. Great neighbors.</small>
            </div>
          </div>
          <div className="floating-card price-float">
            <ParkingSquare size={25} />
            <div>
              <small>NEIGHBORHOOD PARKING</small>
              <strong>
                From ₹20<span> / hour</span>
              </strong>
            </div>
          </div>
          <div className="art-caption">A quieter way to arrive.</div>
        </div>
      </section>
      <div className="trust-strip">
        <span>
          <ShieldCheck size={19} />
          Reviewed spaces
        </span>
        <span>
          <Clock3 size={19} />
          Book by the hour
        </span>
        <span>
          <LockKeyhole size={19} />
          Secure reservations
        </span>
        <span>
          <Leaf size={19} />
          Better use of our city
        </span>
      </div>
      <section className="section featured">
        <div className="section-heading">
          <div>
            <p className="eyebrow">GOOD SPACES, CLOSE BY</p>
            <h2>
              A place to park.
              <br />A little less to think about.
            </h2>
          </div>
          <Link to="/explore" className="btn btn-outline">
            Explore all spaces
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="spot-grid">
          {spots.slice(0, 3).map((s) => (
            <SpotCard key={s.id} spot={s} />
          ))}
        </div>
        <p className="demo-footnote">
          Fictional spaces around our demonstration campus in Bengaluru.
        </p>
      </section>
      <section className="how-section section" id="how-it-works">
        <p className="eyebrow">PARKING, WITHOUT THE DETOUR</p>
        <h2>
          Three small steps.
          <br />
          One easier day.
        </h2>
        <div className="steps">
          <article>
            <span>01</span>
            <MapPin />
            <h3>Find your little space</h3>
            <p>Explore nearby private parking and choose the time that works for you.</p>
          </article>
          <article>
            <span>02</span>
            <CalendarDays />
            <h3>Make it yours</h3>
            <p>Reserve your spot with a safe checkout and a clear price from the start.</p>
          </article>
          <article>
            <span>03</span>
            <CarFront />
            <h3>Arrive. Park. Breathe.</h3>
            <p>Your host verifies arrival and departure, so every neighbor is looked after.</p>
          </article>
        </div>
      </section>
      <section className="host-banner section">
        <div>
          <span className="eyebrow">YOUR EMPTY SPACE HAS POTENTIAL</span>
          <h2>
            A driveway for you.
            <br />A good day for someone else.
          </h2>
          <p>Share a little space. Make your neighborhood work better.</p>
          <Link className="btn btn-light" to="/register?owner=true">
            Become a host
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="host-house">
          <House size={110} strokeWidth={1} />
          <span>
            MORE SPACE.
            <br />
            MORE POSSIBILITY.
          </span>
        </div>
      </section>
    </>
  );
}
const authSchema = z.object({
  fullName: z.string().optional(),
  email: z.email('Enter a valid email address.'),
  password: z.string().min(10, 'Use at least 10 characters.').max(72),
  owner: z.boolean(),
});
export function AuthPage({ register = false }: { register?: boolean }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const config = useConfig();
  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: { fullName: '', email: '', password: '', owner: params.get('owner') === 'true' },
  });
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof authSchema>) => {
      if (register && (!values.fullName || values.fullName.trim().length < 2))
        throw new Error('Enter your full name.');
      const data = await post<{ user: User; csrf: string }>(
        register ? '/auth/register' : '/auth/login',
        register ? values : { email: values.email, password: values.password },
      );
      setCsrf(data.csrf);
      queryClient.setQueryData(['me'], data.user);
      return data.user;
    },
    onSuccess: (user) => {
      const next = params.get('next');
      navigate(
        next?.startsWith('/') && !next.startsWith('//')
          ? next
          : user.roles.includes('ADMIN')
            ? '/admin'
            : user.roles.includes('OWNER')
              ? '/owner'
              : '/dashboard',
      );
      toast(register ? 'Welcome to the neighborhood.' : 'Welcome back.');
    },
  });
  return (
    <div className="auth-layout">
      <section className="auth-story">
        <span className="eyebrow">A LITTLE SPACE. A BETTER CITY.</span>
        <h1>
          Good parking.
          <br />
          <em>Great neighbors.</em>
        </h1>
        <img src="/demo/hero-neighborhood.svg" alt="A quiet illustrated neighborhood" />
        <p>Thoughtful spaces, shared by people nearby.</p>
      </section>
      <section className="auth-form">
        <Link className="back-link" to="/">
          <ChevronLeft size={16} />
          Back to DriveShare
        </Link>
        <h1>{register ? 'Make room for a better day.' : 'Good to see you again.'}</h1>
        <p className="muted">
          {register
            ? 'One account to park and share your space.'
            : 'Your next little space is waiting.'}
        </p>
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          {register && (
            <Field label="Full name" error={form.formState.errors.fullName?.message}>
              <input autoComplete="name" {...form.register('fullName')} />
            </Field>
          )}
          <Field label="Email address" error={form.formState.errors.email?.message}>
            <input type="email" autoComplete="email" {...form.register('email')} />
          </Field>
          <Field label="Password" error={form.formState.errors.password?.message}>
            <input
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              {...form.register('password')}
            />
          </Field>
          {register && (
            <label className="checkbox">
              <input type="checkbox" {...form.register('owner')} />
              I’d also like to host a parking space
            </label>
          )}
          {mutation.error && <ErrorState error={mutation.error} />}
          <button className="btn btn-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Just a moment…' : register ? 'Create your account' : 'Sign in'}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="small">
          {register ? 'Already a neighbor?' : 'New around here?'}{' '}
          <Link className="text-teal" to={register ? '/login' : '/register'}>
            {register ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
        {config.data?.demo && (
          <div className="soft-card demo-credentials">
            <strong>Take a look around</strong>
            <p>
              Local fictional demo accounts use <code>DriveShareDemo!23</code>
            </p>
            <div className="button-row">
              {['driver', 'owner', 'admin'].map((role) => (
                <button
                  className="btn btn-outline btn-sm"
                  type="button"
                  key={role}
                  onClick={() => {
                    form.setValue('email', `${role}@driveshare.demo`);
                    form.setValue('password', 'DriveShareDemo!23');
                  }}
                >
                  {label(role)} demo
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
export function Explore() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [vehicle, setVehicle] = useState('');
  const [price, setPrice] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [showMap, setShowMap] = useState(true);
  const filters = new URLSearchParams();
  if (q) filters.set('q', q);
  if (vehicle) filters.set('vehicleType', vehicle);
  if (price) filters.set('maxPrice', String(Number(price) * 100));
  if (start && end) {
    filters.set('start', new Date(start).toISOString());
    filters.set('end', new Date(end).toISOString());
    if (onlyAvailable) filters.set('available', 'true');
  }
  const {
    data: spots = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ['spots', filters.toString()],
    queryFn: () => api<Spot[]>(`/spots?${filters}`),
  });
  return (
    <section className="explore-page">
      <div className="explore-heading">
        <div>
          <p className="eyebrow">YOUR NEXT LITTLE SPACE</p>
          <h1>Less searching. More arriving.</h1>
          <p>Neighborhood parking around Bengaluru’s fictional university campus.</p>
        </div>
        <button className="btn btn-outline" onClick={() => setShowMap(!showMap)}>
          <MapPin size={17} />
          {showMap ? 'Hide map' : 'Show map'}
        </button>
      </div>
      <form
        className="explore-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(q ? { q } : {});
        }}
      >
        <label className="search-filter">
          <Search size={18} />
          <input
            aria-label="Search location"
            list="areas"
            placeholder="City, neighborhood or campus"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <datalist id="areas">
            {['Bengaluru', 'University campus', 'Indiranagar', 'Koramangala', 'Jayanagar'].map(
              (a) => (
                <option key={a}>{a}</option>
              ),
            )}
          </datalist>
        </label>
        <select
          aria-label="Vehicle type"
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
        >
          <option value="">All vehicles</option>
          <option value="CAR">Car</option>
          <option value="TWO_WHEELER">Two-wheeler</option>
        </select>
        <select
          aria-label="Maximum hourly price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        >
          <option value="">Any price</option>
          {[25, 40, 60, 100].map((n) => (
            <option key={n} value={n}>
              Up to ₹{n}/hr
            </option>
          ))}
        </select>
        <label className="date-filter">
          Arrive
          <input
            aria-label="Arrival time"
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required={Boolean(end)}
          />
        </label>
        <label className="date-filter">
          Leave
          <input
            aria-label="Departure time"
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required={Boolean(start)}
          />
        </label>
        <button className="icon-button" aria-label="Apply search">
          <Search size={19} />
        </button>
      </form>
      <div className="row results-row">
        <span>
          <strong>{spots.length} spaces</strong>{' '}
          <span className="muted">a little closer to your day</span>
        </span>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          Available only <span className="muted">(choose times)</span>
        </label>
      </div>
      <div className={`explore-layout ${!showMap ? 'no-map' : ''}`}>
        <div>
          {error ? (
            <ErrorState error={error} />
          ) : isPending ? (
            <Loading />
          ) : spots.length ? (
            <div className="explore-grid">
              {spots.map((s) => (
                <SpotCard
                  key={s.id}
                  spot={s}
                  selected={selected === s.id}
                  onSelect={() => {
                    setSelected(s.id);
                    setShowMap(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <Empty
              title="A little further afield?"
              text="Try a different location, price or time to find your space."
              action={
                <button
                  className="btn"
                  onClick={() => {
                    setQ('');
                    setPrice('');
                    setVehicle('');
                    setOnlyAvailable(false);
                  }}
                >
                  Clear filters
                </button>
              }
            />
          )}
        </div>
        {showMap && <ParkingMap spots={spots} selected={selected} onSelect={setSelected} />}
      </div>
    </section>
  );
}
export function SpotDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuth();
  const toast = useToast();
  const config = useConfig();
  const spot = useQuery({ queryKey: ['spot', id], queryFn: () => api<Spot>(`/spots/${id}`) });
  const vehicles = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api<Vehicle[]>('/vehicles'),
    enabled: Boolean(user.data),
  });
  const [vehicle, setVehicle] = useState('');
  const [start, setStart] = useState(() => localInput(new Date(Date.now() + 3600000)));
  const [end, setEnd] = useState(() => localInput(new Date(Date.now() + 7200000)));
  const [failed, setFailed] = useState(false);
  const mutation = useMutation({
    mutationFn: (waitlist: boolean) => {
      if (!user.data) {
        navigate(`/login?next=${encodeURIComponent(`/explore/${id}`)}`);
        throw new Error('Sign in to reserve this space.');
      }
      return post<Booking>('/bookings', {
        parkingSpotId: id,
        vehicleId: vehicle || vehicles.data?.[0]?.id,
        startTime: new Date(start).toISOString(),
        endTime: new Date(end).toISOString(),
        idempotencyKey: crypto.randomUUID(),
        waitlist,
      });
    },
    onSuccess: (b) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      if (b.bookingStatus === 'WAITLISTED') {
        toast('You’re on the waiting list. We’ll let you know inside the app.');
        navigate(`/bookings/${b.id}`);
      } else navigate(`/pay/${b.id}`);
    },
    onError: () => setFailed(true),
  });
  if (spot.isPending) return <Loading />;
  if (spot.error || !spot.data) return <ErrorState error={spot.error} />;
  const s = spot.data;
  const duration = Math.max(0, (+new Date(end) - +new Date(start)) / 3600000);
  const total = Math.ceil(duration * s.hourlyPrice);
  return (
    <section className="section detail-page">
      <Link className="back-link" to="/explore">
        <ChevronLeft size={16} />
        All spaces
      </Link>
      <PageTitle
        eyebrow={`${label(s.parkingType)} PARKING · BENGALURU`}
        title={s.title}
        text={s.address}
      />
      <div className="detail-layout">
        <div>
          <div className="detail-gallery">
            <img src={s.images[0] ?? '/demo/parking-1.svg'} alt={`Parking at ${s.title}`} />
            <span>Fictional demonstration space</span>
          </div>
          {s.images.length > 1 && (
            <div className="gallery-thumbs">
              {s.images.slice(1).map((src) => (
                <a href={src} key={src} target="_blank" rel="noreferrer">
                  <img src={src} alt="Additional parking view" />
                </a>
              ))}
            </div>
          )}
          <div className="detail-host">
            <span className="avatar">{s.owner?.fullName[0] ?? 'H'}</span>
            <div>
              <h3>Hosted by {s.owner?.fullName ?? 'your neighbor'}</h3>
              <span className="muted small">
                <ShieldCheck size={13} /> Permission confirmed · listing reviewed
              </span>
            </div>
          </div>
          <div className="detail-features">
            <span>
              <CarFront /> {s.vehicleTypes.map(label).join(' & ')}
            </span>
            <span>
              <House /> {label(s.parkingType)} space
            </span>
            <span>
              <Clock3 /> Book by the hour
            </span>
            <span>
              <ShieldCheck /> Verified entry & exit
            </span>
          </div>
          <h2>Room for an easier arrival.</h2>
          <p className="body-copy">{s.description}</p>
          <h3>Finding your space</h3>
          <p className="body-copy">{s.accessInstructions}</p>
          <p className="small muted">
            Space {s.spotNumber} · Local time zone: {s.timezone}
          </p>
          <h3>Weekly availability</h3>
          <div className="schedule-summary">
            {s.availability
              .filter((a) => a.isActive)
              .map((a) => (
                <span key={a.id}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][a.dayOfWeek]} {a.startTime}–
                  {a.endTime}
                </span>
              ))}
          </div>
          <h3>What neighbors are saying</h3>
          {s.reviews.length ? (
            s.reviews.map((r) => (
              <div className="review" key={r.id}>
                <div className="row">
                  <strong>{r.reviewer?.fullName}</strong>
                  <span className="rating">
                    <Star size={14} />
                    {r.rating}.0
                  </span>
                </div>
                <p>{r.comment}</p>
              </div>
            ))
          ) : (
            <p className="muted">
              A new space in the neighborhood. Be the first to share your experience.
            </p>
          )}
        </div>
        <aside className="reservation-card">
          <div className="row">
            <div>
              <strong className="price-large">{money(s.hourlyPrice)}</strong>
              <span className="muted"> / hour</span>
            </div>
            <ShieldCheck className="text-teal" />
          </div>
          {s.physicallyOccupied && (
            <div className="notice small">
              A vehicle is currently parked here. An overdue session may affect availability.
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate(false);
            }}
          >
            <Field label="Arrive">
              <input
                required
                type="datetime-local"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  setFailed(false);
                }}
              />
            </Field>
            <Field label="Leave">
              <input
                required
                type="datetime-local"
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                  setFailed(false);
                }}
              />
            </Field>
            <Field label="Your vehicle">
              <select
                required={Boolean(user.data)}
                value={vehicle || vehicles.data?.[0]?.id || ''}
                onChange={(e) => setVehicle(e.target.value)}
              >
                <option value="">Select a vehicle</option>
                {vehicles.data?.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleModel} · {v.registrationNumber}
                  </option>
                ))}
              </select>
            </Field>
            {user.data && !vehicles.data?.length && (
              <Link className="text-button small" to="/vehicles">
                Add your vehicle first
                <ArrowUpRight size={14} />
              </Link>
            )}
            <div className="price-breakdown">
              <div>
                <span>
                  {duration.toFixed(1)} hours × {money(s.hourlyPrice)}
                </span>
                <span>{money(total || 0)}</span>
              </div>
              <div>
                <strong>Total</strong>
                <strong>{money(total || 0)}</strong>
              </div>
            </div>
            {mutation.error && <ErrorState error={mutation.error} />}
            <button
              className="btn btn-full"
              disabled={
                mutation.isPending || duration <= 0 || Boolean(user.data && !vehicles.data?.length)
              }
            >
              {mutation.isPending ? 'Checking your space…' : 'Reserve this space'}
              <ArrowRight size={17} />
            </button>
            {failed && (
              <button
                type="button"
                className="btn btn-outline btn-full"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(true)}
              >
                Join waiting list
              </button>
            )}
            <p className="small muted centered">
              A {config.data?.policy.holdMinutes ?? 5}-minute hold keeps your space while you
              complete demo payment.
            </p>
          </form>
          <div className="policy-summary">
            <h4>Clear plans. Fair policies.</h4>
            <p>
              {config.data?.policy.cancellation ??
                'Free cancellation more than 1 hour before arrival. 10% within 1 hour; 25% after start if unoccupied. Full refund if your space is unavailable.'}
            </p>
            <p>
              After {config.data?.policy.graceMinutes ?? 10} minutes’ grace: ₹
              {config.data?.policy.fineRupees ?? 20} per started{' '}
              {config.data?.policy.fineInterval ?? 15} minutes of overstay. Owner verifies
              departure.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
