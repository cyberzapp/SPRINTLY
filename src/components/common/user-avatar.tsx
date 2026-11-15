"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  photoURL?: string | null;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

export function UserAvatar({ name, photoURL, className = "", size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    xs: "size-5 text-[10px]",
    sm: "size-7 text-xs",
    md: "size-8 text-xs",
    lg: "size-10 text-sm font-medium",
  };

  return (
    <Avatar className={`${sizeClasses[size]} ring-1 ring-border shrink-0 ${className}`}>
      {photoURL && <AvatarImage src={photoURL} alt={name || "User"} />}
      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
