import type { ChangeEvent } from 'react';

type BaseFieldProps = {
  label: string;
  name: string;
  value: string;
  error?: string;
  required?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
};

type InputFieldProps = BaseFieldProps & {
  type?: string;
  placeholder?: string;
};

type SelectFieldProps = BaseFieldProps & {
  options: string[];
};

type CheckboxGroupProps = {
  label: string;
  options: string[];
  value: string[];
  onChange: (nextValue: string[]) => void;
};

export function InputField({
  label,
  name,
  value,
  error,
  required,
  onChange,
  type = 'text',
  placeholder,
}: InputFieldProps) {
  return (
    <label className="form-field">
      <span>
        {label}
        {required ? <em>*</em> : null}
      </span>
      <input
        name={name}
        value={value}
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={onChange}
      />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}

export function DateField(props: Omit<InputFieldProps, 'type'>) {
  return <InputField {...props} type="date" />;
}

export function SelectField({
  label,
  name,
  value,
  error,
  required,
  onChange,
  options,
}: SelectFieldProps) {
  return (
    <label className="form-field">
      <span>
        {label}
        {required ? <em>*</em> : null}
      </span>
      <select name={name} value={value} aria-invalid={Boolean(error)} onChange={onChange}>
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}

export function TextareaField({ label, name, value, error, onChange, placeholder }: InputFieldProps) {
  return (
    <label className="form-field form-field-full">
      <span>{label}</span>
      <textarea name={name} value={value} placeholder={placeholder} aria-invalid={Boolean(error)} onChange={onChange} />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}

export function CheckboxGroup({ label, options, value, onChange }: CheckboxGroupProps) {
  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
      return;
    }

    onChange([...value, option]);
  };

  return (
    <fieldset className="checkbox-group">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <label key={option}>
            <input
              type="checkbox"
              checked={value.includes(option)}
              onChange={() => toggleOption(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
