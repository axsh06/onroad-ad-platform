import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'secondary' | 'destructive' | 'outline' }
export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const styles = {
    default: 'bg-lime-300/15 text-lime-200 border-lime-300/20',
    secondary: 'bg-white/10 text-zinc-300 border-white/10',
    destructive: 'bg-red-500/15 text-red-300 border-red-400/20',
    outline: 'border-white/15 text-zinc-300 bg-transparent',
  }
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', styles[variant], className)} {...props} />
}
