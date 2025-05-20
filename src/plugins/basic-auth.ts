import fp from 'fastify-plugin';
import fastifyBasicAuth from '@fastify/basic-auth';
import * as accountService from '../modules/account/account.service';

export default fp(async (app) => {
    await app.register(fastifyBasicAuth, {
        validate: async (email, password, req, reply) => {
            const ok = await accountService.verify({
                prisma: app.prisma,
                email,
                password
            });
            if (!ok) {
                reply.code(401).send({ message: 'Invalid credentials' });
            }
        },
        authenticate: true,
    });

    app.addHook('preValidation', async (req) => {
        if (req.headers.authorization?.startsWith('Basic ')) {
            const [, encoded] = req.headers.authorization.split(' ');
            const [id, email] = Buffer.from(encoded, 'base64').toString().split(':');
            req.user = { id: Number(id), email };
        }
    });
});

declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            id: number;
            email: string
        };
    }
}
