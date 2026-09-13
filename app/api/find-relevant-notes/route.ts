// DEV-LOCAL-MODE — delete this whole directory to remove local mode.
// Next.js derives routes from file location, so this file has to live here;
// the implementation lives in dev/local-relevance-route.ts. The handler itself
// returns 404 unless NEXT_PUBLIC_LOCAL_MODE=1.
export { POST } from '@/dev/local-relevance-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
