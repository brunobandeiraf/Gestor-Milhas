import { type LabelHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";

const Label = forwardRef<
  HTMLLabelElement,
  LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  return (
    <label
      className={cn("text-sm font-medium text-gray-700", className)}
      ref={ref}
      {...props}
    />
  );
});

Label.displayName = "Label";

export { Label };
