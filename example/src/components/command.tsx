import { Command as CommandPrimitive } from "kit-cmd";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-6 w-6 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-16 w-full rounded-md bg-transparent py-3 text-lg outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("h-[500px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
));

const CommandView = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.View>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.View>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.View
    ref={ref}
    className={cn("h-[500px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
));

const CommandFooter = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Footer>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Footer>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Footer
    ref={ref}
    className={cn(
      "w-full h-10 p-2 flex justify-between items-center border-t",
      className
    )}
    {...props}
  />
));

export { Command, CommandInput, CommandList, CommandView, CommandFooter };
