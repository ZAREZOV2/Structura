import { swagger } from '@elysiajs/swagger';
import { app } from './app';
import './db'; // initialises the bun:sqlite default database
import { env } from './env';

app
  .use(
    swagger({
      path: '/swagger',
      documentation: {
        info: {
          title: 'Structura API',
          version: '0.0.0',
          description: 'API for Structura — a Notion-style collaborative notes app.',
        },
        tags: [
          { name: 'Health', description: 'Service health' },
          { name: 'Auth', description: 'Authentication & sessions' },
          { name: 'Workspaces', description: 'Workspaces & membership' },
          { name: 'Pages', description: 'Page tree' },
        ],
      },
    }),
  )
  .listen(env.port, () => {
    console.log(`🦊API running at http://localhost:${env.port}`);
    console.log(`📚Swagger docs at http://localhost:${env.port}/swagger`);
  });
