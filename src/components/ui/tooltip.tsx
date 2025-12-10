"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  className?: string
}

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const showTooltip = () => {
    setIsVisible(true)
  }

  const hideTooltip = () => {
    setIsVisible(false)
  }

  React.useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      
      let top = 0
      let left = 0

      switch (side) {
        case "top":
          top = triggerRect.top - tooltipRect.height - 8 + window.scrollY
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2 + window.scrollX
          break
        case "bottom":
          top = triggerRect.bottom + 8 + window.scrollY
          left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2 + window.scrollX
          break
        case "left":
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2 + window.scrollY
          left = triggerRect.left - tooltipRect.width - 8 + window.scrollX
          break
        case "right":
          top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2 + window.scrollY
          left = triggerRect.right + 8 + window.scrollX
          break
      }

      // Ensure tooltip doesn't go off-screen
      const padding = 8
      if (left < padding) left = padding
      if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding
      }
      if (top < padding) top = padding
      if (top + tooltipRect.height > window.innerHeight + window.scrollY - padding) {
        top = window.innerHeight + window.scrollY - tooltipRect.height - padding
      }

      setPosition({ top, left })
    }
  }, [isVisible, side])

  const tooltipElement = isVisible && mounted ? (
    createPortal(
      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[9999] px-3 py-2 text-xs rounded-md shadow-lg",
          "bg-popover text-popover-foreground border border-border",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          "whitespace-nowrap pointer-events-none",
          className
        )}
        style={{ top: position.top, left: position.left }}
      >
        {content}
      </div>,
      document.body
    )
  ) : null

  return (
    <div 
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onClick={showTooltip}
    >
      {children}
      {tooltipElement}
    </div>
  )
}

// Simple info icon with tooltip
interface InfoTooltipProps {
  content: React.ReactNode
  className?: string
}

export function InfoTooltip({ content, className }: InfoTooltipProps) {
  return (
    <Tooltip content={content} side="top" className={className}>
      <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-help transition-colors">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-3 h-3"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </Tooltip>
  )
}

