import { MessageType, PrismaClient } from '@prisma/client';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { v4 as uuid } from 'uuid';
import mime from 'mime-types';

const UPLOAD_DIR = join(process.cwd(), 'uploads');

export const createText = (
    prisma: PrismaClient,
    authorId: number,
    text: string,
) =>
    prisma.message.create({
        data: { type: MessageType.TEXT, text, authorId },
    });

export const createFile = async (
    prisma: PrismaClient,
    authorId: number,
    part: import('@fastify/multipart').MultipartFile,
) => {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const ext = mime.extension(part.mimetype) || 'bin';
    const filename = `${uuid()}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    await fs.writeFile(filepath, await part.toBuffer());

    return prisma.message.create({
        data: {
            type: MessageType.FILE,
            filePath: filepath,
            mimeType: part.mimetype,
            authorId,
        },
    });
};

export const list = (
    prisma: PrismaClient,
    page: number,
    limit: number,
) =>
    prisma.message.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { author: { select: { email: true } } },
    });

export const get = (prisma: PrismaClient, id: number) =>
    prisma.message.findUnique({ where: { id } });
