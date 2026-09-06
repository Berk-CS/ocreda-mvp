/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  // Keep production builds separate from the live dev compiler. Running
  // `next build` while `next dev` is open otherwise replaces dev chunks and
  // leaves the browser requesting CSS/JS hashes that no longer exist.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: { unoptimized: true },
  turbopack: {
    // Pin module resolution to this app. A package-lock file also exists in a
    // parent directory on this machine, which otherwise makes Turbopack guess
    // the wrong workspace root.
    root: __dirname,
  },
};

module.exports = nextConfig;
