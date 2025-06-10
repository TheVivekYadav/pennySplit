import {z} from 'zod'

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  equal_type: z.boolean().default(false)
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  equal_type: z.boolean().optional()
});