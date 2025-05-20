import { FastifyPluginAsync } from 'fastify';
import { register } from '../../modules/account/account.service';
import { registerBody } from '../../modules/account/account.schema';

const accountRoutes: FastifyPluginAsync = async (app) => {
    app.post('/register', async (req, reply) => {
        const body = registerBody.parse(req.body);

        try {
            await register({
                prisma: app.prisma,
                email: body.email,
                password: body.password
            });
            reply.code(201).send({ ok: true });
        } catch (error: any) {
            reply.code(400).send({ error: error.message });
        }
    });
};

export default accountRoutes;