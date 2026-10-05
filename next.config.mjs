/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict Mode double-invokes effects in development, which is exactly the
  // condition the Phaser host must survive without leaving a second canvas.
  reactStrictMode: true,
  // Allow the dev server (HMR websocket, dev assets) to be used via the
  // server's public IP, not just localhost.
  allowedDevOrigins: ["88.99.217.221", "65.108.72.185"],
};

export default nextConfig;
