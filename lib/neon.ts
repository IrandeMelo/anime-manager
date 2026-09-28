import { createClient } from '@neondatabase/neon-js';

export const neon = createClient({
  auth: {
    url: 'https://ep-little-scene-ac4j9h94.neonauth.sa-east-1.aws.neon.tech/neondb/auth',
  },
  dataApi: {
    url: 'https://ep-little-scene-ac4j9h94.apirest.sa-east-1.aws.neon.tech/anime_manager/rest/v1',
  },
});
