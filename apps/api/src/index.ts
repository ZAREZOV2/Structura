import { app } from './app';
import { env } from './env';

app.listen(env.port, () => {
  console.log(`🦊 API running at http://localhost:${env.port}`);
  console.log(`📚 Swagger docs at http://localhost:${env.port}/swagger`);
});
