import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

// ── Visual flash alert system ─────────────────────────────────────────────────
function FlashAlert({ message, color, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999,
      border: `6px solid ${color}`,
      animation: "flashBorder 2.8s ease forwards",
    }}>
      <div style={{
        position: "absolute", top: "24px", left: "50%", transform: "translateX(-50%)",
        background: color, color: "#fff", padding: "12px 28px",
        borderRadius: "999px", fontSize: "15px", fontWeight: "600",
        boxShadow: "0 4px 20px rgba(0,0,0,0.18)", whiteSpace: "nowrap",
        animation: "slideDown 0.3s ease",
      }}>
        {message}
      </div>
      <style>{`
        @keyframes flashBorder {
          0%   { opacity: 1; }
          70%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Caption bar ───────────────────────────────────────────────────────────────
function CaptionBar({ text }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(0,0,0,0.88)", padding: "14px 24px",
      borderTop: "2px solid #2563eb",
      display: "flex", alignItems: "center", gap: "12px",
      backdropFilter: "blur(6px)",
    }}>
      <span style={{
        background: "#2563eb", color: "#fff", fontSize: "11px",
        fontWeight: "700", padding: "2px 8px", borderRadius: "4px",
        letterSpacing: "0.5px", flexShrink: 0,
      }}>CC</span>
      <span style={{ color: "#fff", fontSize: "15px", lineHeight: 1.5 }}>
        {text || <span style={{ color: "#6b7280" }}>Captions will appear here when a course is playing...</span>}
      </span>
    </div>
  );
}

// ── Course card ───────────────────────────────────────────────────────────────
const categoryColors = {
  programming: { bg: "#eff6ff", text: "#2563eb", dot: "#2563eb" },
  math:        { bg: "#fdf4ff", text: "#9333ea", dot: "#9333ea" },
  science:     { bg: "#f0fdf4", text: "#16a34a", dot: "#16a34a" },
  language:    { bg: "#fff7ed", text: "#ea580c", dot: "#ea580c" },
  life:        { bg: "#f0fdfa", text: "#0d9488", dot: "#0d9488" },
  other:       { bg: "#f9fafb", text: "#6b7280", dot: "#6b7280" },
};

function CourseCard({ course, progress, captionsOn, onOpen, onAlert }) {
  const cat     = categoryColors[course.category] || categoryColors.other;
  const pct     = progress?.completion ?? 0;
  const started = pct > 0;

  return (
    <div style={{
      background: "#fff", border: "1.5px solid #e5e7eb",
      borderRadius: "14px", padding: "24px",
      display: "flex", flexDirection: "column", gap: "14px",
      transition: "box-shadow 0.18s",
      cursor: "pointer",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.09)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
        <span style={{
          background: cat.bg, color: cat.text,
          fontSize: "11px", fontWeight: "600", padding: "3px 10px",
          borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "5px",
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: cat.dot }} />
          {course.category}
        </span>
        {captionsOn && (
          <span style={{
            background: "#eff6ff", color: "#2563eb", fontSize: "11px",
            fontWeight: "700", padding: "3px 8px", borderRadius: "4px",
          }}>CC ON</span>
        )}
      </div>

      {/* Title + desc */}
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#111827", margin: "0 0 6px" }}>
          {course.title}
        </h3>
        <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, lineHeight: 1.55 }}>
          {course.description}
        </p>
      </div>

      {/* Progress bar */}
      {started && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>Progress</span>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#2563eb" }}>{pct}%</span>
          </div>
          <div style={{ height: "6px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${pct}%`,
              background: "linear-gradient(90deg, #2563eb, #60a5fa)",
              borderRadius: "999px", transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      )}

      {/* Media badges */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {course.video && (
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#374151", background: "#f3f4f6", padding: "4px 10px", borderRadius: "6px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Video
          </span>
        )}
        {captionsOn && (
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#2563eb", background: "#eff6ff", padding: "4px 10px", borderRadius: "6px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M7 11h4M7 15h8"/></svg>
            Captions
          </span>
        )}
        {course.audio && (
          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#374151", background: "#f3f4f6", padding: "4px 10px", borderRadius: "6px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            Audio
          </span>
        )}
      </div>

      {/* Open button */}
      <button
        onClick={() => { onOpen(course); onAlert(`Opening: ${course.title}`, "#2563eb"); }}
        style={{
          width: "100%", padding: "11px",
          background: started ? "#eff6ff" : "#2563eb",
          color: started ? "#2563eb" : "#fff",
          border: started ? "1.5px solid #bfdbfe" : "none",
          borderRadius: "10px", fontSize: "14px", fontWeight: "600",
          cursor: "pointer", transition: "opacity 0.15s",
          fontFamily: "inherit",
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >
        {started ? `Continue (${pct}%)` : "Start course"}
      </button>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function DeafDashboard() {
  const { user, logout }               = useAuth();
  const [courses, setCourses]          = useState([]);
  const [progress, setProgress]        = useState({});
  const [captionsOn, setCaptionsOn]    = useState(true);
  const [captionText, setCaptionText]  = useState("");
  const [alert, setAlert]              = useState(null);
  const [loading, setLoading]          = useState(true);
  const [search, setSearch]            = useState("");
  const [activeCategory, setCategory]  = useState("all");
  const [openCourse, setOpenCourse]    = useState(null);

  // Load courses + progress
  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          API.get("/courses"),
          API.get(`/progress/${user.uid}`),
        ]);
        setCourses(cRes.data.courses);
        // Index progress by courseId
        const pMap = {};
        pRes.data.progress.forEach(p => { pMap[p.courseId] = p; });
        setProgress(pMap);
      } catch (e) {
        console.error("Load error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user.uid]);

  const triggerAlert = useCallback((message, color = "#2563eb") => {
    setAlert({ message, color, id: Date.now() });
  }, []);

  const toggleCaptions = () => {
    const next = !captionsOn;
    setCaptionsOn(next);
    triggerAlert(next ? "Captions turned ON" : "Captions turned OFF", next ? "#16a34a" : "#dc2626");
  };

  const handleOpenCourse = (course) => {
    setOpenCourse(course);
    if (captionsOn) {
      setCaptionText(`Now playing: ${course.title} — ${course.description}`);
    }
  };

  const handleCloseCourse = () => {
    setOpenCourse(null);
    setCaptionText("");
  };

  const saveProgress = async (courseId, completion) => {
    try {
      await API.post("/progress", { userId: user.uid, courseId, completion });
      setProgress(prev => ({ ...prev, [courseId]: { courseId, completion } }));
      triggerAlert(`Progress saved — ${completion}%`, "#16a34a");
    } catch (e) {
      console.error("Save progress error:", e);
    }
  };

  // Filter courses
  const filtered = courses.filter(c => {
    const matchSearch   = c.title.toLowerCase().includes(search.toLowerCase()) ||
                          c.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "all" || c.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const categories = ["all", ...new Set(courses.map(c => c.category))];

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'DM Sans', sans-serif", paddingBottom: captionsOn ? "80px" : "0" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Flash alert */}
      {alert && (
        <FlashAlert
          key={alert.id}
          message={alert.message}
          color={alert.color}
          onDone={() => setAlert(null)}
        />
      )}

      {/* ── Navbar ── */}
      <nav style={{
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "0 32px", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px", fontWeight: "700", color: "#111827", letterSpacing: "-0.5px" }}>
            Access<span style={{ color: "#2563eb" }}>AI</span>
          </span>
          <span style={{
            background: "#eff6ff", color: "#2563eb", fontSize: "11px",
            fontWeight: "600", padding: "3px 10px", borderRadius: "999px",
            display: "inline-flex", alignItems: "center", gap: "5px",
          }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#2563eb" }} />
            deaf mode
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Captions toggle */}
          <button
            onClick={toggleCaptions}
            aria-pressed={captionsOn}
            aria-label={captionsOn ? "Turn captions off" : "Turn captions on"}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 16px", borderRadius: "8px", border: "1.5px solid",
              borderColor: captionsOn ? "#2563eb" : "#e5e7eb",
              background: captionsOn ? "#eff6ff" : "#fff",
              color: captionsOn ? "#2563eb" : "#6b7280",
              fontSize: "13px", fontWeight: "600", cursor: "pointer",
              transition: "all 0.15s", fontFamily: "inherit",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M7 11h4M7 15h8"/>
            </svg>
            CC {captionsOn ? "ON" : "OFF"}
          </button>

          {/* User info */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "#eff6ff", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "#2563eb",
            }}>
              {user.displayName?.[0] || user.email?.[0] || "U"}
            </div>
            <span style={{ fontSize: "13px", color: "#374151", fontWeight: "500" }}>
              {user.displayName?.split(" ")[0] || "User"}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            style={{
              padding: "7px 14px", borderRadius: "8px",
              border: "1.5px solid #e5e7eb", background: "#fff",
              fontSize: "13px", color: "#6b7280", cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Course viewer modal ── */}
      {openCourse && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px",
        }}>
          <div style={{
            background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "760px",
            maxHeight: "90vh", overflow: "auto", padding: "32px",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: "0 0 6px" }}>
                  {openCourse.title}
                </h2>
                <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>{openCourse.description}</p>
              </div>
              <button
                onClick={handleCloseCourse}
                aria-label="Close course"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#6b7280" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Visual alert banner — no audio cue */}
            <div style={{
              background: "#eff6ff", border: "2px solid #bfdbfe",
              borderRadius: "10px", padding: "12px 16px", marginBottom: "20px",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
              <span style={{ fontSize: "13px", color: "#1e40af", fontWeight: "500" }}>
                Captions are {captionsOn ? "ON" : "OFF"} — toggle with the CC button in the top bar
              </span>
            </div>

            {/* Video placeholder */}
            <div style={{
              background: "#111827", borderRadius: "12px", aspectRatio: "16/9",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: "12px", marginBottom: "20px", position: "relative", overflow: "hidden",
            }}>
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.5">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span style={{ color: "#9ca3af", fontSize: "13px" }}>{openCourse.video || "No video attached"}</span>
              {captionsOn && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "rgba(0,0,0,0.82)", padding: "10px 16px",
                  display: "flex", alignItems: "center", gap: "8px",
                }}>
                  <span style={{ background: "#2563eb", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "1px 6px", borderRadius: "3px" }}>CC</span>
                  <span style={{ color: "#fff", fontSize: "13px" }}>
                    {openCourse.title} — captions active
                  </span>
                </div>
              )}
            </div>

            {/* Progress buttons */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "10px", fontWeight: "500" }}>
                Mark your progress:
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[25, 50, 75, 100].map(pct => (
                  <button
                    key={pct}
                    onClick={() => { saveProgress(openCourse.id, pct); if (pct === 100) handleCloseCourse(); }}
                    style={{
                      padding: "9px 18px", borderRadius: "8px",
                      background: (progress[openCourse.id]?.completion ?? 0) >= pct ? "#2563eb" : "#f3f4f6",
                      color: (progress[openCourse.id]?.completion ?? 0) >= pct ? "#fff" : "#374151",
                      border: "none", fontSize: "13px", fontWeight: "600",
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    {pct === 100 ? "Complete ✓" : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page body ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>

        {/* Page header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#111827", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
            Your courses
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
            All content includes captions and visual cues — no audio required.
          </p>
        </div>

        {/* Search + filter row */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search courses"
              style={{
                width: "100%", paddingLeft: "38px", paddingRight: "14px",
                height: "40px", border: "1.5px solid #e5e7eb", borderRadius: "8px",
                fontSize: "14px", color: "#111827", background: "#fff",
                outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Category filters */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: "8px 14px", borderRadius: "8px", border: "1.5px solid",
                  borderColor: activeCategory === cat ? "#2563eb" : "#e5e7eb",
                  background: activeCategory === cat ? "#eff6ff" : "#fff",
                  color: activeCategory === cat ? "#2563eb" : "#6b7280",
                  fontSize: "13px", fontWeight: "500", cursor: "pointer",
                  transition: "all 0.15s", fontFamily: "inherit", textTransform: "capitalize",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
          {[
            { label: "Total courses", value: courses.length, color: "#2563eb", bg: "#eff6ff" },
            { label: "In progress",   value: Object.values(progress).filter(p => p.completion > 0 && p.completion < 100).length, color: "#d97706", bg: "#fffbeb" },
            { label: "Completed",     value: Object.values(progress).filter(p => p.completion === 100).length, color: "#16a34a", bg: "#f0fdf4" },
          ].map(stat => (
            <div key={stat.label} style={{
              background: stat.bg, borderRadius: "10px", padding: "12px 20px",
              display: "flex", flexDirection: "column", gap: "2px",
            }}>
              <span style={{ fontSize: "22px", fontWeight: "700", color: stat.color }}>{stat.value}</span>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Courses grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af", fontSize: "15px" }}>
            Loading courses...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 0",
            background: "#fff", borderRadius: "14px", border: "1.5px solid #e5e7eb",
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ marginBottom: "12px" }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <p style={{ fontSize: "15px", color: "#9ca3af", margin: 0 }}>No courses found</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {filtered.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                progress={progress[course.id]}
                captionsOn={captionsOn}
                onOpen={handleOpenCourse}
                onAlert={triggerAlert}
              />
            ))}
          </div>
        )}
      </div>

      {/* Caption bar — fixed bottom */}
      {captionsOn && <CaptionBar text={captionText} />}
    </div>
  );
}