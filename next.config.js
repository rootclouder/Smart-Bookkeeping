/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '*.remote-agent.svc.cluster.local',
    '*.agent-sandbox-my-b1-gw.trae.ai'
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
