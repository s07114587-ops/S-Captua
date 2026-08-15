// /api/config.js
// Runs as a Vercel Serverless Function (Node.js runtime).
// Reads the Clerk PUBLISHABLE key from env vars at request time and hands
// it to the frontend as JSON. This is safe to expose: Clerk's publishable
// key is meant to be public (it's the counterpart to your Secret Key,
// which must NEVER be sent to the browser).
//
// Env vars are set in: Vercel Dashboard -> Project -> Settings -> Environment Variables
//   api1 = pk_test_xxxxxxxx...   (Publishable Key -> safe for the client)
//   api2 = sk_test_xxxxxxxx...   (Secret Key -> server-only, not used here)

module.exports = (req, res) => {
  // Never let CDNs/browsers cache a stale or wrong key.
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json');

  const publishableKey = process.env.api1;

  if (!publishableKey) {
    res.status(500).json({
      error: 'missing_publishable_key',
      message: 'Environment variable "api1" is not set for this deployment.'
    });
    return;
  }

  res.status(200).json({ publishableKey: publishableKey });
};
