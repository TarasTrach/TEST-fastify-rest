import fp from 'fastify-plugin';
import fastifyBasicAuth from '@fastify/basic-auth';
import * as accountService from '../modules/account/account.service';

export default fp(async (app) => {
    await app.register(fastifyBasicAuth, {
        validate: async (email, password, req, reply) => {
            const ok = await accountService.verify({
                prisma: app.prisma,
                email,
                password,
            });
            if (!ok) {
                reply.code(401).send({ message: 'Invalid credentials' });
            }
        },
        authenticate: true,
    });

    app.addHook('preValidation', async (req, reply) => {
        const auth = req.headers.authorization;
        if (!auth?.startsWith('Basic ')) {
            return;
        }

        const [, encoded] = auth.split(' ');
        const [email, password] = Buffer
            .from(encoded, 'base64')
            .toString()
            .split(':');

        try {
            const user = await accountService.getUser({
                prisma: app.prisma,
                email,
                password,
            });

            req.user = { id: user.id, email: user.email };
        } catch (err) {
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
