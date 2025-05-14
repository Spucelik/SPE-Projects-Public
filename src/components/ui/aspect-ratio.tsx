import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"
import * as React from "react"

const AspectRatio = React.forwardRef<
  React.ElementRef<typeof AspectRatioPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root>
>(({ children, ...props }, ref) => {
  // Safely handle children to prevent object rendering issues
  const safeChildren = React.useMemo(() => {
    // If children is null or undefined, return null
    if (children == null) return null;
    // Otherwise return as is
    return children;
  }, [children]);

  return (
    <AspectRatioPrimitive.Root
      ref={ref}
      {...props}
    >
      {safeChildren}
    </AspectRatioPrimitive.Root>
  );
});

AspectRatio.displayName = "AspectRatio";

export { AspectRatio }
