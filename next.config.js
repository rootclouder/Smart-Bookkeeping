/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '*.remote-agent.svc.cluster.local',
    '*.agent-sandbox-my-b1-gw.trae.ai'
  ],
};

module.exports = nextConfig;
