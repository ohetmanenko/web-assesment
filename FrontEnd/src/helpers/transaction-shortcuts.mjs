export const transactionShortcut = event => {
  if (event.defaultPrevented || event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey)
    return null;
  if (
    event.target?.closest?.(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="menu"], [role="dialog"]'
    )
  )
    return null;
  if (event.key === '-' || event.key === '_') return 'expense';
  if (event.key === '+' || event.key === '=') return 'income';
  return null;
};
