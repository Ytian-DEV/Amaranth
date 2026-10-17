export type Errors<K extends string> = Partial<Record<K, string>>;

export const isEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());

type Rule = { required?: boolean; email?: boolean; min?: number; max?: number; label: string };

/** Validates a flat form object; messages match the database RPC checks. */
export function validate<K extends string>(values: Record<K, string>, rules: Partial<Record<K, Rule>>): Errors<K> {
  const errors: Errors<K> = {};
  for (const key of Object.keys(rules) as K[]) {
    const rule = rules[key]!;
    const value = (values[key] ?? '').trim();
    if (rule.required && !value) errors[key] = `${rule.label} is required.`;
    else if (value && rule.email && !isEmail(value)) errors[key] = 'Please enter a valid email address.';
    else if (value && rule.min && value.length < rule.min) errors[key] = `${rule.label} needs at least ${rule.min} characters.`;
    else if (value && rule.max && value.length > rule.max) errors[key] = `${rule.label} must be at most ${rule.max} characters.`;
  }
  return errors;
}

export const hasErrors = (errors: object) => Object.keys(errors).length > 0;

/** After a failed submit, move focus to the first invalid control. */
export function focusFirstError(form: HTMLFormElement | null) {
  requestAnimationFrame(() => {
    form?.querySelector<HTMLElement>('[aria-invalid="true"], input[type="checkbox"][data-invalid="true"]')?.focus();
  });
}
