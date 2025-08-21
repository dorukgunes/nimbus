import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select option...",
  disabled = false,
  className,
}: SelectProps) {
  const selectedOption = options.find(option => option.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={false}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full min-w-[8rem]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onValueChange?.(option.value)}
            className="cursor-pointer"
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                value === option.value ? "opacity-100" : "opacity-0"
              )}
            />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { Select as SelectTrigger, Select as SelectValue, Select as SelectContent, Select as SelectItem } 