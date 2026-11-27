import React from 'react';
import clsx from 'clsx';

interface FormFieldProps {
  label: string;
  name: string;
  unit?: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea';
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  disabled?: boolean;
  className?: string;
  readOnly?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  unit,
  type = 'text',
  value,
  onChange,
  options,
  placeholder,
  required,
  error,
  helperText,
  min,
  max,
  step,
  disabled,
  className,
  readOnly,
}) => {
  const inputBaseStyle = clsx(
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    error ? 'border-red-400 bg-red-50/20 text-red-900' : 'border-slate-300 hover:border-slate-400',
    disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : '',
    unit ? 'pr-14' : ''
  );

  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <label htmlFor={name} className="flex items-center justify-between text-xs font-semibold text-slate-700">
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        {unit && <span className="text-[11px] font-normal text-slate-400">({unit})</span>}
      </label>

      <div className="relative">
        {type === 'select' ? (
          <select
            id={name}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            disabled={disabled}
            className={inputBaseStyle}
          >
            {options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            rows={3}
            className={inputBaseStyle}
          />
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            value={value ?? ''}
            onChange={onChange}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            readOnly={readOnly}
            className={inputBaseStyle}
          />
        )}

        {unit && type !== 'select' && type !== 'textarea' && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-slate-400">
            {unit}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-600 mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};
