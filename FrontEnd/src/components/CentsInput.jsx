import { useEffect, useLayoutEffect, useRef } from 'react';
import { Input } from 'antd';
import { formatCentsInput, parsePastedAmount } from '../helpers/amount-input.mjs';

const CentsInput = ({ value = '', onChange, direction = 'expense', autoFocus = false, ...props }) => {
  const input = useRef(null);
  useEffect(() => {
    if (autoFocus) input.current?.focus({ cursor: 'end' });
  }, [autoFocus]);
  useLayoutEffect(() => {
    const element = input.current?.input;
    if (element && document.activeElement === element) element.setSelectionRange(value.length, value.length);
  }, [value]);
  return (
    <Input
      {...props}
      ref={input}
      value={value}
      prefix={
        <span className={'amount-input-prefix ' + direction} aria-hidden="true">
          {direction === 'income' ? '+ $' : '− $'}
        </span>
      }
      inputMode="numeric"
      autoComplete="off"
      onChange={event => onChange?.(formatCentsInput(event.target.value, value))}
      onPaste={event => {
        event.preventDefault();
        onChange?.(parsePastedAmount(event.clipboardData.getData('text'), value));
      }}
    />
  );
};

export default CentsInput;
