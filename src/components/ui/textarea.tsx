import { cn } from "@/lib/cn";
import { forwardRef } from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(({ className, ...props }, ref) => {
  return <textarea ref={ref} className={cn("input min-h-[120px]", className)} {...props} />;
});
Textarea.displayName = "Textarea";
