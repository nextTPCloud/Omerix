"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

// PROVIDER
export function ToastProvider({ children }) {
  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {children}
      <ToastViewport />
    </ToastPrimitive.Provider>
  );
}

// VIEWPORT
const ToastViewport = React.forwardRef((props, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    {...props}
    className={cn(
      "fixed top-4 right-4 z-[100] flex max-h-screen w-96 flex-col gap-2 outline-none"
    )}
  />
));
ToastViewport.displayName = "ToastViewport";

// ROOT
const Toast = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
  return (
    <ToastPrimitive.Root
      ref={ref}
      {...props}
      className={cn(
        "group relative flex w-full items-start gap-4 rounded-md border bg-background p-4 shadow-lg ring-offset-background transition-all",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:fade-in-80",
        "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[100%]",
        // VARIANT COLORS
        variant === "success" && "border-green-600 text-green-700 bg-green-50",
        variant === "error" && "border-red-600 text-red-700 bg-red-50",
        variant === "warning" && "border-yellow-600 text-yellow-700 bg-yellow-50",
        variant === "info" && "border-blue-600 text-blue-700 bg-blue-50",
        variant === "default" && "border-primary",
        className
      )}
    />
  );
});
Toast.displayName = "Toast";

// ICON BY VARIANT
function ToastIcon({ variant }) {
  switch (variant) {
    case "success":
      return <CheckCircle className="h-5 w-5" />;
    case "error":
      return <XCircle className="h-5 w-5" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5" />;
    case "info":
      return <Info className="h-5 w-5" />;
    default:
      return null;
  }
}

// TITLE
const ToastTitle = React.forwardRef((props, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    {...props}
    className={cn("text-sm font-semibold flex items-center gap-2")}
  />
));
ToastTitle.displayName = "ToastTitle";

// DESCRIPTION
const ToastDescription = React.forwardRef((props, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    {...props}
    className={cn("text-sm opacity-80")}
  />
));
ToastDescription.displayName = "ToastDescription";

// CLOSE BUTTON
const ToastClose = React.forwardRef((props, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    {...props}
    className={cn(
      "absolute right-3 top-3 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
    )}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
));
ToastClose.displayName = "ToastClose";

export { Toast, ToastTitle, ToastDescription, ToastClose, ToastIcon };