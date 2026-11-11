import { pathToFileURL } from 'node:url';

export function requireHostedDatabase() {
  if (process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === 'true')
    throw new Error(
      'Hosted database setup requires NODE_ENV=production and demo controls disabled.',
    );

  const url = URL.parse(process.env.DATABASE_URL ?? '');
  if (
    !url ||
    !['postgresql:', 'postgres:'].includes(url.protocol) ||
    url.pathname !== '/driveshare_online' ||
    (url.search && url.search !== '?schema=public') ||
    url.hash
  )
    throw new Error(
      'DATABASE_URL must explicitly target the driveshare_online PostgreSQL database.',
    );

  const renderPrivateHost =
    process.env.RENDER === 'true' &&
    /^(?:dpg-[a-z0-9-]+|[a-z0-9.-]+\.internal)$/i.test(url.hostname);
  const isolatedRehearsal =
    process.env.DRIVESHARE_HOSTED_REHEARSAL === 'true' &&
    ['127.0.0.1', '[::1]'].includes(url.hostname) &&
    url.port !== '' &&
    url.port !== '5432';

  if (!renderPrivateHost && !isolatedRehearsal)
    throw new Error(
      'Use the Render internal database URL or an explicitly enabled isolated rehearsal.',
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  requireHostedDatabase();
