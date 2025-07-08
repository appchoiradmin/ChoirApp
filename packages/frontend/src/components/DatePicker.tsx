import React from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ selected, onChange, minDate, maxDate, className }) => {
  return (
    <ReactDatePicker
      selected={selected}
      onChange={onChange}
      minDate={minDate}
      maxDate={maxDate}
      dateFormat="yyyy-MM-dd"
      className={className}
      placeholderText="Select date"
      todayButton="Today"
      showPopperArrow={false}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
    />
  );
};

export default DatePicker;
