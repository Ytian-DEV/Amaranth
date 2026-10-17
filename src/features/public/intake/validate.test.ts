import { hasErrors, isEmail, validate } from './validate';

describe('validate', () => {
  it('checks required, email and length', () => {
    const errors = validate(
      { name: ' ', email: 'nope', title: 'ab' },
      {
        name: { label: 'Name', required: true },
        email: { label: 'Email', required: true, email: true },
        title: { label: 'Title', required: true, min: 3 },
      },
    );
    expect(errors).toEqual({
      name: 'Name is required.',
      email: 'Please enter a valid email address.',
      title: 'Title needs at least 3 characters.',
    });
    expect(hasErrors(errors)).toBe(true);
  });

  it('passes valid input', () => {
    expect(validate({ email: 'ana@vsu.edu.ph' }, { email: { label: 'Email', email: true } })).toEqual({});
    expect(isEmail('a@b.co')).toBe(true);
  });
});
