import { cn } from "@/lib/cn";
import { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return <input ref={ref} className={cn("input", className)} {...props} />;
});
Input.displayName = "Input";
