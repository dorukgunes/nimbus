import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PowerIcon, PencilIcon } from "lucide-react";
import { AWSConnection } from "@/types/aws";
import { useNavigate } from "react-router-dom";

interface DashboardFooterProps {
  connection: AWSConnection;
}

export const DashboardFooter: React.FC<DashboardFooterProps> = ({
  connection,
}) => {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="flex focus:outline-none w-min-max bg-background fixed right-0 bottom-0 left-0 z-10 h-8 cursor-pointer items-center border-t px-4 select-none"
          aria-label="Open connection menu"
          tabIndex={0}
        >
          <div className="flex items-center gap-2">
            {/* TODO: Check connection status and show the color based on that */}
            <div className={`w-2 h-2 rounded-full ${connection.status === 'expired' ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <div className="text-muted-foreground text-sm">
              {connection.name}
            </div>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent alignOffset={10} className="w-56" align="start">
        <DropdownMenuItem onClick={() => navigate("/")}>
          <PowerIcon className="h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/?connectionId=${connection.id}`)}>
          <PencilIcon className="h-4 w-4" />
          Edit Connection
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
