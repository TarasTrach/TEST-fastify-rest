import fp from 'fastify-plugin';
import { z } from 'zod';

export default fp(async (app) => {
    const Schema = z.object({
        NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
        DATABASE_URL: z.string().url(),
        PORT: z.coerce.number().default(3000),
    });

    const parsed = Schema.parse(process.env);
    app.decorate('config', parsed);
});

declare module 'fastify' {
    interface FastifyInstance {
        config: {
            NODE_ENV: string,
            DATABASE_URL: string,
            PORT: number
        };
    }
}