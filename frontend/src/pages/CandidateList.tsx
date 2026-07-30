import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { candidatesApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Badge, { Stars } from "../components/Badge";
import { CandidateListResponse, ListCandidatesParams } from "../types";
import { CONTAINER_SX } from "../components/Navbar";
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Pagination,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  InputAdornment,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";

export default function CandidateListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<CandidateListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<ListCandidatesParams>({
    status: "",
    role_applied: "",
    skill: "",
    keyword: "",
  });
  const [activeFilters, setActiveFilters] = useState<ListCandidatesParams>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  useEffect(() => {
    fetchCandidates();
  }, [activeFilters, page]); // eslint-disable-line

  const fetchCandidates = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await candidatesApi.getAll({
        ...activeFilters,
        page,
        page_size: pageSize,
      });
      setData(result);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch candidates",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    key: keyof ListCandidatesParams,
    value: string,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActiveFilters(filters);
  };

  const handleReset = () => {
    const empty = { status: "", role_applied: "", skill: "", keyword: "" };
    setFilters(empty);
    setActiveFilters(empty);
    setPage(1);
  };

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const hasActiveFilters = Object.values(activeFilters).some(
    (v) => v && v.length > 0,
  );

  return (
    <Box sx={{ ...CONTAINER_SX, py: { xs: 4, md: 6 } }}>
      {/* Page header */}
      <Box className="mb-8">
        <Box className="flex items-end justify-between">
          <Box>
            <Typography
              sx={{
                fontSize: "1.6rem",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#0a0a0a",
              }}
            >
              Candidates
            </Typography>
            <Typography sx={{ color: "#a3a3a3", fontSize: "0.85rem", mt: 0.3 }}>
              {data ? `${data.total} total` : "—"}
              {user?.role === "admin" && (
                <span
                  style={{ marginLeft: 8, color: "#525252", fontWeight: 500 }}
                >
                  · Admin view
                </span>
              )}
            </Typography>
          </Box>

          <Box className="flex items-center gap-2">
            <Button
              variant="outlined"
              size="small"
              startIcon={<TuneIcon sx={{ fontSize: "15px !important" }} />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                color: showFilters ? "#0a0a0a" : "#737373",
                borderColor: showFilters ? "#0a0a0a" : "#e5e5e5",
                fontSize: "0.8rem",
              }}
            >
              Filters
              {hasActiveFilters && (
                <Box
                  component="span"
                  sx={{
                    ml: 1,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "#0a0a0a",
                    display: "inline-block",
                  }}
                />
              )}
            </Button>
          </Box>
        </Box>

        {showFilters && (
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{ mt: 3, pt: 3, borderTop: "1px solid #e5e5e5" }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end"
          >
            <Box className="md:col-span-3">
              <TextField
                id="keyword"
                placeholder="Name or email..."
                label="Search"
                size="small"
                fullWidth
                value={filters.keyword || ""}
                onChange={(e) => handleFilterChange("keyword", e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#a3a3a3", fontSize: 16 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Box className="md:col-span-3">
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={filters.status || ""}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                  <MenuItem value="hired">Hired</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box className="md:col-span-2">
              <TextField
                label="Role"
                placeholder="e.g. Backend"
                size="small"
                fullWidth
                value={filters.role_applied || ""}
                onChange={(e) =>
                  handleFilterChange("role_applied", e.target.value)
                }
              />
            </Box>

            <Box className="md:col-span-2">
              <TextField
                label="Skill"
                placeholder="e.g. Python"
                size="small"
                fullWidth
                value={filters.skill || ""}
                onChange={(e) => handleFilterChange("skill", e.target.value)}
              />
            </Box>

            <Box className="md:col-span-2 flex gap-2">
              <Button
                type="submit"
                variant="contained"
                size="medium"
                fullWidth
                sx={{ fontWeight: 600, fontSize: "0.82rem" }}
              >
                Apply
              </Button>
              <Button
                type="button"
                variant="text"
                size="medium"
                onClick={handleReset}
                sx={{
                  color: "#a3a3a3",
                  fontSize: "0.82rem",
                  whiteSpace: "nowrap",
                }}
              >
                Clear
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box className="flex items-center justify-center py-24 gap-3 flex-col">
          <CircularProgress size={28} sx={{ color: "#0a0a0a" }} />
          <Typography sx={{ color: "#a3a3a3", fontSize: "0.85rem" }}>
            Loading candidates…
          </Typography>
        </Box>
      )}

      {!loading && !error && data?.items?.length === 0 && (
        <Box className="py-24 text-center">
          <Typography sx={{ fontSize: "2rem", mb: 1.5 }}>🔍</Typography>
          <Typography sx={{ fontWeight: 600, color: "#0a0a0a", mb: 0.5 }}>
            No candidates found
          </Typography>
          <Typography sx={{ color: "#a3a3a3", fontSize: "0.85rem" }}>
            Try adjusting your search or filters
          </Typography>
        </Box>
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <>
          <Box className="flex flex-col gap-3">
            {data.items.map((candidate) => {
              const avgScore =
                candidate.scores && candidate.scores.length > 0
                  ? Math.round(
                      candidate.scores.reduce((s, sc) => s + sc.score, 0) /
                        candidate.scores.length,
                    )
                  : null;

              return (
                <Card key={candidate.id} sx={{ borderRadius: "12px" }}>
                  <CardActionArea
                    onClick={() => navigate(`/candidates/${candidate.id}`)}
                    sx={{
                      p: 2.5,
                      "& .MuiCardActionArea-focusHighlight": {
                        borderRadius: "12px",
                      },
                    }}
                  >
                    <Box className="flex items-center gap-4 w-full">
                      {/* Avatar */}
                      <Avatar
                        sx={{
                          width: 42,
                          height: 42,
                          bgcolor: "#f5f5f5",
                          color: "#525252",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          flexShrink: 0,
                          border: "1px solid #e5e5e5",
                        }}
                      >
                        {getInitials(candidate.name)}
                      </Avatar>

                      {/* Name + role */}
                      <Box className="flex-1 min-w-0">
                        <Box className="flex items-center gap-2 flex-wrap">
                          <Typography
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.9rem",
                              color: "#0a0a0a",
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {candidate.name}
                          </Typography>
                          <Badge status={candidate.status} />
                        </Box>
                        <Typography
                          sx={{
                            color: "#737373",
                            fontSize: "0.78rem",
                            mt: 0.2,
                          }}
                        >
                          {candidate.role_applied} · {candidate.email}
                        </Typography>
                      </Box>

                      {/* Skills */}
                      <Box className="hidden md:flex items-center gap-1 flex-shrink-0">
                        {candidate.skills?.slice(0, 3).map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.68rem",
                              bgcolor: "#f5f5f5",
                              color: "#525252",
                              border: "1px solid #e5e5e5",
                            }}
                          />
                        ))}
                        {candidate.skills && candidate.skills.length > 3 && (
                          <Typography
                            sx={{
                              color: "#a3a3a3",
                              fontSize: "0.75rem",
                              ml: 0.5,
                            }}
                          >
                            +{candidate.skills.length - 3}
                          </Typography>
                        )}
                      </Box>

                      <Box className="flex flex-col items-end gap-1 flex-shrink-0">
                        {avgScore !== null ? (
                          <Stars score={avgScore} />
                        ) : (
                          <Typography
                            sx={{ color: "#d4d4d4", fontSize: "0.75rem" }}
                          >
                            —
                          </Typography>
                        )}
                        <Typography
                          sx={{ color: "#a3a3a3", fontSize: "0.72rem" }}
                        >
                          {new Date(candidate.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>

          {data.total_pages > 1 && (
            <Box className="flex justify-center mt-8">
              <Pagination
                count={data.total_pages}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "#737373",
                    borderColor: "#e5e5e5",
                  },
                  "& .Mui-selected": {
                    bgcolor: "#0a0a0a !important",
                    color: "#fff",
                  },
                }}
                variant="outlined"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
