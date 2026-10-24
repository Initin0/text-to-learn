import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { getProvider } from './services/ai/index.js';

async function main() {
  await connectDB(env.mongoUri);
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`Text-to-Learn API on :${env.port} (${env.nodeEnv}) | AI: ${getProvider().name} | YouTube: ${env.youtubeKey ? 'on' : 'off'}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
