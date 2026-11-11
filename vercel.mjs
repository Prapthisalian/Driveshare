const upstream = new URL(process.env.DRIVESHARE_API_ORIGIN ?? 'https://missing.invalid');

if (
  !process.env.DRIVESHARE_API_ORIGIN ||
  upstream.protocol !== 'https:' ||
  !upstream.hostname.endsWith('.onrender.com') ||
  upstream.username ||
  upstream.password ||
  upstream.port ||
  upstream.pathname !== '/' ||
  upstream.search ||
  upstream.hash
) {
  throw new Error(
    'Set DRIVESHARE_API_ORIGIN to the HTTPS origin of the DriveShare Render service.',
  );
}

export const config = {
  framework: 'vite',
  installCommand: 'npm ci --include=dev',
  buildCommand: 'npm run build -w apps/web',
  outputDirectory: 'apps/web/dist',
  rewrites: [
    { source: '/api/:path*', destination: `${upstream.origin}/api/:path*` },
    { source: '/uploads/:path*', destination: `${upstream.origin}/uploads/:path*` },
    {
      source: '/((?!api(?:/|$)|uploads(?:/|$)|assets(?:/|$)|demo(?:/|$)|.*\\.[^/]+$).*)',
      destination: '/index.html',
    },
  ],
};
