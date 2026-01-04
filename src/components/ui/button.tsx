"use client";
import { cn } from "@/lib/cn";
import { forwardRef } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "btn",
          variant === "primary" && "bg-primary text-white shadow hover:brightness-110",
          variant === "ghost" && "bg-transparent text-foreground hover:bg-slate-100 dark:hover:bg-slate-800",
          variant === "outline" && "border border-border bg-card text-foreground hover:border-primary",
          size === "sm" && "px-3 py-1.5 text-xs",
          size === "lg" && "px-5 py-3 text-base",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
