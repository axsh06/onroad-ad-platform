import { spawnSync } from 'node:child_process'

const required = ['DATABASE_URL', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'STORAGE_DRIVER']
if (process.env.STORAGE_DRIVER === 's3') required.push('S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY')
if (process.env.STORAGE_DRIVER === 'vercel-blob' && !process.env.BLOB_STORE_ID) required.push('BLOB_READ_WRITE_TOKEN')
const missing = required.filter(key => !process.env[key])
if (missing.length) throw new Error(`Missing deployment variables: ${missing.join(', ')}`)
if (!['s3', 'vercel-blob'].includes(process.env.STORAGE_DRIVER)) throw new Error('Deployments require STORAGE_DRIVER=s3 or vercel-blob; local storage is development-only.')
if (process.env.NEXTAUTH_SECRET.length < 32 || process.env.NEXTAUTH_SECRET.includes('replace-with')) throw new Error('Set a new random NEXTAUTH_SECRET of at least 32 characters.')
if (new URL(process.env.NEXTAUTH_URL).protocol !== 'https:') throw new Error('NEXTAUTH_URL must be the public HTTPS address supplied by the hosting provider.')
if (process.env.VERCEL_ENV === 'preview' && process.env.PREVIEW_DATABASE_ISOLATED !== 'true') throw new Error('For previews, connect a separate database and set PREVIEW_DATABASE_ISOLATED=true. Never reuse the production database.')
const commands = [
  ['prisma', ['generate']],
  ['prisma', ['migrate', 'deploy']],
  ['next', ['build']],
]
for (const [name, args] of commands) {
  const env = { ...process.env }
  if (name === 'prisma' && args[0] === 'migrate') env.DATABASE_URL = env.DIRECT_URL || env.DATABASE_URL_UNPOOLED || env.DATABASE_URL
  const result = spawnSync(`./node_modules/.bin/${name}`, args, { stdio: 'inherit', env })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
