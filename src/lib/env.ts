import { validate as validateBitcoinAddress } from 'bitcoin-address-validation';
import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_QUOTE_MOCK_ADDRESS: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateBitcoinAddress(val),
      'NEXT_PUBLIC_QUOTE_MOCK_ADDRESS must be a valid Bitcoin address when provided',
    ),
});

const serverEnvSchema = z.object({
  SATS_TERMINAL_API_KEY: z.string().min(1),
  ORDISCAN_API_KEY: z.string().min(1),
  RUNES_FLOOR_API_KEY: z.string().min(1),
  LIQUIDIUM_API_KEY: z.string().min(1),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_QUOTE_MOCK_ADDRESS: process.env.NEXT_PUBLIC_QUOTE_MOCK_ADDRESS,
  });
  if (!parsed.success) {
    throw new Error(`Invalid client env: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    SATS_TERMINAL_API_KEY: process.env.SATS_TERMINAL_API_KEY,
    ORDISCAN_API_KEY: process.env.ORDISCAN_API_KEY,
    RUNES_FLOOR_API_KEY: process.env.RUNES_FLOOR_API_KEY,
    LIQUIDIUM_API_KEY: process.env.LIQUIDIUM_API_KEY,
  });
  if (!parsed.success) {
    throw new Error(`Invalid server env: ${parsed.error.message}`);
  }
  return parsed.data;
}
