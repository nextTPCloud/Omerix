"use client"

import * as React from "react"
import { format, parse, isValid, setMonth, setYear, startOfMonth, getYear, getMonth } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Nombres de meses en español
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// Generar rango de años (10 años atrás, 10 años adelante)
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)

interface DatePickerProps {
  value?: Date | string
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  allowClear?: boolean
  minDate?: Date
  maxDate?: Date
  allowManualInput?: boolean
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
  allowManualInput = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const [calendarMonth, setCalendarMonth] = React.useState<Date>(new Date())

  // Convertir string a Date si es necesario
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    // Parsear string ISO o formato YYYY-MM-DD
    const parsed = new Date(value)
    return isNaN(parsed.getTime()) ? undefined : parsed
  }, [value])

  // Sincronizar input con valor
  React.useEffect(() => {
    if (dateValue) {
      setInputValue(format(dateValue, 'dd/MM/yyyy'))
      setCalendarMonth(startOfMonth(dateValue))
    } else {
      setInputValue('')
    }
  }, [dateValue])

  const handleSelect = (date: Date | undefined) => {
    onChange(date)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
    setInputValue('')
  }

  // Manejar entrada manual
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)

    // Intentar parsear la fecha en varios formatos
    const formats = ['dd/MM/yyyy', 'dd-MM-yyyy', 'd/M/yyyy', 'd-M-yyyy']
    for (const fmt of formats) {
      const parsed = parse(val, fmt, new Date())
      if (isValid(parsed)) {
        // Validar contra min/max
        if (minDate && parsed < minDate) continue
        if (maxDate && parsed > maxDate) continue
        onChange(parsed)
        setCalendarMonth(startOfMonth(parsed))
        return
      }
    }
  }

  const handleInputBlur = () => {
    // Si el input no es válido, restaurar al valor actual
    if (dateValue) {
      setInputValue(format(dateValue, 'dd/MM/yyyy'))
    } else {
      setInputValue('')
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setOpen(false)
    }
  }

  // Ir a hoy
  const handleToday = () => {
    const today = new Date()
    if (minDate && today < minDate) return
    if (maxDate && today > maxDate) return
    onChange(today)
    setCalendarMonth(startOfMonth(today))
    setOpen(false)
  }

  // Cambiar mes
  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr)
    setCalendarMonth(prev => setMonth(prev, month))
  }

  // Cambiar año
  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr)
    setCalendarMonth(prev => setYear(prev, year))
  }

  // Navegar meses
  const handlePrevMonth = () => {
    setCalendarMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() - 1)
      return newDate
    })
  }

  const handleNextMonth = () => {
    setCalendarMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          {allowManualInput ? (
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                onClick={() => setOpen(true)}
                placeholder={placeholder}
                disabled={disabled}
                className="pl-9 pr-8"
              />
              {allowClear && dateValue && !disabled && (
                <X
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={handleClear}
                />
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateValue && "text-muted-foreground"
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
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {/* Cabecera con selectores de mes y año */}
        <div className="p-3 border-b space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-2 flex-1">
              <Select
                value={getMonth(calendarMonth).toString()}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="h-8 flex-1">
                  <SelectValue placeholder="Mes">
                    {MESES[getMonth(calendarMonth)]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((mes, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={getYear(calendarMonth).toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="h-8 w-[90px]">
                  <SelectValue placeholder="Año">
                    {getYear(calendarMonth)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Botón Hoy */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleToday}
          >
            Hoy
          </Button>
        </div>

        {/* Calendario */}
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          disabled={(date) => {
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
          initialFocus
          classNames={{
            month_caption: "hidden", // Ocultar caption ya que tenemos selectores personalizados
            nav: "hidden", // Ocultar navegación ya que tenemos la nuestra
          }}
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
  minDate?: Date
  maxDate?: Date
}

export function DateInput({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className,
  allowClear = true,
  minDate,
  maxDate,
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
      minDate={minDate}
      maxDate={maxDate}
    />
  )
}
