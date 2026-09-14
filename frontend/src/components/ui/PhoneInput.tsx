import { forwardRef, type ChangeEvent } from "react";
import { Input } from "./Input";

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

interface PhoneInputProps
  extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
  onChange: (value: string) => void;
  value?: string;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ onChange, value = "", ...props }, ref) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange(formatPhone(e.target.value));
    };

    return (
      <Input
        ref={ref}
        value={formatPhone(value)}
        onChange={handleChange}
        placeholder="(00) 00000-0000"
        maxLength={15}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput, formatPhone };
