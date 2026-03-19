import { z } from 'zod';

export const CreatePoolSchema = z.object({
  year: z.number().int().min(2020),
  members: z
    .array(z.string().min(1))
    .min(2, 'A pool requires at least 2 member ship IDs.'),
});

export type CreatePoolDto = z.infer<typeof CreatePoolSchema>;

export interface PoolResultDto {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}
