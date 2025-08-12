
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DateFormatter } from "react-day-picker"
import { format } from 'date-fns';

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  withTime?: boolean;
};

const formatCaption: DateFormatter = (month, options) => {
  return <>{format(month, 'LLLL yyyy', { locale: options?.locale })}</>;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  withTime = false,
  ...props
}: CalendarProps) {
  const [month, setMonth] = React.useState(props.month || props.defaultMonth || new Date());
  
  const handleTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'hours' | 'minutes'
  ) => {
    if (!props.selected || !(props.selected instanceof Date)) return;
    const newDate = new Date(props.selected.getTime());
    const value = parseInt(e.target.value, 10);
    if (type === 'hours') newDate.setHours(value);
    if (type === 'minutes') newDate.setMinutes(value);
    
    if (props.onSelect && typeof props.onSelect === 'function') {
      const event = new MouseEvent('click') as unknown as React.MouseEvent<HTMLButtonElement, MouseEvent>;
      const modifiers = {};
      props.onSelect(newDate, newDate, modifiers as any, event);
    }
  };
  
  const selectedDate = props.selected instanceof Date ? props.selected : new Date();

  return (
    <div>
    <DayPicker
      month={month}
      onMonthChange={setMonth}
      formatters={{ formatCaption }}
      captionLayout="dropdown-buttons"
      fromYear={new Date().getFullYear() - 5}
      toYear={new Date().getFullYear() + 5}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium hidden",
        caption_dropdowns: "flex gap-2",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Dropdown: ({ value, onChange, children }) => {
          const options = React.Children.toArray(children) as React.ReactElement<React.HTMLProps<HTMLOptionElement>>[];
          const selected = options.find((child) => child.props.value === value);
          const handleChange = (newValue: string) => {
            const changeEvent = {
              target: { value: newValue },
            } as React.ChangeEvent<HTMLSelectElement>;
            onChange?.(changeEvent);
          };
          return (
            <Select
              value={value?.toString()}
              onValueChange={(newValue) => handleChange(newValue)}
            >
              <SelectTrigger className="w-[120px]">{selected?.props?.children}</SelectTrigger>
              <SelectContent>
                {options.map((option, id: number) => (
                  <SelectItem key={`${option.props.value}-${id}`} value={option.props.value?.toString() ?? ""}>
                    {option.props.children}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        },
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
    {withTime && props.mode === 'single' && props.selected instanceof Date && (
        <div className="p-3 border-t flex items-center justify-center gap-2">
          <input type="range" min="0" max="23" value={selectedDate.getHours()} onChange={(e) => handleTimeChange(e, 'hours')} className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
          <span>:</span>
          <input type="range" min="0" max="59" step="5" value={selectedDate.getMinutes()} onChange={(e) => handleTimeChange(e, 'minutes')} className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
          <div className="ml-2 tabular-nums">
            {format(selectedDate, 'HH:mm')}
          </div>
        </div>
      )}
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
