import { z } from 'zod';

const common = {
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
};

const envSchema = z.union([
  z.object({
    ...common,
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  }),
  z.object({
    ...common,
    POSTGRES_HOST: z.string().min(1),
    POSTGRES_PORT: z.coerce.number().int().positive().max(65535).default(5432),
    POSTGRES_DB: z.string().min(1),
    POSTGRES_USER: z.string().min(1),
    POSTGRES_PASSWORD: z.string().min(1),
  }).transform(({ POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, ...rest }) => ({
    ...rest,
    DATABASE_URL: `postgresql://${encodeURIComponent(POSTGRES_USER)}:${encodeURIComponent(POSTGRES_PASSWORD)}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`,
  })),
]);

export const env = envSchema.parse(process.env);
