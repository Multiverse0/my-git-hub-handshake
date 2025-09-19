import * as React from "react"
import { format, parse } from "date-fns"
import { nb } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

interface DatePickerProps {
  value?: string
  onChange?: (date: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Velg en dato",
  disabled = false,
  className
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  // Parse the Norwegian date format to Date object
  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined
    
    // Handle ISO format (YYYY-MM-DD)
    if (dateStr.includes('-') && dateStr.length === 10) {
      return new Date(dateStr)
    }
    
    // Handle Norwegian format (DD.MM.YYYY)
    if (dateStr.includes('.')) {
      try {
        return parse(dateStr, 'dd.MM.yyyy', new Date())
      } catch {
        return undefined
      }
    }
    
    return undefined
  }
  
  const selectedDate = parseDate(value || '')
  
  const handleSelect = (date: Date | undefined) => {
    if (date && onChange) {
      const formattedDate = format(date, 'dd.MM.yyyy', { locale: nb })
      onChange(formattedDate)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-muted text-foreground border-border hover:bg-muted/80",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "dd.MM.yyyy", { locale: nb }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  )
}