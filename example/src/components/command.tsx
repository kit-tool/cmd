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

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[kit-cmd-group-heading]]:px-2 [&_[kit-cmd-group-heading]]:py-1.5 [&_[kit-cmd-group-heading]]:text-xs [&_[kit-cmd-group-heading]]:font-medium [&_[kit-cmd-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

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
