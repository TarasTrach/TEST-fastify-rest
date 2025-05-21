import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import * as messageService from '../../modules/message/message.service';

const textBody = z.object({ text: z.string().min(1) });

function getUserIdFromReq(req: any, reply: any): number | null {
    if (!req.user || !req.user.id) {
        req.log.error('No user ID found in request');
        reply.code(401).send({ error: 'User is not authorized' });
        return null;
    }
    return req.user.id;
}

const MessageRoutes: FastifyPluginAsync = async (app) => {
    app.post(
        '/text',
        { preValidation: [app.basicAuth] },
        async (req, reply) => {
            const { text } = textBody.parse(req.body);

            const userId = getUserIdFromReq(req, reply);
            if (!userId) return;

            const msg = await messageService.createText(app.prisma, userId, text);
            reply.code(201).send(msg);
        },
    );

    app.post(
        '/file',
        { preValidation: [app.basicAuth] },
        async (req, reply) => {
            const mpFile = await req.file();
            if (!mpFile) {
                return reply.code(400).send({ error: 'file missing' });
            }

            const userId = getUserIdFromReq(req, reply);
            if (!userId) return;

            const msg = await messageService.createFile(app.prisma, userId, mpFile);
            reply.code(201).send(msg);
        },
    );


    app.get(
        '/list',
        { preValidation: [app.basicAuth] },
        async (req) => {
            // console.log(req);
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

            if (!msg) {
                return reply.code(404).send({ error: 'not found' });
            }

            if (msg.type === 'TEXT') {
                return reply.type('text/plain').send(msg.text ?? '');
            }

            try {
                await app.fs.access(msg.filePath!);
            } catch (err) {
                req.log.error(`File not found at path: ${msg.filePath}`);
                return reply.code(404).send({ error: 'File not found' });
            }

            const stream = app.fs.createReadStream(msg.filePath!);

            return reply
                .header('Content-Disposition', 'inline')
                .type(msg.mimeType ?? 'application/octet-stream')
                .send(stream);
        },
    );

};

export default MessageRoutes;