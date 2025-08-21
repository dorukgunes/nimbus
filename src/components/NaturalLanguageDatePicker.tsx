import React, { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import * as chrono from 'chrono-node';
import { DateRangePicker } from './DateRangePicker';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface NaturalLanguageDatePickerProps {
  value?: string;
  onChange: (range: DateRange, raw: string) => void;
  onEnter?: () => void;
  placeholder?: string;
}

export const NaturalLanguageDatePicker: React.FC<NaturalLanguageDatePickerProps> = ({
  value = '',
  onChange,
  onEnter,
  placeholder = 'e.g. last 2 days',
}) => {
  const [input, setInput] = useState(value);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    if (value) {
      console.log('value', value);
      handleInputChange({ target: { value: value } } as React.ChangeEvent<HTMLInputElement>);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    const parsed = chrono.parse(val);
    if (parsed.length > 0) {
      const { start, end } = parsed[0];
      const startDate = start ? start.date() : null;
      const endDate = end ? end.date() : null;
      // Log human-readable dates
      console.log('Parsed range:', {
        start: startDate ? startDate.toLocaleString() : null,
        end: endDate ? endDate.toLocaleString() : null,
      });
      onChange({
        start: startDate,
        end: endDate,
      }, val);
    } else {
      onChange({ start: null, end: null }, val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onEnter) {
      onEnter();
    }
  };

  return (
    <div className="flex items-center border-l rounded-md px-2 py-1 bg-background">
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="bg-transparent outline-none flex-1 px-2 py-1 text-sm"
      />
      <DateRangePicker
        onChange={onChange}
        trigger={
          <div className="ml-2 p-1 hover:bg-muted rounded cursor-pointer">
            <CalendarClock className="w-4 h-4 text-muted-foreground" />
          </div>
        }
      />
    </div>
  );
}; 