import React from "react";
import DragWindowRegion from "@/components/DragWindowRegion";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <DragWindowRegion />
      <main className="flex-1 overflow-auto bg-gray-100">{children}</main>
    </div>
  );
}
