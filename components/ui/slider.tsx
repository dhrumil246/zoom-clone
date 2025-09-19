// components/ui/slider.tsx
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  id?: string
  min: number
  max: number
  step: number
  value: number[]
  onValueChange: (value: number[]) => void
  disabled?: boolean
  className?: string
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, min, max, step, value, onValueChange, disabled, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange([parseFloat(e.target.value)])
    }

    return (
      <div className={cn("relative flex items-center", className)}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0] || 0}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700",
            "slider-thumb:appearance-none slider-thumb:h-5 slider-thumb:w-5 slider-thumb:rounded-full slider-thumb:bg-blue-600 slider-thumb:cursor-pointer",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value[0] - min) / (max - min)) * 100}%, #e5e7eb ${((value[0] - min) / (max - min)) * 100}%, #e5e7eb 100%)`
          }}
          {...props}
          ref={ref}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }