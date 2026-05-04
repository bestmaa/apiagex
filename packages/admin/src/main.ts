import { buildAdminApp } from './app.js';
import { readAdminConfig } from './config.js';

const config = readAdminConfig();
try {
  const app = await buildAdminApp(config);
  console.log(`Admin UI running at ${app.address}`);
} catch (error) {
  console.error(error);
  process.exit(1);
}
