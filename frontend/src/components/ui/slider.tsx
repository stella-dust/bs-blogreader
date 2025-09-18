import React, { useState, useRef, useCallback } from 'react'
import { clsx } from 'clsx'

interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className
}: SliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  const currentValue = value[0] || min

  const getValueFromPosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return currentValue

    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const rawValue = min + percentage * (max - min)

    // Snap to step
    const steppedValue = Math.round(rawValue / step) * step
    return Math.max(min, Math.min(max, steppedValue))
  }, [min, max, step, currentValue])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled) return

    event.preventDefault()
    setIsDragging(true)

    const newValue = getValueFromPosition(event.clientX)
    onValueChange([newValue])

    const handleMouseMove = (e: MouseEvent) => {
      const newValue = getValueFromPosition(e.clientX)
      onValueChange([newValue])
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [disabled, getValueFromPosition, onValueChange])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return

    let newValue = currentValue
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = Math.max(min, currentValue - step)
        break
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = Math.min(max, currentValue + step)
        break
      case 'Home':
        newValue = min
        break
      case 'End':
        newValue = max
        break
      default:
        return
    }

    event.preventDefault()
    onValueChange([newValue])
  }, [disabled, currentValue, min, max, step, onValueChange])

  const percentage = ((currentValue - min) / (max - min)) * 100

  return (
    <div className={clsx('relative flex items-center w-full', className)}>
      <div
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        className={clsx(
          'relative h-2 w-full rounded-full bg-gray-200 cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Progress track */}
        <div
          className="absolute h-full bg-blue-600 rounded-full"
          style={{ width: `${percentage}%` }}
        />

        {/* Thumb */}
        <div
          className={clsx(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-blue-600 bg-white shadow-sm transition-all',
            isDragging ? 'scale-110' : 'hover:scale-105',
            disabled && 'border-gray-400'
          )}
          style={{ left: `calc(${percentage}% - 8px)` }}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={currentValue}
          aria-disabled={disabled}
        />
      </div>
    </div>
  )
}