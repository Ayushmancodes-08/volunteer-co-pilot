import app from './app';
import { startSweeper } from './services/cacheService';

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    startSweeper();
    await app.listen({ port: PORT, host: HOST });
    // eslint-disable-next-line no-console -- server startup notification for operators
    console.log(`Server running at http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
