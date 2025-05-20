import fp from 'fastify-plugin';
import { createReadStream, promises as fs } from 'node:fs';

export default fp(async (app) => {
    app.decorate('fs', { ...fs, createReadStream });
});
declare module 'fastify' {
    interface FastifyInstance {
        fs: typeof import('node:fs/promises') & { createReadStream: typeof createReadStream };
    }
}