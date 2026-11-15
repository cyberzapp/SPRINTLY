"use client";

import React from "react";
// Lucide React Icons
import {
  Rocket,
  Palette,
  Smartphone,
  Compass,
  TrendingUp,
  Wrench,
  FlaskConical,
  Megaphone,
  Lightbulb,
  FolderGit2,
  Globe,
  Zap,
  Folder,
} from "lucide-react";
// MUI Icons
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import ExploreIcon from "@mui/icons-material/Explore";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BuildIcon from "@mui/icons-material/Build";
import ScienceIcon from "@mui/icons-material/Science";
import CampaignIcon from "@mui/icons-material/Campaign";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import FolderSpecialIcon from "@mui/icons-material/FolderSpecial";
import PublicIcon from "@mui/icons-material/Public";
import BoltIcon from "@mui/icons-material/Bolt";
import FolderIcon from "@mui/icons-material/Folder";

export type IconKey =
  | "rocket"
  | "palette"
  | "smartphone"
  | "compass"
  | "trending"
  | "wrench"
  | "science"
  | "megaphone"
  | "lightbulb"
  | "folder"
  | "globe"
  | "zap";

export const PROJECT_ICON_KEYS: IconKey[] = [
  "rocket",
  "palette",
  "smartphone",
  "compass",
  "trending",
  "wrench",
  "science",
  "megaphone",
  "lightbulb",
  "folder",
  "globe",
  "zap",
];

interface ProjectIconProps {
  name?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
  useMui?: boolean;
}

export function ProjectIcon({
  name,
  className = "",
  size = "md",
  useMui = false,
}: ProjectIconProps) {
  const sizeMap = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  };

  const key = (name || "folder").toLowerCase() as IconKey;

  if (useMui) {
    const muiSize = size === "sm" ? "small" : size === "lg" ? "large" : "medium";
    switch (key) {
      case "rocket":
        return <RocketLaunchIcon fontSize={muiSize} className={className} />;
      case "palette":
        return <ColorLensIcon fontSize={muiSize} className={className} />;
      case "smartphone":
        return <PhoneIphoneIcon fontSize={muiSize} className={className} />;
      case "compass":
        return <ExploreIcon fontSize={muiSize} className={className} />;
      case "trending":
        return <TrendingUpIcon fontSize={muiSize} className={className} />;
      case "wrench":
        return <BuildIcon fontSize={muiSize} className={className} />;
      case "science":
        return <ScienceIcon fontSize={muiSize} className={className} />;
      case "megaphone":
        return <CampaignIcon fontSize={muiSize} className={className} />;
      case "lightbulb":
        return <LightbulbIcon fontSize={muiSize} className={className} />;
      case "globe":
        return <PublicIcon fontSize={muiSize} className={className} />;
      case "zap":
        return <BoltIcon fontSize={muiSize} className={className} />;
      default:
        return <FolderIcon fontSize={muiSize} className={className} />;
    }
  }

  // Lucide React fallback
  const iconClass = `${sizeMap[size]} ${className}`;

  switch (key) {
    case "rocket":
      return <Rocket className={iconClass} />;
    case "palette":
      return <Palette className={iconClass} />;
    case "smartphone":
      return <Smartphone className={iconClass} />;
    case "compass":
      return <Compass className={iconClass} />;
    case "trending":
      return <TrendingUp className={iconClass} />;
    case "wrench":
      return <Wrench className={iconClass} />;
    case "science":
      return <FlaskConical className={iconClass} />;
    case "megaphone":
      return <Megaphone className={iconClass} />;
    case "lightbulb":
      return <Lightbulb className={iconClass} />;
    case "globe":
      return <Globe className={iconClass} />;
    case "zap":
      return <Zap className={iconClass} />;
    default:
      return <Folder className={iconClass} />;
  }
}
