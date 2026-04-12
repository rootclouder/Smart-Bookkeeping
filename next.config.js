/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    'run-agent-69da28737626caba878a15f8-mnvmzkiq.remote-agent.svc.cluster.local',
    'run-agent-69da28737626caba878a15f8-mnvmzkiq-preview.agent-sandbox-my-b1-gw.trae.ai',
    '*.trae.ai'
  ],
};

module.exports = nextConfig;
