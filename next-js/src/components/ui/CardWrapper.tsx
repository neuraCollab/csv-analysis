import { cn } from "@/lib/utils";
import { FC, ReactNode } from "react";

interface CustomCardProps {
  className?: string;
  children: ReactNode;
}

export const CustomCard: FC<CustomCardProps> = ({ className, children }) => {
  return <div className={cn("bg-white shadow-md rounded-lg p-4", className)}>{children}</div>;
};

interface CustomCardContentProps {
  className?: string;
  children: ReactNode;
}

export const CustomCardContent: FC<CustomCardContentProps> = ({ className, children }) => {
  return <div className={cn("p-2", className)}>{children}</div>;
};
