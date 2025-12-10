"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { ChangeEvent } from "react"

interface SliderProps {
  className?: string
  value?: number[]
  defaultValue?: number[]
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number[]) => void
  disabled?: boolean
}

function Slider({
  className,
  value,
  defaultValue = [0],
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  ...props
}: SliderProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue[0])
  
  const currentValue = value !== undefined ? value[0] : internalValue
  const percentage = ((currentValue - min) / (max - min)) * 100

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value)
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.([newValue])
  }

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
      <div className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
        <div 
          className="absolute h-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        {...props}
      />
      <div 
        className="absolute h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        style={{ left: `calc(${percentage}% - 8px)` }}
      />
    </div>
  )
}

export { Slider }

