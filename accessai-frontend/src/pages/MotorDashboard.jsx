import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { useVoiceAssistant } from "../hooks/useVoice";

// ── TTS ───────────────────────────────────────────────────────────────────────
function useTTS() {
  const { speak, stop, agentState } = useVoiceAssistant();
  const speaking = agentState === "SPEAKING";

  const speakText = useCallback((text, priority = false) => {
    speak(text);
  }, [speak]);

  return { speak: speakText, stop, speaking };
}

// ── Dwell-click engine ────────────────────────────────────────────────────────
// User hovers a button for DWELL_MS ms → auto-clicks it
const DWELL_MS = 1400;

function useDwell(enabled, onActivate) {
  const timerRef    = useRef(null);
  const progressRef = useRef(null);
  const [dwellEl, setDwellEl]   = useState(null);
  const [progress, setProgress] = useState(0);

  const start = useCallback((el, cb) => {
    if (!enabled) return;
    setDwellEl(el);
    setProgress(0);
    const start = Date.now();
    progressRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / DWELL_MS) * 100);
      setProgress(pct);
    }, 30);
    timerRef.current = setTimeout(() => {
      clearInterval(progressRef.current);
      setDwellEl(null);
      setProgress(0);
      cb();
    }, DWELL_MS);
  }, [enabled]);

  const cancel = useCallback(() => {
    clearTimeout(timerRef.current);
    clearInterval(progressRef.current);
    setDwellEl(null);
    setProgress(0);
  }, []);

  return { start, cancel, dwellEl, progress };
}

// ── Voice commands ────────────────────────────────────────────────────────────
function useVoiceCommands(commands, active) {
  const { registerContext, transcript, listening, setTranscript } = useVoiceAssistant();
  const commandsRef = useRef(commands);
  const contextIdRef = useRef(`MOTOR_DASHBOARD_${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  useEffect(() => {
    const unregister = registerContext(contextIdRef.current, (spokenText, confidence) => {
      setTranscript(spokenText);
      const text = spokenText.toLowerCase().trim();
      let matched = false;
      for (const [pattern, handler] of Object.entries(commandsRef.current)) {
        if (text.includes(pattern)) {
          handler(spokenText);
          matched = true;
          break;
        }
      }
    }, active);
    return () => unregister();
  }, [registerContext, active, setTranscript]);

  return { listening, transcript };
}

// ── Big dwell button ──────────────────────────────────────────────────────────
function DwellButton({ label, sublabel, icon, onClick, color = "#2563eb", bg = "#eff6ff", size = "normal", dwellEnabled, dwell, speak, disabled = false }) {
  const id      = useRef(Math.random().toString(36).slice(2));
  const isLarge = size === "large";

  const handleEnter = () => {
    if (disabled) return;
    dwell.start(id.current, onClick);
  };

  return (
    <button
      disabled={disabled}
      onClick={!dwellEnabled ? onClick : undefined}
      onMouseEnter={handleEnter}
      onMouseLeave={dwell.cancel}
      onFocus={() => speak && speak(`${label}. ${sublabel || ""}`.trim())}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      aria-label={`${label}${sublabel ? ". " + sublabel : ""}`}
      style={{
        position: "relative", overflow: "hidden",
        width: "100%",
        padding: isLarge ? "28px 20px" : "20px 16px",
        background: disabled ? "#f3f4f6" : bg,
        border: `2px solid ${disabled ? "#e5e7eb" : color}`,
        borderRadius: "16px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "10px", cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform 0.12s, box-shadow 0.12s",
        outline: "none",
        fontFamily: "inherit",
        minHeight: isLarge ? "140px" : "100px",
      }}
      onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
    >
      {/* Dwell progress ring */}
      {dwellEnabled && dwell.dwellEl === id.current && (
        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect x="0" y="0" width={dwell.progress} height="100" fill={color} opacity="0.12" />
        </svg>
      )}

      {/* Icon */}
      {icon && <div style={{ fontSize: isLarge ? "32px" : "24px", lineHeight: 1 }}>{icon}</div>}

      {/* Label */}
      <span style={{ fontSize: isLarge ? "18px" : "15px", fontWeight: "700", color: disabled ? "#9ca3af" : color, textAlign: "center", lineHeight: 1.2 }}>
        {label}
      </span>

      {/* Sublabel */}
      {sublabel && (
        <span style={{ fontSize: "12px", color: disabled ? "#d1d5db" : `${color}99`, textAlign: "center", lineHeight: 1.4 }}>
          {sublabel}
        </span>
      )}

      {/* Dwell timer arc */}
      {dwellEnabled && dwell.dwellEl === id.current && (
        <div style={{
          position: "absolute", bottom: "6px", left: "50%", transform: "translateX(-50%)",
          width: `${dwell.progress}%`, height: "3px", background: color,
          borderRadius: "999px", transition: "width 0.03s linear", maxWidth: "80%",
        }} />
      )}
    </button>
  );
}

// ── Switch scanner (space/enter cycles focus) ─────────────────────────────────
function useSwitchScan(enabled, containerRef) {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;
    const getFocusable = () => Array.from(
      containerRef.current.querySelectorAll('button:not([disabled]), [tabindex="0"]')
    );
    let idx = 0;
    const onKey = (e) => {
      if (e.key === " " || e.key === "Tab") {
        e.preventDefault();
        const els = getFocusable();
        if (!els.length) return;
        idx = (idx + 1) % els.length;
        els[idx].focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, containerRef]);
}

// ── Course player ─────────────────────────────────────────────────────────────
function CoursePlayer({ course, index, progress, onClose, onSave, speak, stop, dwellEnabled, dwell, speaking }) {
  const pct = progress?.completion ?? 0;
  const sections = [
    { title: "Introduction", content: `Welcome to ${course.title}. ${course.description}. This lesson uses large controls — no small clicks needed.` },
    { title: "Core content",  content: `Let us explore ${course.title} together. Take all the time you need. There are no time limits here.` },
    { title: "Practice",      content: `Practice time. Apply what you have learned about ${course.title}. Use voice or the large buttons to navigate.` },
    { title: "Summary",       content: `Great work completing ${course.title}. Press the complete button or say mark complete when ready.` },
  ];
  const [si, setSi] = useState(0);

  useEffect(() => {
    speak(`Course player. ${course.title}. Section ${si + 1} of ${sections.length}: ${sections[si].title}. ${sections[si].content}`, true);
  }, [si]); // eslint-disable-line

  useEffect(() => () => stop(), []); // eslint-disable-line

  const { listening } = useVoiceCommands({
    "next":     () => setSi(i => Math.min(i + 1, sections.length - 1)),
    "previous": () => setSi(i => Math.max(i - 1, 0)),
    "back":     () => setSi(i => Math.max(i - 1, 0)),
    "repeat":   () => speak(sections[si].content, true),
    "complete": () => { onSave(course.id, 100); onClose(); },
    "close":    () => { stop(); onClose(); },
    "exit":     () => { stop(); onClose(); },
  }, !speaking);

  return (
    <div style={{ minHeight: "100vh", background: "#f0f9ff", fontFamily: "'DM Sans', sans-serif", padding: "24px" }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <p style={{ fontSize: "13px", color: "#0284c7", fontWeight: "600", margin: "0 0 4px" }}>
            COURSE {index + 1} · {si + 1} / {sections.length}
          </p>
          <h2 style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: "700", color: "#0c4a6e", margin: 0 }}>
            {course.title}
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {listening && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#dcfce7", padding: "6px 12px", borderRadius: "999px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a", animation: "pulse 1.2s infinite" }} />
              <span style={{ fontSize: "12px", color: "#15803d", fontWeight: "600" }}>Listening</span>
            </div>
          )}
        </div>
      </div>

      {/* Section progress */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        {sections.map((s, i) => (
          <div key={i} style={{ flex: 1, height: "6px", borderRadius: "999px", background: i <= si ? "#0284c7" : "#bae6fd", transition: "background 0.3s" }} />
        ))}
      </div>

      {/* Content */}
      <div style={{ background: "#fff", border: "2px solid #bae6fd", borderRadius: "20px", padding: "32px", marginBottom: "28px", minHeight: "160px" }}>
        <p style={{ fontSize: "13px", color: "#0284c7", fontWeight: "600", margin: "0 0 12px" }}>{sections[si].title}</p>
        <p style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "#0c4a6e", lineHeight: 1.8, margin: 0 }}>
          {sections[si].content}
        </p>
      </div>

      {/* Navigation buttons — oversized */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
        <DwellButton
          label="◀ Previous"
          sublabel='say "previous"'
          onClick={() => setSi(i => Math.max(i - 1, 0))}
          disabled={si === 0}
          color="#0284c7" bg="#f0f9ff"
          size="large"
          dwellEnabled={dwellEnabled} dwell={dwell} speak={speak}
        />
        <DwellButton
          label="Next ▶"
          sublabel='say "next"'
          onClick={() => setSi(i => Math.min(i + 1, sections.length - 1))}
          disabled={si === sections.length - 1}
          color="#0284c7" bg="#f0f9ff"
          size="large"
          dwellEnabled={dwellEnabled} dwell={dwell} speak={speak}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
        <DwellButton
          label="↺ Repeat"
          sublabel='say "repeat"'
          onClick={() => speak(sections[si].content, true)}
          color="#7c3aed" bg="#faf5ff"
          size="large"
          dwellEnabled={dwellEnabled} dwell={dwell} speak={speak}
        />
        <DwellButton
          label="✓ Mark complete"
          sublabel='say "complete"'
          onClick={() => { onSave(course.id, 100); onClose(); }}
          color="#15803d" bg="#f0fdf4"
          size="large"
          dwellEnabled={dwellEnabled} dwell={dwell} speak={speak}
        />
      </div>

      <DwellButton
        label="✕ Close course"
        sublabel='say "close"'
        onClick={() => { stop(); onClose(); }}
        color="#dc2626" bg="#fef2f2"
        dwellEnabled={dwellEnabled} dwell={dwell} speak={speak}
      />

      {/* Save partial progress */}
      <div style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "#64748b" }}>Save progress:</span>
        {[25, 50, 75].map(p => (
          <DwellButton
            key={p}
            label={`${p}%`}
            onClick={() => onSave(course.id, p)}
            color="#0284c7" bg={pct >= p ? "#e0f2fe" : "#f8fafc"}
            dwellEnabled={dwellEnabled} dwell={dwell} speak={speak}
          />
        ))}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function MotorDashboard() {
  const { user, logout }              = useAuth();
  const { speak, stop, speaking }               = useTTS();
  const [courses, setCourses]         = useState([]);
  const [progress, setProgress]       = useState({});
  const [loading, setLoading]         = useState(true);
  const [openCourse, setOpenCourse]   = useState(null);
  const [openIndex, setOpenIndex]     = useState(null);
  const [dwellEnabled, setDwell]      = useState(false);
  const [switchEnabled, setSwitch]    = useState(false);
  const [voiceActive, setVoice]       = useState(true);
  const [view, setView]               = useState("courses"); // courses | settings
  const [statusMsg, setStatusMsg]     = useState("");
  const containerRef                  = useRef(null);
  const announcedRef                  = useRef(false);
  const dwell                         = useDwell(dwellEnabled, () => {});

  useSwitchScan(switchEnabled, containerRef);

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          API.get("/courses"),
          API.get(`/progress/${user.uid}`),
        ]);
        setCourses(cRes.data.courses);
        const pMap = {};
        pRes.data.progress.forEach(p => { pMap[p.courseId] = p; });
        setProgress(pMap);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user.uid]);

  // Welcome
  useEffect(() => {
    if (!loading && !announcedRef.current) {
      announcedRef.current = true;
      setTimeout(() => speak(
        `Welcome to AccessAI, ${user.displayName?.split(" ")[0] || "there"}. Motor mode active. You have ${courses.length} courses. All buttons are large and keyboard friendly. Say open course followed by a number, or say help for all commands.`,
        true
      ), 600);
    }
  }, [loading]); // eslint-disable-line

  const saveProgress = useCallback(async (courseId, completion) => {
    try {
      await API.post("/progress", { userId: user.uid, courseId, completion });
      setProgress(prev => ({ ...prev, [courseId]: { courseId, completion } }));
      speak(`Progress saved. ${completion} percent.`, true);
      setStatusMsg(`Progress saved — ${completion}%`);
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (e) { console.error(e); }
  }, [user.uid, speak]);

  const openCourseHandler = useCallback((course, idx) => {
    stop();
    setOpenCourse(course);
    setOpenIndex(idx);
  }, [stop]);

  const closeCourse = useCallback(() => {
    setOpenCourse(null);
    setOpenIndex(null);
    setTimeout(() => speak(`Back to dashboard. ${courses.length} courses available.`, true), 300);
  }, [courses.length, speak]);

  // Voice commands
  const { listening, transcript } = useVoiceCommands({
    "open course": (txt) => {
      const n = parseInt(txt.match(/\d+/)?.[0]) - 1;
      if (n >= 0 && n < courses.length) openCourseHandler(courses[n], n);
      else speak("Course not found. Say list courses to hear all options.", true);
    },
    "list courses": () => {
      const list = courses.map((c, i) => `Course ${i + 1}: ${c.title}`).join(". ");
      speak(list || "No courses available.", true);
    },
    "my progress": () => {
      const done = Object.values(progress).filter(p => p.completion === 100).length;
      speak(`${done} course${done !== 1 ? "s" : ""} completed.`, true);
    },
    "turn on dwell":  () => { setDwell(true);  speak("Dwell click enabled. Hover over a button for 1.4 seconds to activate it.", true); },
    "turn off dwell": () => { setDwell(false); speak("Dwell click disabled.", true); },
    "turn on switch": () => { setSwitch(true); speak("Switch navigation enabled. Press space to cycle buttons.", true); },
    "settings":       () => { setView("settings"); speak("Settings panel open.", true); },
    "courses":        () => { setView("courses");  speak("Courses panel open.", true); },
    "stop":           () => stop(),
    "repeat":         () => speak(`Motor dashboard. ${courses.length} courses. Say open course followed by a number.`, true),
    "sign out":       () => { speak("Signing out.", true); setTimeout(logout, 1500); },
    "help": () => speak(
      "Commands: open course 1 through " + courses.length + ". List courses. My progress. Turn on dwell. Turn off dwell. Turn on switch. Settings. Stop. Sign out.",
      true
    ),
  }, voiceActive && !openCourse && !speaking);

  if (openCourse) {
    return (
      <CoursePlayer
        course={openCourse} index={openIndex}
        progress={progress[openCourse.id]}
        onClose={closeCourse} onSave={saveProgress}
        speak={speak} stop={stop}
        dwellEnabled={dwellEnabled} dwell={dwell}
        speaking={speaking}
      />
    );
  }

  return (
    <div ref={containerRef} style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ARIA live region */}
      <div aria-live="assertive" aria-atomic="true" style={{ position: "absolute", left: "-9999px" }}>{statusMsg}</div>

      {/* Skip link */}
      <a href="#main" style={{ position: "absolute", left: "-9999px" }}
        onFocus={e => { e.target.style.left = "16px"; e.target.style.zIndex = "9999"; }}
        onBlur={e => { e.target.style.left = "-9999px"; }}
      >Skip to content</a>

      {/* ── Navbar ── */}
      <nav style={{
        background: "#fff", borderBottom: "2px solid #e2e8f0",
        padding: "0 24px", height: "72px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <span style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "-0.5px", color: "#0f172a" }}>
          Access<span style={{ color: "#0284c7" }}>AI</span>
        </span>

        {/* Mode pill */}
        <span style={{ background: "#e0f2fe", color: "#0284c7", fontSize: "12px", fontWeight: "600", padding: "4px 12px", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#0284c7" }} />
          motor mode
        </span>

        {/* Voice status */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {voiceActive && listening && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#dcfce7", padding: "6px 14px", borderRadius: "999px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a", animation: "pulse 1.2s infinite" }} />
              <span style={{ fontSize: "13px", color: "#15803d", fontWeight: "600" }}>Listening</span>
            </div>
          )}
          <button
            onClick={() => { setVoice(v => !v); }}
            aria-pressed={voiceActive}
            style={{ padding: "10px 18px", borderRadius: "10px", border: "2px solid", borderColor: voiceActive ? "#0284c7" : "#e2e8f0", background: voiceActive ? "#e0f2fe" : "#f8fafc", color: voiceActive ? "#0284c7" : "#94a3b8", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", minHeight: "46px" }}
          >
            {voiceActive ? "🎤 Voice ON" : "🎤 Voice OFF"}
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main id="main" style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 20px 60px" }}>

        {/* Voice transcript */}
        {voiceActive && transcript && (
          <div style={{ background: "#f0fdf4", border: "2px solid #86efac", borderRadius: "12px", padding: "12px 18px", marginBottom: "20px", fontSize: "14px", color: "#15803d", fontWeight: "500" }}>
            Heard: "{transcript}"
          </div>
        )}

        {/* ── Tab nav — big buttons ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "32px" }}>
          {[
            { id: "courses",  label: "📚 Courses",  cmd: '"courses"' },
            { id: "settings", label: "⚙️ Settings", cmd: '"settings"' },
            { id: "help",     label: "❓ Help",      cmd: '"help"'    },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "help") {
                  speak("Commands: open course, list courses, my progress, turn on dwell, turn off dwell, turn on switch, settings, stop, sign out.", true);
                } else {
                  setView(tab.id);
                  speak(`${tab.label} selected.`, true);
                }
              }}
              aria-pressed={view === tab.id}
              aria-label={`${tab.label}. Say ${tab.cmd}`}
              style={{
                padding: "18px 16px", borderRadius: "14px",
                border: `2px solid ${view === tab.id ? "#0284c7" : "#e2e8f0"}`,
                background: view === tab.id ? "#e0f2fe" : "#fff",
                color: view === tab.id ? "#0284c7" : "#64748b",
                fontSize: "15px", fontWeight: "700", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                fontFamily: "inherit", minHeight: "72px", transition: "all 0.15s",
              }}
            >
              {tab.label}
              <span style={{ fontSize: "11px", fontWeight: "400", opacity: 0.7 }}>say {tab.cmd}</span>
            </button>
          ))}
        </div>

        {/* ── Courses view ── */}
        {view === "courses" && (
          <>
            <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: "700", color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
              Your courses
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 28px" }}>
              All buttons are large. Hover to dwell-click. Say "open course" followed by a number.
            </p>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "28px" }}>
              {[
                { label: "Total courses", value: courses.length,    color: "#0284c7", bg: "#e0f2fe" },
                { label: "In progress",   value: Object.values(progress).filter(p => p.completion > 0 && p.completion < 100).length, color: "#d97706", bg: "#fef3c7" },
                { label: "Completed",     value: Object.values(progress).filter(p => p.completion === 100).length, color: "#16a34a", bg: "#dcfce7" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: "12px", padding: "16px 20px" }}>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Course list */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8", fontSize: "16px" }}>Loading courses...</div>
            ) : courses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8", fontSize: "16px" }}>No courses available yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {courses.map((course, i) => {
                  const pct = progress[course.id]?.completion ?? 0;
                  return (
                    <div key={course.id} style={{ background: "#fff", border: "2px solid #e2e8f0", borderRadius: "18px", padding: "24px", display: "flex", gap: "20px", alignItems: "center" }}>
                      {/* Number badge */}
                      <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "700", color: "#0284c7", flexShrink: 0 }}>
                        {i + 1}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" }}>{course.title}</h3>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 10px", lineHeight: 1.5 }}>{course.description}</p>
                        {pct > 0 && (
                          <div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Progress</span>
                              <span style={{ fontSize: "12px", fontWeight: "600", color: "#0284c7" }}>{pct}%</span>
                            </div>
                            <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: "#0284c7", borderRadius: "999px" }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Big open button */}
                      <div style={{ width: "160px", flexShrink: 0 }}>
                        <DwellButton
                          label={pct > 0 ? `Continue\n${pct}%` : "Start"}
                          sublabel={`say "open course ${i + 1}"`}
                          onClick={() => openCourseHandler(course, i)}
                          color="#0284c7" bg="#e0f2fe"
                          size="large"
                          dwellEnabled={dwellEnabled} dwell={dwell} speak={speak}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sign out — always at bottom */}
            <div style={{ marginTop: "32px" }}>
              <DwellButton
                label="Sign out"
                sublabel='say "sign out"'
                onClick={() => { speak("Signing out.", true); setTimeout(logout, 1500); }}
                color="#dc2626" bg="#fef2f2"
                dwellEnabled={dwellEnabled} dwell={dwell} speak={speak}
              />
            </div>
          </>
        )}

        {/* ── Settings view ── */}
        {view === "settings" && (
          <>
            <h1 style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: "700", color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
              Accessibility settings
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 28px" }}>
              Configure how you interact with AccessAI.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Dwell click */}
              <div style={{ background: "#fff", border: "2px solid #e2e8f0", borderRadius: "16px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" }}>Dwell-click</h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Hover over any button for {DWELL_MS / 1000}s to activate it — no click needed.</p>
                  </div>
                  <span style={{ background: dwellEnabled ? "#dcfce7" : "#f1f5f9", color: dwellEnabled ? "#15803d" : "#94a3b8", fontSize: "12px", fontWeight: "700", padding: "4px 10px", borderRadius: "999px" }}>
                    {dwellEnabled ? "ON" : "OFF"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <DwellButton label="Enable dwell" sublabel='say "turn on dwell"' onClick={() => { setDwell(true);  speak("Dwell click enabled.", true); }} color="#16a34a" bg="#f0fdf4" dwellEnabled={false} dwell={dwell} speak={speak} />
                  <DwellButton label="Disable dwell" sublabel='say "turn off dwell"' onClick={() => { setDwell(false); speak("Dwell click disabled.", true); }} color="#dc2626" bg="#fef2f2" dwellEnabled={false} dwell={dwell} speak={speak} />
                </div>
              </div>

              {/* Switch navigation */}
              <div style={{ background: "#fff", border: "2px solid #e2e8f0", borderRadius: "16px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" }}>Switch / sip-puff navigation</h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Press Space to cycle through buttons. Press Enter to activate.</p>
                  </div>
                  <span style={{ background: switchEnabled ? "#dcfce7" : "#f1f5f9", color: switchEnabled ? "#15803d" : "#94a3b8", fontSize: "12px", fontWeight: "700", padding: "4px 10px", borderRadius: "999px" }}>
                    {switchEnabled ? "ON" : "OFF"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <DwellButton label="Enable switch" sublabel='say "turn on switch"' onClick={() => { setSwitch(true);  speak("Switch navigation enabled. Press space to move between buttons.", true); }} color="#16a34a" bg="#f0fdf4" dwellEnabled={false} dwell={dwell} speak={speak} />
                  <DwellButton label="Disable switch" onClick={() => { setSwitch(false); speak("Switch navigation disabled.", true); }} color="#dc2626" bg="#fef2f2" dwellEnabled={false} dwell={dwell} speak={speak} />
                </div>
              </div>

              {/* Voice control */}
              <div style={{ background: "#fff", border: "2px solid #e2e8f0", borderRadius: "16px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <div>
                    <h3 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", margin: "0 0 4px" }}>Voice commands</h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Hands-free control of every feature using speech.</p>
                  </div>
                  <span style={{ background: voiceActive ? "#dcfce7" : "#f1f5f9", color: voiceActive ? "#15803d" : "#94a3b8", fontSize: "12px", fontWeight: "700", padding: "4px 10px", borderRadius: "999px" }}>
                    {voiceActive ? "ON" : "OFF"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <DwellButton label="Enable voice" onClick={() => { setVoice(true);  speak("Voice commands enabled.", true); }} color="#16a34a" bg="#f0fdf4" dwellEnabled={false} dwell={dwell} speak={speak} />
                  <DwellButton label="Disable voice" onClick={() => { setVoice(false); stop(); }} color="#dc2626" bg="#fef2f2" dwellEnabled={false} dwell={dwell} speak={speak} />
                </div>
              </div>

            </div>
          </>
        )}
      </main>

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        *:focus-visible{outline:4px solid #0284c7 !important;outline-offset:4px;}
      `}</style>
    </div>
  );
}