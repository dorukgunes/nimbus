import React, { type ReactNode } from "react";

interface DragWindowRegionProps {
  title?: ReactNode;
}

export default function DragWindowRegion({ title = "Nimbus" }: DragWindowRegionProps) {
  return (
    <div className="flex w-screen items-center justify-between relative h-10 px-4 border-b rounded-t-lg">
      <div className="draglayer w-full h-full absolute left-0 top-0 flex items-center justify-center pointer-events-auto">
        {title && (
          <div className="select-none whitespace-nowrap text-xs pointer-events-none">
            {title}
          </div>
        )}
      </div>
    </div>
  );
}
