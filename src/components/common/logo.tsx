"use client";

import Link from "next/link";
import { CheckSquare } from "lucide-react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
  showText?: boolean;
}

export function Logo({ className = "", size = "md", href = "/", showText = true }: LogoProps) {
  const iconSizes = {
    sm: "size-6",
    md: "size-8",
    lg: "size-10",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
  };

  const content = (
    <div className={`inline-flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      <div
        className={`${iconSizes[size]} rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/30`}
      >
        <CheckSquare className="size-4/6 stroke-[2.4]" />
      </div>
      {showText && (
        <span className={`${textSizes[size]} font-extrabold text-foreground tracking-tight`}>
          Sprintly<span className="text-primary">.</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
