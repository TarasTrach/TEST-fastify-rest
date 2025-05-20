import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import * as messageService from '../../modules/message/service';

const MessageRoutes: FastifyPluginAsync = async (app) => {
    const textBody = z.object({ text: z.string().min(1) });

    app.post(
        '/text',
        { preValidation: [app.basicAuth] },
        async (req, reply) => {
            const { text } = textBody.parse(req.body);
            const userId = req.user!.id;
            const msg = await messageService.createText(app.prisma, userId, text);
            reply.code(201).send(msg);
        },
    );

    app.post(
        '/file',
        { preValidation: [app.basicAuth] },
        async (req, reply) => {
            const mpFile = await req.file();
            if (!mpFile) return reply.code(400).send({ error: 'file missing' });

            const userId = req.user!.id;
            const msg = await messageService.createFile(app.prisma, userId, mpFile);
            reply.code(201).send(msg);
        },
    );

    app.get(
        '/list',
        { preValidation: [app.basicAuth] },
        async (req) => {
            const page = +(req.query as any).page || 1;
            const limit = +(req.query as any).limit || 20;
            return messageService.list(app.prisma, page, limit);
        },
    );

    app.get(
        '/content/:id',
        { preValidation: [app.basicAuth] },
        async (req, reply) => {
            const id = Number((req.params as any).id);
            const msg = await messageService.get(app.prisma, id);
            if (!msg) return reply.code(404).send({ error: 'not found' });

            if (msg.type === 'TEXT') {
                reply.type('text/plain').send(msg.text ?? '');
            } else {
                const stream = app.fs.createReadStream(msg.filePath!); // fs декоратор ↓
                reply.type(msg.mimeType ?? 'application/octet-stream').send(stream);
            }
        },
    );
};

export default MessageRoutes;
