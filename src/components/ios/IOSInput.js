import React, { memo, forwardRef, useState } from 'react';
import './IOSInput.css';

/**
 * Input estilo iOS con animaciones y feedback
 */
const IOSInput = memo(forwardRef(({ 
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  clearable = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleChange = (e) => {
    setHasValue(!!e.target.value);
    onChange?.(e);
  };

  const handleClear = () => {
    const event = { target: { value: '' } };
    setHasValue(false);
    onChange?.(event);
  };

  const containerClasses = [
    'ios-input-container',
    fullWidth && 'ios-input-full-width',
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'ios-input',
    isFocused && 'ios-input-focused',
    error && 'ios-input-error',
    disabled && 'ios-input-disabled',
    icon && iconPosition === 'left' && 'ios-input-with-icon-left',
    (clearable && hasValue) && 'ios-input-with-clear'
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label className={`ios-input-label ${isFocused || hasValue ? 'ios-input-label-float' : ''}`}>
          {label}
        </label>
      )}
      
      <div className="ios-input-wrapper">
        {icon && iconPosition === 'left' && (
          <span className="ios-input-icon ios-input-icon-left">
            {icon}
          </span>
        )}
        
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          {...props}
        />
        
        {clearable && hasValue && !disabled && (
          <button
            type="button"
            className="ios-input-clear"
            onClick={handleClear}
            aria-label="Clear"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0C4.47 0 0 4.47 0 10s4.47 10 10 10 10-4.47 10-10S15.53 0 10 0zm5 13.59L13.59 15 10 11.41 6.41 15 5 13.59 8.59 10 5 6.41 6.41 5 10 8.59 13.59 5 15 6.41 11.41 10 15 13.59z"/>
            </svg>
          </button>
        )}
        
        {icon && iconPosition === 'right' && !clearable && (
          <span className="ios-input-icon ios-input-icon-right">
            {icon}
          </span>
        )}
        
        <div className="ios-input-focus-ring"></div>
      </div>
      
      {(error || helperText) && (
        <div className={`ios-input-helper ${error ? 'ios-input-helper-error' : ''}`}>
          {error || helperText}
        </div>
      )}
    </div>
  );
}));

IOSInput.displayName = 'IOSInput';

export default IOSInput;
