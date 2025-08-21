import * as React from "react"
import { cn } from "@/utils/tailwind"

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: number[]) => void;
  value?: number[];
  max?: number;
  min?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, onValueChange, value = [0], max = 100, min = 0, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      if (onValueChange) {
        onValueChange([newValue]);
      }
    };

    return (
      <div className="relative flex w-full items-center">
        <input
          type="range"
          ref={ref}
          className={cn(
            "h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "slider",
            className
          )}
          value={value[0]}
          onChange={handleChange}
          max={max}
          min={min}
          step={step}
          {...props}
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
