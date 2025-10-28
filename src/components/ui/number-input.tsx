"use client"

import React, { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface NumberInputProps extends InputHTMLAttributes<HTMLInputElement> {
  allowNegative?: boolean
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, allowNegative = false, ...props }, ref) => {
    return (
      <input
        type="number"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
        onKeyDown={(e) => {
          // Permitir el signo negativo al inicio si allowNegative es true
          if (allowNegative && e.key === '-' && e.currentTarget.selectionStart === 0) {
            return;
          }
          
          // Llamar al onKeyDown original si existe
          props.onKeyDown?.(e);
        }}
      />
    )
  }
)

NumberInput.displayName = "NumberInput"

export { NumberInput }
