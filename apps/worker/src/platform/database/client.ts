import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, type Prisma } from '../../../../api/generated/prisma/client'

export type { Prisma, PrismaClient }

const connectionString =
  process.env.DATABASE_URL ?? 'postgresql://engancha:engancha@localhost:5432/engancha'

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})
