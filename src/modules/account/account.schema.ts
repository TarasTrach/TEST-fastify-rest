import { z } from 'zod';

export const registerBody = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export type RegisterBody = z.infer<typeof registerBody>;