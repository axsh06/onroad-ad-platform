import * as React from 'react'
import { cn } from '@/lib/utils'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'default', asChild = false, children, ...props }, ref
) {
  const variants = {
    default: 'bg-lime-300 text-black hover:bg-lime-200',
    outline: 'border border-white/15 bg-transparent text-white hover:bg-white/5',
    secondary: 'bg-white/10 text-white hover:bg-white/15',
    ghost: 'text-white hover:bg-white/10',
    destructive: 'bg-red-600 text-white hover:bg-red-500',
    link: 'text-lime-300 underline-offset-4 hover:underline',
  }
  const sizes = {
    default: 'h-10 px-4 py-2', sm: 'h-9 px-3', lg: 'h-11 px-8', icon: 'h-10 w-10',
  }
  const mergedClassName = cn('inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50', variants[variant], sizes[size], className)
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>
    return React.cloneElement(child, { className: cn(mergedClassName, child.props.className) })
  }
  return <button ref={ref} className={mergedClassName} {...props}>{children}</button>
})
