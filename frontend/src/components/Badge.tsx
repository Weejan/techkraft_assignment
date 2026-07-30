import React from "react";
import { Chip, Rating } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

interface BadgeProps {
  status: "new" | "reviewed" | "hired" | "rejected" | string;
}

const STATUS_MAP: Record<string, { label: string; sx: object }> = {
  new: {
    label: "New",
    sx: { bgcolor: "#0a0a0a", color: "#fff", borderRadius: "5px" },
  },
  reviewed: {
    label: "Reviewed",
    sx: {
      bgcolor: "#f5f5f5",
      color: "#525252",
      border: "1px solid #e5e5e5",
      borderRadius: "5px",
    },
  },
  hired: {
    label: "Hired",
    sx: {
      bgcolor: "#f0fdf4",
      color: "#166534",
      border: "1px solid #bbf7d0",
      borderRadius: "5px",
    },
  },
  rejected: {
    label: "Rejected",
    sx: {
      bgcolor: "#fef2f2",
      color: "#991b1b",
      border: "1px solid #fecaca",
      borderRadius: "5px",
    },
  },
};

const Badge = ({ status }: BadgeProps) => {
  const item = STATUS_MAP[status] || {
    label: status,
    sx: { bgcolor: "#f5f5f5", color: "#525252", borderRadius: "5px" },
  };

  return (
    <Chip
      label={item.label}
      size="small"
      sx={{ height: 21, fontSize: "0.68rem", fontWeight: 600, ...item.sx }}
    />
  );
};

export default Badge;

interface StarsProps {
  score: number;
  max?: number;
}

export const Stars = ({ score, max = 5 }: StarsProps) => {
  return (
    <Rating
      value={score}
      max={max}
      readOnly
      size="small"
      icon={<StarIcon sx={{ color: "#0a0a0a", fontSize: "14px" }} />}
      emptyIcon={<StarBorderIcon sx={{ color: "#d4d4d4", fontSize: "14px" }} />}
    />
  );
};
