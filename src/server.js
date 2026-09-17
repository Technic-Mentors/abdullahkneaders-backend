import { app } from './app.js';
import { env } from './config/env.js';
import { BRAND_NAME } from './config/brand.js';

app.listen(env.port, () => {
  console.log(`${BRAND_NAME} API listening on http://localhost:${env.port}`);
});
