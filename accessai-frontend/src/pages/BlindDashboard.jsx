import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { useVoiceAssistant } from "../hooks/useVoice";

// ── Text-to-Speech engine ─────────────────────────────────────────────────────
function useTTS() {
  const { speak, stop, agentState } = useVoiceAssistant();
  const speaking = agentState === "SPEAKING";

  const speakText = useCallback((text, priority = false) => {
    speak(text);
  }, [speak]);

  return { speak: speakText, stop, speaking };
}

// ── Voice command engine ──────────────────────────────────────────────────────
function useVoiceCommands(commands, active) {
  const { registerContext, transcript, listening, setTranscript } = useVoiceAssistant();
  const commandsRef = useRef(commands);
  const contextIdRef = useRef(`BLIND_DASHBOARD_${Math.random().toString(36).substring(2, 9)}`);

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

// ── Course card (screen-reader + voice friendly) ──────────────────────────────
function CourseCard({ course, index, progress, onOpen, speak }) {
  const pct = progress?.completion ?? 0;

  return (
    <div
      tabIndex={0}
      role="article"
      aria-label={`Course ${index + 1}: ${course.title}. ${course.description}. ${pct > 0 ? `${pct}% complete.` : "Not started."} Press Enter or say open course ${index + 1} to begin.`}
      onFocus={() => speak(`Course ${index + 1}. ${course.title}. ${pct > 0 ? `${pct} percent complete` : "Not started"}.`)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(course, index)}
      style={{
        background: "#1e293b", border: "2px solid #334155",
        borderRadius: "14px", padding: "24px",
        outline: "none", cursor: "pointer",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#60a5fa"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#334155"}
      onClick={() => onOpen(course, index)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <span style={{ fontSize: "12px", fontWeight: "700", color: "#60a5fa", letterSpacing: "1px", textTransform: "uppercase" }}>
          Course {index + 1}
        </span>
        {pct > 0 && (
          <span style={{ fontSize: "12px", color: "#4ade80", fontWeight: "600" }}>{pct}% done</span>
        )}
      </div>

      <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#f1f5f9", margin: "0 0 8px", lineHeight: 1.3 }}>
        {course.title}
      </h3>
      <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 16px", lineHeight: 1.6 }}>
        {course.description}
      </p>

      {/* Progress bar */}
      {pct > 0 && (
        <div style={{ height: "4px", background: "#334155", borderRadius: "999px", marginBottom: "16px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "#60a5fa", borderRadius: "999px" }} />
        </div>
      )}

      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        color: "#60a5fa", fontSize: "13px", fontWeight: "600",
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        {pct > 0 ? "Continue" : "Start"} — say "open course {index + 1}"
      </div>
    </div>
  );
}

// ── Course player (audio-first) ───────────────────────────────────────────────
function CoursePlayer({ course, index, progress, onClose, onSaveProgress, speak, stop, speaking }) {
  const pct = progress?.completion ?? 0;
  const sections = [
    { id: 1, title: "Introduction", content: `Welcome to ${course.title}. ${course.description}. This course will help you learn step by step using audio narration.` },
    { id: 2, title: "Main content", content: `In this section you will explore the core concepts of ${course.title}. Listen carefully and feel free to ask questions using your voice.` },
    { id: 3, title: "Practice", content: `Now let us practice what you have learned about ${course.title}. Take your time. Say repeat to hear this again.` },
    { id: 4, title: "Summary", content: `Excellent work. You have completed the lesson on ${course.title}. You can say mark complete to finish or say repeat to hear the summary again.` },
  ];
  const [sectionIdx, setSectionIdx] = useState(0);
  const currentSection = sections[sectionIdx];

  useEffect(() => {
    speak(`Course player open. ${course.title}. Section ${sectionIdx + 1} of ${sections.length}: ${currentSection.title}. ${currentSection.content}. Say next section, previous section, repeat, or mark complete.`, true);
  }, [sectionIdx]); // eslint-disable-line

  useEffect(() => {
    return () => stop();
  }, []); // eslint-disable-line

  const next = () => {
    if (sectionIdx < sections.length - 1) setSectionIdx(i => i + 1);
    else speak("You are at the last section. Say mark complete to finish.", true);
  };
  const prev = () => {
    if (sectionIdx > 0) setSectionIdx(i => i - 1);
    else speak("You are at the first section.", true);
  };
  const repeat = () => speak(currentSection.content, true);

  const { listening } = useVoiceCommands({
    "next": next,
    "forward": next,
    "previous": prev,
    "back": prev,
    "repeat": repeat,
    "again": repeat,
    "complete": () => { onSaveProgress(course.id, 100); onClose(); },
    "close": () => { stop(); onClose(); },
    "exit": () => { stop(); onClose(); },
  }, !speaking);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#0f172a", zIndex: 300,
      display: "flex", flexDirection: "column",
      padding: "32px", overflowY: "auto",
    }}
      role="main"
      aria-label="Course player. Use voice commands or keyboard to navigate."
    >
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: listening ? "#4ade80" : "#334155", animation: listening ? "pulse 1.4s infinite" : "none" }} />
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>{listening ? "Listening for commands..." : "Voice inactive"}</span>
        </div>
        <button
          onClick={() => { stop(); onClose(); }}
          aria-label="Close course player. Say close or exit."
          style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "8px 16px", color: "#94a3b8", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}
        >
          ✕ Close
        </button>
      </div>

      {/* Course title */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "13px", color: "#60a5fa", fontWeight: "600", margin: "0 0 6px", letterSpacing: "0.5px" }}>
          COURSE {index + 1} · SECTION {sectionIdx + 1} OF {sections.length}
        </p>
        <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: "700", color: "#f1f5f9", margin: "0 0 4px", lineHeight: 1.2 }}>
          {course.title}
        </h2>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>{currentSection.title}</p>
      </div>

      {/* Section progress dots */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
        {sections.map((s, i) => (
          <div key={s.id} style={{
            height: "4px", flex: 1, borderRadius: "999px",
            background: i <= sectionIdx ? "#60a5fa" : "#1e293b",
            border: i <= sectionIdx ? "none" : "1px solid #334155",
            transition: "background 0.3s",
          }} aria-hidden="true" />
        ))}
      </div>

      {/* Content card */}
      <div style={{
        background: "#1e293b", border: "1px solid #334155", borderRadius: "16px",
        padding: "32px", marginBottom: "28px", flex: 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#0f172a", border: "1px solid #334155", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" aria-hidden="true">
              <path d="M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            </svg>
          </div>
          <span style={{ fontSize: "13px", color: "#60a5fa", fontWeight: "600" }}>Audio narration active</span>
        </div>
        <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "#e2e8f0", lineHeight: 1.85, margin: 0 }}>
          {currentSection.content}
        </p>
      </div>

      {/* Nav buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
        {[
          { label: "◀ Previous", desc: 'say "previous"', action: prev, disabled: sectionIdx === 0 },
          { label: "↺ Repeat", desc: 'say "repeat"', action: repeat, disabled: false },
          { label: "Next ▶", desc: 'say "next"', action: next, disabled: sectionIdx === sections.length - 1 },
          { label: "✓ Complete", desc: 'say "complete"', action: () => { onSaveProgress(course.id, 100); onClose(); }, disabled: false, accent: true },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.action}
            disabled={btn.disabled}
            aria-label={`${btn.label} — ${btn.desc}`}
            style={{
              padding: "14px 10px", borderRadius: "12px",
              background: btn.disabled ? "#0f172a" : btn.accent ? "#2563eb" : "#1e293b",
              border: `1px solid ${btn.disabled ? "#1e293b" : btn.accent ? "#2563eb" : "#334155"}`,
              color: btn.disabled ? "#334155" : btn.accent ? "#fff" : "#e2e8f0",
              fontSize: "13px", fontWeight: "600", cursor: btn.disabled ? "not-allowed" : "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
              fontFamily: "inherit",
            }}
          >
            {btn.label}
            <span style={{ fontSize: "10px", color: btn.disabled ? "#1e293b" : btn.accent ? "#bfdbfe" : "#475569", fontWeight: "400" }}>
              {btn.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Progress buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", color: "#64748b", alignSelf: "center", marginRight: "4px" }}>Save progress:</span>
        {[25, 50, 75].map(p => (
          <button key={p} onClick={() => onSaveProgress(course.id, p)}
            style={{
              padding: "7px 14px", borderRadius: "8px", border: "1px solid #334155",
              background: pct >= p ? "#1e3a5f" : "#1e293b", color: pct >= p ? "#60a5fa" : "#64748b",
              fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit",
            }}>
            {p}%
          </button>
        ))}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function BlindDashboard() {
  const { user, logout } = useAuth();
  const { speak, stop, speaking } = useTTS();
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [openCourse, setOpenCourse] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const [voiceActive, setVoiceActive] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const announcedRef = useRef(false);

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

  // Welcome announcement (once)
  useEffect(() => {
    if (!loading && !announcedRef.current) {
      announcedRef.current = true;
      const count = courses.length;
      setTimeout(() => {
        speak(`Welcome to AccessAI, ${user.displayName?.split(" ")[0] || "there"}. You have ${count} course${count !== 1 ? "s" : ""} available. Say "list courses" to hear them, say "open course" followed by a number to start, or say "help" for all commands.`, true);
      }, 600);
    }
  }, [loading]); // eslint-disable-line

  const handleOpenCourse = useCallback((course, index) => {
    stop();
    setOpenCourse(course);
    setOpenIndex(index);
  }, [stop]);

  const handleCloseCourse = useCallback(() => {
    setOpenCourse(null);
    setOpenIndex(null);
    setTimeout(() => speak(`Back to dashboard. ${courses.length} courses available. Say list courses or open course followed by a number.`, true), 300);
  }, [courses.length, speak]); // eslint-disable-line

  const saveProgress = useCallback(async (courseId, completion) => {
    try {
      await API.post("/progress", { userId: user.uid, courseId, completion });
      setProgress(prev => ({ ...prev, [courseId]: { courseId, completion } }));
      speak(`Progress saved. ${completion} percent complete.`, true);
    } catch (e) { console.error(e); }
  }, [user.uid, speak]);

  const status = useCallback((msg) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(""), 3000);
  }, []);

  // Global voice commands (dashboard level)
  const { listening, transcript } = useVoiceCommands({
    "list courses": () => {
      if (courses.length === 0) { speak("No courses available.", true); return; }
      const list = courses.map((c, i) => `Course ${i + 1}: ${c.title}`).join(". ");
      speak(`Here are your courses. ${list}. Say open course followed by the number to start.`, true);
    },
    "open course": (text) => {
      const num = parseInt(text.match(/\d+/)?.[0]) - 1;
      if (num >= 0 && num < courses.length) { handleOpenCourse(courses[num], num); }
      else speak("I couldn't find that course number. Say list courses to hear all available courses.", true);
    },
    "my progress": () => {
      const done = Object.values(progress).filter(p => p.completion === 100).length;
      const going = Object.values(progress).filter(p => p.completion > 0 && p.completion < 100).length;
      speak(`You have completed ${done} course${done !== 1 ? "s" : ""} and ${going} in progress.`, true);
    },
    "sign out": () => { speak("Signing out. Goodbye.", true); setTimeout(logout, 1500); },
    "log out": () => { speak("Signing out. Goodbye.", true); setTimeout(logout, 1500); },
    "stop": () => { stop(); status("Stopped speaking"); },
    "repeat": () => speak(`Dashboard. You have ${courses.length} courses. Say list courses or open course followed by a number.`, true),
    "help": () => speak(
      "Available commands: list courses — hear all courses. Open course followed by a number — start that course. My progress — hear your progress. Stop — stop speaking. Sign out — log out. Repeat — hear this menu again.",
      true
    ),
  }, voiceActive && !openCourse && !speaking);

  if (openCourse) {
    return (
      <CoursePlayer
        course={openCourse}
        index={openIndex}
        progress={progress[openCourse.id]}
        onClose={handleCloseCourse}
        onSaveProgress={saveProgress}
        speak={speak}
        stop={stop}
        speaking={speaking}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", fontFamily: "'DM Sans', sans-serif", color: "#f1f5f9" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Skip to content */}
      <a href="#main-content" style={{ position: "absolute", left: "-9999px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}
        onFocus={e => { e.target.style.left = "16px"; e.target.style.width = "auto"; e.target.style.height = "auto"; }}
        onBlur={e => { e.target.style.left = "-9999px"; e.target.style.width = "1px"; e.target.style.height = "1px"; }}
      >Skip to main content</a>

      {/* ── Navbar ── */}
      <nav role="navigation" aria-label="Main navigation" style={{
        background: "#1e293b", borderBottom: "1px solid #334155",
        padding: "0 32px", height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "22px", fontWeight: "700", letterSpacing: "-0.5px" }}>
            Access<span style={{ color: "#60a5fa" }}>AI</span>
          </span>
          <span style={{ background: "#1e3a5f", color: "#60a5fa", fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#60a5fa" }} />
            blind mode
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Voice indicator */}
          <button
            onClick={() => {
              setVoiceActive(v => {
                const next = !v;
                speak(next ? "Voice commands enabled." : "Voice commands disabled.", true);
                return next;
              });
            }}
            aria-label={voiceActive ? "Voice commands on. Click to disable." : "Voice commands off. Click to enable."}
            aria-pressed={voiceActive}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 16px", borderRadius: "8px",
              border: `1.5px solid ${voiceActive ? "#22c55e" : "#334155"}`,
              background: voiceActive ? "#052e16" : "#1e293b",
              color: voiceActive ? "#4ade80" : "#64748b",
              fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: voiceActive && listening ? "#4ade80" : voiceActive ? "#166534" : "#334155", animation: voiceActive && listening ? "pulse 1.2s infinite" : "none" }} />
            {voiceActive ? (listening ? "Listening..." : "Voice ON") : "Voice OFF"}
          </button>

          {/* Say help button */}
          <button
            onClick={() => speak('Say: list courses, open course 1, my progress, stop, or sign out.', true)}
            aria-label="Hear available voice commands"
            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}
          >
            ? Help
          </button>

          <button
            onClick={() => { stop(); logout(); }}
            aria-label="Sign out of AccessAI"
            style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #334155", background: "#1e293b", color: "#94a3b8", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Live region for status (screen reader) ── */}
      <div aria-live="polite" aria-atomic="true" style={{ position: "absolute", left: "-9999px" }}>
        {statusMsg}
      </div>

      {/* ── Main ── */}
      <main id="main-content" style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: "700", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
            Your courses
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
            Navigate by voice or keyboard. Say "help" for all commands.
          </p>
        </div>

        {/* Voice transcript live display */}
        {voiceActive && (
          <div style={{
            background: "#1e293b", border: `1px solid ${listening ? "#22c55e" : "#334155"}`,
            borderRadius: "12px", padding: "14px 20px", marginBottom: "28px",
            display: "flex", alignItems: "center", gap: "12px",
          }}
            role="status" aria-live="polite"
          >
            <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  width: "3px", height: listening ? `${8 + i * 6}px` : "4px",
                  background: listening ? "#4ade80" : "#334155",
                  borderRadius: "999px",
                  transition: "height 0.2s",
                  animation: listening ? `bar${i} 0.8s ease-in-out infinite` : "none",
                }} />
              ))}
            </div>
            <span style={{ fontSize: "14px", color: transcript ? "#f1f5f9" : "#475569", fontStyle: transcript ? "normal" : "italic" }}>
              {transcript || (listening ? 'Listening — say "help" for commands' : "Voice commands paused")}
            </span>
          </div>
        )}

        {/* Quick commands reference */}
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", padding: "16px 20px", marginBottom: "32px" }}>
          <p style={{ fontSize: "12px", color: "#475569", fontWeight: "600", margin: "0 0 10px", letterSpacing: "0.5px" }}>VOICE COMMANDS</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
            {[
              { cmd: '"list courses"', desc: "Hear all courses" },
              { cmd: '"open course 1"', desc: "Open by number" },
              { cmd: '"my progress"', desc: "Hear your stats" },
              { cmd: '"stop"', desc: "Stop narration" },
              { cmd: '"repeat"', desc: "Repeat last message" },
              { cmd: '"sign out"', desc: "Log out" },
            ].map(({ cmd, desc }) => (
              <div key={cmd} style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
                <code style={{ fontSize: "12px", color: "#60a5fa", background: "#0f172a", padding: "2px 6px", borderRadius: "4px", flexShrink: 0 }}>{cmd}</code>
                <span style={{ fontSize: "12px", color: "#64748b" }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "32px", flexWrap: "wrap" }}>
          {[
            { label: "Total", value: courses.length, color: "#60a5fa" },
            { label: "In progress", value: Object.values(progress).filter(p => p.completion > 0 && p.completion < 100).length, color: "#facc15" },
            { label: "Completed", value: Object.values(progress).filter(p => p.completion === 100).length, color: "#4ade80" },
          ].map(s => (
            <div key={s.label} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "14px 20px" }}>
              <div style={{ fontSize: "24px", fontWeight: "700", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Courses */}
        {loading ? (
          <div role="status" aria-live="polite" style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
            Loading your courses...
          </div>
        ) : courses.length === 0 ? (
          <div role="status" aria-live="polite" style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
            No courses available yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }} role="list" aria-label="Available courses">
            {courses.map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                index={i}
                progress={progress[course.id]}
                onOpen={handleOpenCourse}
                speak={speak}
              />
            ))}
          </div>
        )}
      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes bar1  { 0%,100%{height:8px}  50%{height:16px} }
        @keyframes bar2  { 0%,100%{height:14px} 50%{height:6px}  }
        @keyframes bar3  { 0%,100%{height:10px} 50%{height:18px} }
        *:focus-visible { outline: 3px solid #60a5fa !important; outline-offset: 3px; }
      `}</style>
    </div>
  );
}