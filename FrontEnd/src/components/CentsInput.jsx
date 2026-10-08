import { useLayoutEffect, useRef } from 'react';
import { Input } from 'antd';
import { formatCentsInput, parsePastedAmount } from '../helpers/amount-input.mjs';

const CentsInput = ({ value = '', onChange, ...props }) => {
  const input = useRef(null);
  useLayoutEffect(() => {
    const element = input.current?.input;
    if (element && document.activeElement === element) element.setSelectionRange(value.length, value.length);
  }, [value]);
  return (
    <Input
      {...props}
      ref={input}
      value={value}
      prefix="$"
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
