'use client';

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimePickerProps {
  value: string; // e.g., "02:30 PM"
  onChange: (value: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [hour, minute, period] = React.useMemo(() => {
    if (!value) return ['12', '00', 'PM'];
    const [time, Tperiod] = value.split(' ');
    const [Thour, Tminute] = time.split(':');
    return [Thour, Tminute, Tperiod];
  }, [value]);

  const handleValueChange = (part: 'hour' | 'minute' | 'period', val: string) => {
    let newHour = hour, newMinute = minute, newPeriod = period;
    if (part === 'hour') newHour = val;
    if (part === 'minute') newMinute = val;
    if (part === 'period') newPeriod = val;
    onChange(`${newHour}:${newMinute} ${newPeriod}`);
  };

  return (
    <div className="flex items-center gap-2">
       <Select value={hour} onValueChange={(v) => handleValueChange('hour', v)}>
          <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="Hora" />
          </SelectTrigger>
          <SelectContent>
              {Array.from({ length: 12 }, (_, i) => `${i + 1}`.padStart(2, '0')).map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
          </SelectContent>
      </Select>
      <span>:</span>
       <Select value={minute} onValueChange={(v) => handleValueChange('minute', v)}>
           <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent>
             {['00', '05','10', '15', '20', '25','30', '35','40', '45','50', '55'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
      </Select>
       <Select value={period} onValueChange={(v) => handleValueChange('period', v)}>
           <SelectTrigger className="w-[75px]">
              <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
      </Select>
    </div>
  );
}
