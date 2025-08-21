import React, { useState, useCallback, useEffect } from 'react';
import { cn } from "@/utils/tailwind";

interface ResizableSidebarProps {
  children: React.ReactNode;
  minWidth?: number;
  defaultWidth?: number;
  className?: string;
}

export const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  children,
  minWidth = 300,
  defaultWidth = 300,
  className,
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    setStartX(e.pageX);
    setStartWidth(width);
    e.preventDefault();
  };

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const newWidth = startWidth + (e.pageX - startX);
    if (newWidth >= minWidth) {
      setWidth(newWidth);
    }
  }, [isResizing, minWidth, startWidth, startX]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={cn("relative min-w-0", className)}
      style={{ width: width }}
    >
      {children}
      <div
        className={cn(
          "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-accent",
          isResizing && "bg-accent"
        )}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}; 