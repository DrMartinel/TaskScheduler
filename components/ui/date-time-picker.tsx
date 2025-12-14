"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value?: string // ISO string or datetime-local format
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  min?: string // ISO string or datetime-local format
  className?: string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  disabled,
  min,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )
  const [timeValue, setTimeValue] = React.useState<string>(() => {
    if (value) {
      const date = new Date(value)
      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")
      return `${hours}:${minutes}`
    }
    return ""
  })

  // Update selectedDate when value prop changes
  React.useEffect(() => {
    if (value) {
      const date = new Date(value)
      setSelectedDate(date)
      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")
      setTimeValue(`${hours}:${minutes}`)
    } else {
      setSelectedDate(undefined)
      setTimeValue("")
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined)
      onChange("")
      return
    }

    // If time is already set, combine with the new date
    if (timeValue) {
      const [hours, minutes] = timeValue.split(":").map(Number)
      date.setHours(hours || 0, minutes || 0, 0, 0)
    } else {
      // Default to current time if no time is set
      const now = new Date()
      date.setHours(now.getHours(), now.getMinutes(), 0, 0)
    }

    setSelectedDate(date)
    // Format as datetime-local string (YYYY-MM-DDTHH:mm)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const datetimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`
    onChange(datetimeLocal)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTimeValue(newTime)

    if (selectedDate && newTime) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours || 0, minutes || 0, 0, 0)

      // Format as datetime-local string
      const year = newDate.getFullYear()
      const month = String(newDate.getMonth() + 1).padStart(2, "0")
      const day = String(newDate.getDate()).padStart(2, "0")
      const hoursStr = String(newDate.getHours()).padStart(2, "0")
      const minutesStr = String(newDate.getMinutes()).padStart(2, "0")
      const datetimeLocal = `${year}-${month}-${day}T${hoursStr}:${minutesStr}`
      onChange(datetimeLocal)
    }
  }

  const minDate = min ? new Date(min) : undefined
  const displayValue = selectedDate
    ? `${format(selectedDate, "PPP")} ${timeValue || format(selectedDate, "p")}`
    : ""

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || <span>{placeholder}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (minDate) {
                return date < minDate
              }
              return false
            }}
            initialFocus
          />
          <div className="flex items-center gap-2 border-t pt-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="w-full"
              placeholder="HH:MM"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
