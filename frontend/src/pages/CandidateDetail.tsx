import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { candidatesApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Badge, { Stars } from "../components/Badge";
import { CONTAINER_SX } from "../components/Navbar";
import { Candidate, AISummary } from "../types";
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert,
  CircularProgress,
  Avatar,
  Chip,
  Rating,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LockIcon from "@mui/icons-material/Lock";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";

const CATEGORIES = [
  "Technical",
  "Communication",
  "Culture Fit",
  "Problem Solving",
  "Leadership",
];

// ─── Yup schema for the score form ───────────────────────────────────────────
type ScoreFormValues = { category: string; score: number; note?: string };

const scoreSchema: yup.ObjectSchema<ScoreFormValues> = yup.object({
  category: yup
    .string()
    .required("Category is required")
    .default(CATEGORIES[0]),
  score: yup
    .number()
    .typeError("Please select a rating")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5")
    .required("Please select a rating"),
  note: yup
    .string()
    .optional()
    .max(500, "Note must be 500 characters or fewer")
    .default(""),
});

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreServerError, setScoreServerError] = useState("");
  const [scoreSuccess, setScoreSuccess] = useState(false);

  const {
    control: scoreControl,
    handleSubmit: handleScoreSubmit,
    reset: resetScore,
    formState: { errors: scoreErrors },
  } = useForm<ScoreFormValues>({
    resolver: yupResolver(scoreSchema),
    defaultValues: { category: CATEGORIES[0], score: 0, note: "" },
  });

  const [aiState, setAiState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [aiError, setAiError] = useState("");

  const [notesEdit, setNotesEdit] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);

  useEffect(() => {
    if (id) fetchCandidate();
  }, [id]); // eslint-disable-line

  const fetchCandidate = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await candidatesApi.getById(id);
      setCandidate(data);
      setNotesEdit(data.internal_notes || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load candidate");
    } finally {
      setLoading(false);
    }
  };

  const onScoreSubmit = async (values: ScoreFormValues) => {
    if (!id) return;
    setScoreLoading(true);
    setScoreServerError("");
    setScoreSuccess(false);
    try {
      await candidatesApi.createScore(id, {
        ...values,
        score: Number(values.score),
      });
      setScoreSuccess(true);
      resetScore({ category: CATEGORIES[0], score: 0, note: "" });
      await fetchCandidate();
      setTimeout(() => setScoreSuccess(false), 3000);
    } catch (err: unknown) {
      setScoreServerError(
        err instanceof Error ? err.message : "Failed to submit score",
      );
    } finally {
      setScoreLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!id) return;
    setAiState("loading");
    setAiError("");
    setSummary(null);
    try {
      const result = await candidatesApi.generateSummary(id);
      setSummary(result);
      setAiState("done");
    } catch (err: unknown) {
      setAiError(
        err instanceof Error ? err.message : "Failed to generate summary",
      );
      setAiState("error");
    }
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    setSavingNotes(true);
    setNotesSuccess(false);
    try {
      await candidatesApi.update(id, { internal_notes: notesEdit });
      setNotesSuccess(true);
      setTimeout(() => setNotesSuccess(false), 3000);
    } catch (err: unknown) {
      alert(
        "Failed to save notes: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    } finally {
      setSavingNotes(false);
    }
  };

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Box className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <CircularProgress size={28} sx={{ color: "#0a0a0a" }} />
        <Typography sx={{ color: "#a3a3a3", fontSize: "0.85rem" }}>
          Loading profile…
        </Typography>
      </Box>
    );
  }

  if (error || !candidate) {
    return (
      <Box sx={{ ...CONTAINER_SX, py: { xs: 4, md: 6 } }}>
        <Button
          component={Link}
          to="/"
          startIcon={<ArrowBackIcon />}
          size="small"
          sx={{ color: "#737373", mb: 3 }}
        >
          Back
        </Button>
        <Alert severity="error">{error || "Candidate not found"}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ ...CONTAINER_SX, py: { xs: 4, md: 6 } }}>
      {/* Back nav */}
      <Button
        component={Link}
        to="/"
        startIcon={<ArrowBackIcon sx={{ fontSize: "15px !important" }} />}
        size="small"
        sx={{
          color: "#a3a3a3",
          mb: 6,
          fontSize: "0.8rem",
          "&:hover": { color: "#0a0a0a" },
        }}
      >
        All candidates
      </Button>

      {/* Profile header — no card, just content */}
      <Box className="flex gap-5 items-start mb-8">
        <Avatar
          sx={{
            width: 60,
            height: 60,
            bgcolor: "#f5f5f5",
            color: "#525252",
            fontWeight: 700,
            fontSize: "1.2rem",
            border: "1px solid #e5e5e5",
            flexShrink: 0,
          }}
        >
          {getInitials(candidate.name)}
        </Avatar>

        <Box className="flex-1">
          <Box className="flex items-center gap-3 flex-wrap mb-1">
            <Typography
              sx={{
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#0a0a0a",
              }}
            >
              {candidate.name}
            </Typography>
            <Badge status={candidate.status} />
          </Box>

          <Typography
            sx={{
              color: "#525252",
              fontSize: "0.9rem",
              fontWeight: 500,
              mb: 0.5,
            }}
          >
            {candidate.role_applied}
          </Typography>

          <Box className="flex flex-wrap items-center gap-4 mt-1">
            <Typography sx={{ color: "#a3a3a3", fontSize: "0.8rem" }}>
              ✉ {candidate.email}
            </Typography>
            <Typography sx={{ color: "#a3a3a3", fontSize: "0.8rem" }}>
              📅 {new Date(candidate.created_at).toLocaleDateString()}
            </Typography>
          </Box>

          {candidate.skills && candidate.skills.length > 0 && (
            <Box className="flex flex-wrap gap-1.5 mt-3">
              {candidate.skills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "0.73rem",
                    bgcolor: "#f5f5f5",
                    color: "#525252",
                    border: "1px solid #e5e5e5",
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 6 }} />

      {/* Admin Notes — inline, no box */}
      {isAdmin && (
        <Box sx={{ mb: 6 }}>
          <Box className="flex items-center gap-1.5 mb-2">
            <LockIcon sx={{ fontSize: 14, color: "#a3a3a3" }} />
            <Typography
              sx={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#737373",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              Admin Notes
            </Typography>
          </Box>
          <TextField
            multiline
            rows={3}
            value={notesEdit}
            onChange={(e) => setNotesEdit(e.target.value)}
            placeholder="Internal notes visible only to admins..."
            fullWidth
            size="small"
            sx={{ mb: 1.5 }}
          />
          {notesSuccess && (
            <Alert severity="success" sx={{ mb: 1.5 }}>
              Saved!
            </Alert>
          )}
          <Button
            variant="outlined"
            size="small"
            onClick={handleSaveNotes}
            disabled={savingNotes}
            sx={{ fontSize: "0.78rem" }}
          >
            {savingNotes ? "Saving…" : "Save notes"}
          </Button>
        </Box>
      )}

      {/* AI Summary — inline section */}
      <Box sx={{ mb: 6 }}>
        <Box className="flex items-center justify-between mb-3">
          <Box className="flex items-center gap-1.5">
            <AutoAwesomeIcon sx={{ fontSize: 15, color: "#a3a3a3" }} />
            <Typography
              sx={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#737373",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              AI Summary
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={
              aiState === "loading" ? (
                <CircularProgress size={12} sx={{ color: "#525252" }} />
              ) : (
                <AutoAwesomeIcon sx={{ fontSize: "13px !important" }} />
              )
            }
            onClick={handleGenerateSummary}
            disabled={aiState === "loading"}
            sx={{
              fontSize: "0.78rem",
              color: "#525252",
              borderColor: "#e5e5e5",
            }}
          >
            {aiState === "loading" ? "Generating…" : "Generate"}
          </Button>
        </Box>

        <Box
          sx={{
            bgcolor: "#f5f5f5",
            borderRadius: 2,
            p: 2.5,
            border: "1px solid #e5e5e5",
          }}
        >
          {aiState === "idle" && (
            <Typography sx={{ color: "#a3a3a3", fontSize: "0.85rem" }}>
              Click "Generate" to run an AI evaluation of this candidate's
              profile and scores.
            </Typography>
          )}
          {aiState === "loading" && (
            <Box className="flex items-center gap-3">
              <CircularProgress size={18} sx={{ color: "#525252" }} />
              <Typography sx={{ color: "#737373", fontSize: "0.85rem" }}>
                Analyzing profile…
              </Typography>
            </Box>
          )}
          {aiState === "error" && <Alert severity="error">{aiError}</Alert>}
          {aiState === "done" && summary && (
            <Box>
              <Typography
                sx={{
                  color: "#0a0a0a",
                  fontSize: "0.875rem",
                  lineHeight: 1.65,
                }}
              >
                {summary.summary}
              </Typography>
              <Typography
                sx={{ color: "#a3a3a3", fontSize: "0.72rem", mt: 1.5 }}
              >
                Generated at{" "}
                {new Date(summary.generated_at).toLocaleTimeString()}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 6 }} />

      {/* Two column: scores + submit */}
      <Box className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Scores list */}
        <Box className="md:col-span-7">
          <Typography
            sx={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#737373",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              mb: 3,
            }}
          >
            {isAdmin ? "All Scores" : "Your Scores"}
          </Typography>

          {!candidate.scores || candidate.scores.length === 0 ? (
            <Box className="py-10 text-center">
              <Typography sx={{ color: "#d4d4d4", fontSize: "1.5rem", mb: 1 }}>
                📋
              </Typography>
              <Typography sx={{ color: "#a3a3a3", fontSize: "0.85rem" }}>
                {isAdmin
                  ? "No scores yet."
                  : "You haven't scored this candidate yet."}
              </Typography>
            </Box>
          ) : (
            <Box className="flex flex-col">
              {candidate.scores.map((score, index) => (
                <React.Fragment key={score.id}>
                  {index > 0 && <Divider />}
                  <Box className="py-3 flex justify-between items-start gap-4">
                    <Box className="flex-1">
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.87rem",
                          color: "#0a0a0a",
                          mb: 0.3,
                        }}
                      >
                        {score.category}
                      </Typography>
                      {score.note && (
                        <Typography
                          sx={{
                            color: "#737373",
                            fontSize: "0.8rem",
                            fontStyle: "italic",
                          }}
                        >
                          "{score.note}"
                        </Typography>
                      )}
                      <Typography
                        sx={{ color: "#a3a3a3", fontSize: "0.72rem", mt: 0.5 }}
                      >
                        {new Date(score.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Stars score={score.score} />
                  </Box>
                </React.Fragment>
              ))}
            </Box>
          )}
        </Box>

        {/* Score form — no card, just clean form */}
        <Box className="md:col-span-5">
          <Typography
            sx={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#737373",
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              mb: 3,
            }}
          >
            Submit Score
          </Typography>

          <Box
            component="form"
            onSubmit={handleScoreSubmit(onScoreSubmit)}
            noValidate
            className="flex flex-col gap-4"
          >
            {/* Category */}
            <Controller
              name="category"
              control={scoreControl}
              render={({ field }) => (
                <FormControl
                  size="small"
                  fullWidth
                  error={!!scoreErrors.category}
                >
                  <InputLabel>Category</InputLabel>
                  <Select {...field} label="Category">
                    {CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                  {scoreErrors.category && (
                    <FormHelperText>
                      {scoreErrors.category.message}
                    </FormHelperText>
                  )}
                </FormControl>
              )}
            />

            {/* Star rating */}
            <Controller
              name="score"
              control={scoreControl}
              render={({ field }) => (
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      color: scoreErrors.score ? "#d32f2f" : "#737373",
                      mb: 0.5,
                    }}
                  >
                    Rating
                  </Typography>
                  <Rating
                    value={field.value || 0}
                    onChange={(_, v) => field.onChange(v ?? 0)}
                    size="medium"
                    icon={
                      <StarIcon sx={{ color: "#0a0a0a", fontSize: "22px" }} />
                    }
                    emptyIcon={
                      <StarBorderIcon
                        sx={{ color: "#d4d4d4", fontSize: "22px" }}
                      />
                    }
                  />
                  {scoreErrors.score && (
                    <FormHelperText error>
                      {scoreErrors.score.message}
                    </FormHelperText>
                  )}
                </Box>
              )}
            />

            {/* Note */}
            <Controller
              name="note"
              control={scoreControl}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Note (optional)"
                  placeholder="Add observations..."
                  multiline
                  rows={3}
                  size="small"
                  fullWidth
                  error={!!scoreErrors.note}
                  helperText={scoreErrors.note?.message}
                />
              )}
            />

            {scoreServerError && (
              <Alert severity="error">{scoreServerError}</Alert>
            )}
            {scoreSuccess && <Alert severity="success">Score submitted!</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={scoreLoading}
              sx={{ fontWeight: 600, py: 1 }}
            >
              {scoreLoading ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : (
                "Submit Score"
              )}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
