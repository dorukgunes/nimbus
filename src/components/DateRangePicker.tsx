import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange, raw: string) => void;
  trigger?: React.ReactNode;
}

type TimeUnit = 'minutes' | 'hours' | 'days' | 'weeks';

const PREDEFINED_TIMES = {
  minutes: [5, 10, 15, 30, 45],
  hours: [1, 2, 3, 6, 8, 12],
  days: [1, 2, 3, 4, 5, 6],
  weeks: [1, 2, 3, 4],
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  trigger,
}) => {
  const [mode, setMode] = useState<'absolute' | 'relative'>('relative');
  const [duration, setDuration] = useState('2');
  const [unit, setUnit] = useState<TimeUnit>('hours');
  const [selectedPredefined, setSelectedPredefined] = useState<{ unit: TimeUnit; value: number } | null>({ unit: 'hours', value: 2 });
  const [open, setOpen] = useState(false);

  const handlePredefinedClick = (unit: TimeUnit, value: number) => {
    setSelectedPredefined({ unit, value });
    setDuration(value.toString());
    setUnit(unit);
    applyRelativeTime(value, unit);
  };

  const applyRelativeTime = (durationValue: number, timeUnit: TimeUnit) => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);

    switch (timeUnit) {
      case 'minutes':
        start.setMinutes(start.getMinutes() - durationValue);
        break;
      case 'hours':
        start.setHours(start.getHours() - durationValue);
        break;
      case 'days':
        start.setDate(start.getDate() - durationValue);
        break;
      case 'weeks':
        start.setDate(start.getDate() - (durationValue * 7));
        break;
    }

    const range = { start, end };
    const raw = `last ${durationValue} ${timeUnit}`;
    onChange(range, raw);
  };

  const handleApply = () => {
    if (mode === 'relative') {
      const durationValue = parseInt(duration);
      if (!isNaN(durationValue) && durationValue > 0) {
        applyRelativeTime(durationValue, unit);
      }
    }
    setOpen(false);
  };

  const handleClear = () => {
    setDuration('2');
    setUnit('hours');
    setSelectedPredefined({ unit: 'hours', value: 2 });
    onChange({ start: null, end: null }, '');
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <Calendar className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          {/* Mode Selection Tabs */}
          <div className="flex border rounded-md">
            <button
              onClick={() => setMode('absolute')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-l-md transition-colors ${
                mode === 'absolute'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              Absolute
            </button>
            <button
              onClick={() => setMode('relative')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-r-md transition-colors ${
                mode === 'relative'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              }`}
            >
              Relative
            </button>
          </div>

          {mode === 'relative' && (
            <div className="space-y-4">
              {/* Predefined Time Units */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Minutes</label>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TIMES.minutes.map((value) => (
                      <Button
                        key={value}
                        variant={selectedPredefined?.unit === 'minutes' && selectedPredefined?.value === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePredefinedClick('minutes', value)}
                        className="h-8 px-3"
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Hours</label>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TIMES.hours.map((value) => (
                      <Button
                        key={value}
                        variant={selectedPredefined?.unit === 'hours' && selectedPredefined?.value === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePredefinedClick('hours', value)}
                        className="h-8 px-3"
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Days</label>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TIMES.days.map((value) => (
                      <Button
                        key={value}
                        variant={selectedPredefined?.unit === 'days' && selectedPredefined?.value === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePredefinedClick('days', value)}
                        className="h-8 px-3"
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Weeks</label>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TIMES.weeks.map((value) => (
                      <Button
                        key={value}
                        variant={selectedPredefined?.unit === 'weeks' && selectedPredefined?.value === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePredefinedClick('weeks', value)}
                        className="h-8 px-3"
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Duration Input */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Duration</label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="2"
                    className="w-full"
                    min="1"
                    max="9999"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Up to 4 digits.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Unit of time</label>
                  <Select
                    value={unit}
                    onValueChange={(value: string) => setUnit(value as TimeUnit)}
                    options={[
                      { value: 'minutes', label: 'Minutes' },
                      { value: 'hours', label: 'Hours' },
                      { value: 'days', label: 'Days' },
                      { value: 'weeks', label: 'Weeks' },
                    ]}
                    placeholder="Select unit"
                  />
                </div>
              </div>
            </div>
          )}

          {mode === 'absolute' && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>Absolute date picker coming soon...</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="ghost" onClick={handleClear} className="text-primary">
              Clear
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleApply} className="bg-orange-500 hover:bg-orange-600 text-white">
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}; 