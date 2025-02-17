import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"


const TabsVertical = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    orientation="vertical"
    className={cn(
      //TX CUSTOM: the enture root was just routed from radix
      'flex flex-row',
      className
    )}
    {...props}
  />
))
TabsVertical.displayName = TabsPrimitive.Root.displayName


const TabsVerticalList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      'flex-col h-max', //TX CUSTOM: removed h-10
      className
    )}
    {...props}
  />
))
TabsVerticalList.displayName = TabsPrimitive.List.displayName

const TabsVerticalTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      'w-full', //TX CUSTOM
      className
    )}
    {...props}
  />
))
TabsVerticalTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsVerticalContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "ml-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full",
      className
    )}
    {...props}
  />
))
TabsVerticalContent.displayName = TabsPrimitive.Content.displayName

export { TabsVertical, TabsVerticalList, TabsVerticalTrigger, TabsVerticalContent }
