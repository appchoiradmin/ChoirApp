import React from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useTranslation } from '../hooks/useTranslation';

interface DatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ selected, onChange, minDate, maxDate, className }) => {
  const { t } = useTranslation();

  return (
    <ReactDatePicker
      selected={selected}
      onChange={onChange}
      minDate={minDate}
      maxDate={maxDate}
      dateFormat="yyyy-MM-dd"
      className={className}
      placeholderText={t('selectDate')}
      todayButton={t('today')}
      showPopperArrow={false}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
    />
  );
};

export default DatePicker;
