import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

type AuthParams = {
    prisma: PrismaClient;
    email: string;
    password: string;
};

export const register = async ({ prisma, email, password }: AuthParams) => {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error('User already exists');

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    return prisma.user.create({ data: { email, passwordHash } });
};

export const verify = async ({ prisma, email, password }: AuthParams) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return false;
    return argon2.verify(user.passwordHash, password);
};