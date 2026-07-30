import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api/client";
import {
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Box,
} from "@mui/material";

const loginSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
  password: yup.string().required("Password is required"),
});

const registerSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Enter a valid email address"),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type FormValues = { email: string; password: string };

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(mode === "login" ? loginSchema : registerSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleModeChange = (_: unknown, newMode: "login" | "register") => {
    if (newMode) {
      setMode(newMode);
      setServerError("");
      reset();
    }
  };

  const onSubmit = async (values: FormValues) => {
    setServerError("");
    setLoading(true);
    try {
      const data =
        mode === "login"
          ? await authApi.login(values.email, values.password)
          : await authApi.register(values.email, values.password);
      login(data.access_token, data.role);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : "Authentication failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <Box sx={{ width: "100%", maxWidth: 380 }}>
        {/* Logo mark */}
        <Box className="flex items-center gap-2.5 mb-10">
          <Box
            sx={{
              width: 36,
              height: 36,
              bgcolor: "#0a0a0a",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              sx={{
                color: "#fff",
                fontWeight: 800,
                fontSize: "1rem",
                letterSpacing: "-0.03em",
              }}
            >
              T
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "1rem",
                color: "#0a0a0a",
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
              }}
            >
              TechKraft
            </Typography>
            <Typography
              sx={{
                fontSize: "0.72rem",
                color: "#a3a3a3",
                letterSpacing: "-0.01em",
              }}
            >
              Recruitment Dashboard
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#0a0a0a",
            letterSpacing: "-0.03em",
            mb: 0.5,
          }}
        >
          {mode === "login" ? "Welcome back" : "Create account"}
        </Typography>
        <Typography variant="body2" sx={{ color: "#737373", mb: 3 }}>
          {mode === "login"
            ? "Sign in to access your recruitment dashboard"
            : "Register to join the review team"}
        </Typography>

        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          fullWidth
          size="small"
          sx={{
            mb: 3,
            "& .MuiToggleButtonGroup-grouped": { border: "1px solid #e5e5e5" },
          }}
        >
          <ToggleButton value="login">Sign In</ToggleButton>
          <ToggleButton value="register">Register</ToggleButton>
        </ToggleButtonGroup>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {serverError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-3"
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                id="email"
                label="Email"
                type="text"
                size="small"
                fullWidth
                autoComplete="email"
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                id="password"
                label="Password"
                type="password"
                size="small"
                fullWidth
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            )}
          />

          {mode === "register" && (
            <Typography
              variant="caption"
              sx={{ color: "#a3a3a3", display: "block", mt: -0.5 }}
            >
              All accounts register as{" "}
              <strong style={{ color: "#737373" }}>Reviewer</strong>. Admin
              access is granted by the team.
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            sx={{ mt: 1, py: 1.3, fontSize: "0.9rem", fontWeight: 600 }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : mode === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
