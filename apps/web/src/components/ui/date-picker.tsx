"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date | string
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  allowClear?: boolean
  minDate?: Date
  maxDate?: Date
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className,
  allowClear = true,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Convertir string a Date si es necesario
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    // Parsear string ISO o formato YYYY-MM-DD
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? undefined : parsed
  }, [value])

  const handleSelect = (date: Date | undefined) => {
    onChange(date)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? (
            <span className="flex-1">
              {format(dateValue, "PPP", { locale: es })}
            </span>
          ) : (
            <span className="flex-1">{placeholder}</span>
          )}
          {allowClear && dateValue && !disabled && (
            <X
              className="h-4 w-4 opacity-50 hover:opacity-100 ml-2"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          disabled={(date) => {
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

// DatePicker con rango de fechas
interface DateRangePickerProps {
  startDate?: Date | string
  endDate?: Date | string
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  startPlaceholder?: string
  endPlaceholder?: string
  disabled?: boolean
  className?: string
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startPlaceholder = "Fecha inicio",
  endPlaceholder = "Fecha fin",
  disabled = false,
  className,
}: DateRangePickerProps) {
  // Convertir strings a Date
  const startDateValue = React.useMemo(() => {
    if (!startDate) return undefined
    if (startDate instanceof Date) return startDate
    const parsed = new Date(startDate)
    return isNaN(parsed.getTime()) ? undefined : parsed
  }, [startDate])

  const endDateValue = React.useMemo(() => {
    if (!endDate) return undefined
    if (endDate instanceof Date) return endDate
    const parsed = new Date(endDate)
    return isNaN(parsed.getTime()) ? undefined : parsed
  }, [endDate])

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      <DatePicker
        value={startDateValue}
        onChange={onStartDateChange}
        placeholder={startPlaceholder}
        disabled={disabled}
        maxDate={endDateValue}
      />
      <DatePicker
        value={endDateValue}
        onChange={onEndDateChange}
        placeholder={endPlaceholder}
        disabled={disabled}
        minDate={startDateValue}
      />
    </div>
  )
}

// Input compatible con formularios (devuelve string en formato ISO)
interface DateInputProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  allowClear?: boolean
}

export function DateInput({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className,
  allowClear = true,
}: DateInputProps) {
  const handleChange = (date: Date | undefined) => {
    if (date) {
      // Formato YYYY-MM-DD para compatibilidad con inputs type="date"
      onChange(format(date, "yyyy-MM-dd"))
    } else {
      onChange("")
    }
  }

  return (
    <DatePicker
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      allowClear={allowClear}
    />
  )
}
