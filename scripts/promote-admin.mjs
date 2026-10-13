import { PrismaClient } from '@prisma/client'
import nextEnv from '@next/env'
nextEnv.loadEnvConfig(process.cwd())
const email = process.argv[2]?.trim().toLowerCase()
if (!email || !email.includes('@')) throw new Error('Usage: npm run admin:promote -- owner@example.com (existing account only)')
const prisma = new PrismaClient()
try {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!user) throw new Error('Register this account on the target website first.')
  await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } })
  console.log('Role updated. Sign out and sign in again to refresh the session.')
} finally { await prisma.$disconnect() }
