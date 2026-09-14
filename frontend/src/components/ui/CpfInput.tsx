import { forwardRef, type ChangeEvent } from "react";
import { Input } from "./Input";

const formatCpf = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

interface CpfInputProps
  extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
  onChange: (value: string) => void;
  value?: string;
}

const CpfInput = forwardRef<HTMLInputElement, CpfInputProps>(
  ({ onChange, value = "", ...props }, ref) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange(formatCpf(e.target.value));
    };

    return (
      <Input
        ref={ref}
        value={formatCpf(value)}
        onChange={handleChange}
        placeholder="000.000.000-00"
        maxLength={14}
        {...props}
      />
    );
  }
);

CpfInput.displayName = "CpfInput";

export { CpfInput, formatCpf };
