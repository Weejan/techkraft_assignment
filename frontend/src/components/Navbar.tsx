import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, Typography, Button, Chip, Divider } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

// Shared container — used by Navbar AND all pages so everything lines up
export const CONTAINER_SX = {
  width: "100%",
  maxWidth: "1280px",
  mx: "auto",
  px: { xs: 2, sm: 4, md: 6 },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        bgcolor: "rgba(250,250,250,0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #e5e5e5",
      }}
    >
      <Box
        sx={{
          ...CONTAINER_SX,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              bgcolor: "#0a0a0a",
              borderRadius: "7px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.78rem",
                letterSpacing: "-0.02em",
              }}
            >
              T
            </Typography>
          </Box>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "0.95rem",
              color: "#0a0a0a",
              letterSpacing: "-0.02em",
            }}
          >
            TechKraft
          </Typography>
        </Link>

        {/* Right side */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {user && (
            <>
              <Typography
                sx={{
                  color: "#737373",
                  fontSize: "0.78rem",
                  display: { xs: "none", sm: "block" },
                }}
              >
                {user.email}
              </Typography>
              <Chip
                label={user.role}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  bgcolor: "#0a0a0a",
                  color: "#fff",
                  textTransform: "capitalize",
                  borderRadius: "5px",
                }}
              />
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: "#e5e5e5", my: 1.5 }}
              />
            </>
          )}
          <Button
            size="small"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            sx={{
              fontSize: "0.78rem",
              color: "#737373",
              minWidth: "auto",
              px: 0.5,
              "&:hover": { color: "#0a0a0a", bgcolor: "transparent" },
            }}
            endIcon={<LogoutIcon sx={{ fontSize: "14px !important" }} />}
          >
            Sign out
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
