import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { useVoiceAssistant } from "../hooks/useVoice";

// ── MOCK DATA MATCHING PLATFORM ──
const MOCK_COURSES = [
  {
    id: "course-1",
    title: "American Sign Language Alphabet",
    description: "Learn to spell your name and master the basic letters (A-Z) in American Sign Language.",
    video: "5K69_tq-0pQ",
    category: "language",
    instructor: "Sarah Jenkins, ASL Specialist",
    duration: "1h 15m",
    level: "Beginner",
    rating: 4.8,
    badge: "Audio-Described",
    lessons: [
      { id: "les-1-1", title: "Introduction to Fingerspelling", content: "Fingerspelling is the manual representation of letters. Start by keeping your wrist stable and your elbow near your body.", duration: "12 mins", video: "5K69_tq-0pQ" },
      { id: "les-1-2", title: "Letters A to J Practice", content: "Master A, B, C, D, E, F, G, H, I, and J. Note the shape differences between A, E, and S which are common finger spelling pitfalls.", duration: "20 mins", video: "5K69_tq-0pQ" },
      { id: "les-1-3", title: "Letters K to T Practice", content: "Practice letters K to T. Keep check of how K uses the thumb on the middle finger and P is just a downward-facing K.", duration: "20 mins", video: "5K69_tq-0pQ" },
      { id: "les-1-4", title: "Letters U to Z & Double Letters", content: "Complete the alphabet. Z is traced in the air with your index finger. When spelling double letters, bounce or slide slightly outward.", duration: "23 mins", video: "5K69_tq-0pQ" }
    ],
    quiz: {
      question: "Which letter in ASL is signed by tracing the shape of the letter in the air with your index finger?",
      options: ["A", "J", "X", "Z"],
      answer: "Z"
    }
  },
  {
    id: "course-2",
    title: "Basic ASL Sentences & Greetings",
    description: "Essential greetings, common expressions, and simple conversational starters in sign language.",
    video: "ianCxd71Uzg",
    category: "language",
    instructor: "Sarah Jenkins, ASL Specialist",
    duration: "2h 30m",
    level: "Beginner",
    rating: 4.9,
    badge: "Voice-Assistant Ready",
    lessons: [
      { id: "les-2-1", title: "Meeting People & Basic Greetings", content: "Learn 'Hello', 'Good Morning', 'What's your name?', and 'Nice to meet you'. Remember to smile as facial expressions carry grammatical weight.", duration: "30 mins", video: "ianCxd71Uzg" },
      { id: "les-2-2", title: "Expressing Emotions & Feelings", content: "Sign 'Happy', 'Sad', 'Tired', 'Fine', and 'Excited'. Facial expressions are critical—they form the vocal inflection of ASL.", duration: "45 mins", video: "ianCxd71Uzg" },
      { id: "les-2-3", title: "Simple Inquiries & Question Shapes", content: "Asking questions in ASL requires specific eyebrow movements. Lower eyebrows for Wh-questions and raise them for Yes/No questions.", duration: "45 mins", video: "ianCxd71Uzg" },
      { id: "les-2-4", title: "Practice Dialogue & Handshapes", content: "Interactive review. Tie all vocabulary together in a simple greeting dialogue. Make sure to establish a signing space.", duration: "30 mins", video: "ianCxd71Uzg" }
    ],
    quiz: {
      question: "What eyebrow shape is grammatically correct when signing a WH-question in ASL?",
      options: ["Eyebrows raised", "Eyebrows lowered/furrowed", "Eyebrows held neutral", "One eyebrow raised, one lowered"],
      answer: "Eyebrows lowered/furrowed"
    }
  },
  {
    id: "course-3",
    title: "Sign Language: Numbers & Colors",
    description: "Learn the fundamentals of counting, expressions, and identifying colors in ASL.",
    video: "Raa0IvPnPhg",
    category: "vocabulary",
    instructor: "David Vance, Deaf Educator",
    duration: "1h 45m",
    level: "Intermediate",
    rating: 4.7,
    badge: "Audio-Described",
    lessons: [
      { id: "les-3-1", title: "Numbers 1-10 in Sign", duration: "25 mins", content: "Learn to sign numbers 1 to 10. Note that for numbers 1 to 5, your palm faces inward towards your body.", video: "Raa0IvPnPhg" },
      { id: "les-3-2", title: "Numbers 11-20 & Counting Patterns", duration: "30 mins", content: "Flicking and tapping motions for numbers 11 through 20. Palm orientation flips outward for numbers starting from 11.", video: "Raa0IvPnPhg" },
      { id: "les-3-3", title: "Visual Spectrum: Colors in Sign", duration: "25 mins", content: "Signing 'Red', 'Blue', 'Yellow', 'Green', 'Purple'. Colors often involve shaking the initial letter handshape.", video: "Raa0IvPnPhg" }
    ],
    quiz: {
      question: "Which way should your palm face when signing the numbers 1 through 5 in ASL?",
      options: ["Facing outward towards the listener", "Facing inward towards yourself", "Facing sideways to the right", "Facing sideways to the left"],
      answer: "Facing inward towards yourself"
    }
  },
  {
    id: "course-4",
    title: "Advanced Conversational Sign Language",
    description: "Improve your signing speed, sentence syntax, and understand advanced non-manual markers.",
    video: "0FcwzLiXpNY",
    category: "syntax",
    instructor: "David Vance, Deaf Educator",
    duration: "3h 10m",
    level: "Advanced",
    rating: 4.6,
    badge: "Fluency Verified",
    lessons: [
      { id: "les-4-1", title: "Non-Manual Signs & Facial Expressions", duration: "45 mins", content: "Learn to communicate structure and urgency. Learn mouth morphemes like 'cha' (large) and 'oo' (small).", video: "0FcwzLiXpNY" },
      { id: "les-4-2", title: "ASL Grammar: Topic-Comment Structure", duration: "50 mins", content: "Understand subject-object syntax. In ASL, the topic is stated first with raised eyebrows, followed by the comment.", video: "0FcwzLiXpNY" },
      { id: "les-4-3", title: "Directional Verbs & Classifiers", duration: "55 mins", content: "Show action visually using directional signs like 'help' or 'give' where the movement direction indicates who is giving/helping whom.", video: "0FcwzLiXpNY" }
    ],
    quiz: {
      question: "How is the topic established in an ASL Topic-Comment sentence structure?",
      options: ["Signing it last", "Signing it first with lowered eyebrows", "Signing it first with raised eyebrows", "Spelling it letter-by-letter"],
      answer: "Signing it first with raised eyebrows"
    }
  }
];

// ── Text-to-Speech Engine ──
function useTTS() {
  const { speak, stop, agentState } = useVoiceAssistant();
  const speaking = agentState === "SPEAKING";

  const speakText = useCallback((text, priority = false) => {
    speak(text);
  }, [speak]);

  return { speak: speakText, stop, speaking };
}

// ── Voice Commands Engine ──
function useVoiceCommands(commands, active) {
  const { registerContext, transcript, listening, setTranscript } = useVoiceAssistant();
  const commandsRef = useRef(commands);
  const contextIdRef = useRef(`BLIND_DASHBOARD_${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  useEffect(() => {
    const unregister = registerContext(contextIdRef.current, (spokenText) => {
      setTranscript(spokenText);
      const text = spokenText.toLowerCase().trim();
      for (const [pattern, handler] of Object.entries(commandsRef.current)) {
        if (text.includes(pattern)) {
          handler(spokenText);
          break;
        }
      }
    }, active);
    return () => unregister();
  }, [registerContext, active, setTranscript]);

  return { listening, transcript };
}

export default function BlindDashboard() {
  const { user, logout, DEMO_MODE } = useAuth();
  const { speak, stop, speaking } = useTTS();

  // Navigation tab states
  const [activeTab, setActiveTab] = useState("home"); // home, courses, my-learning, ai-tutor, activity, profile, settings
  const [selectedCourse, setSelectedCourse] = useState(null); // Course detail modal
  const [activeCoursePlay, setActiveCoursePlay] = useState(null); // Course Player
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);

  // Lists & Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [courses, setCourses] = useState(MOCK_COURSES);
  const [purchasedIds, setPurchasedIds] = useState(["course-1", "course-2"]);
  const [progress, setProgress] = useState({
    "course-1": { completion: 75 },
    "course-2": { completion: 25 }
  });

  // AI Tutor chat states
  const [chatMessages, setChatMessages] = useState([
    { sender: "ai", text: "Hello! I am your AccessAI Audio Tutor. Ask me any question. Every answer will be spoken out loud." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [aiTutorTab, setAiTutorTab] = useState("chat"); // chat, homework, quiz-gen
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(true);

  // Settings
  const [ttsSpeed, setTtsSpeed] = useState("normal"); // slow, normal, fast
  const [contrastTheme, setContrastTheme] = useState("high-contrast"); // high-contrast, standard-dark
  const [fontSize, setFontSize] = useState("xxl"); // xl, xxl
  const [voiceActive, setVoiceActive] = useState(true);

  // Status announce region
  const [statusMsg, setStatusMsg] = useState("");
  const announcedRef = useRef(false);

  // Load database courses
  useEffect(() => {
    if (DEMO_MODE) return;
    const fetchDB = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          API.get("/courses"),
          API.get(`/progress/${user?.uid}`)
        ]);
        if (cRes.data?.courses?.length > 0) {
          const aslCourses = cRes.data.courses.filter(c => 
            c.category === "language" || 
            c.category === "vocabulary" || 
            c.category === "syntax"
          );
          if (aslCourses.length > 0) setCourses(aslCourses);
        }
        if (pRes.data?.progress) {
          const pMap = {};
          pRes.data.progress.forEach(p => { pMap[p.courseId] = p; });
          setProgress(pMap);
        }
      } catch (e) {
        console.warn("Could not fetch remote courses. Local mocks loaded.");
      }
    };
    fetchDB();
  }, [user?.uid, DEMO_MODE]);

  // Audio introduction
  useEffect(() => {
    if (!announcedRef.current) {
      announcedRef.current = true;
      setTimeout(() => {
        speak(`Welcome to your AccessAI audio platform, Aman. Navigation tabs are high contrast and voice-guided. Focus on any option to hear its details. Say help to list all voice commands.`, true);
      }, 700);
    }
  }, [speak]);

  // Helper trigger to announce screen change
  const navigateTo = (tabName, announceText) => {
    setActiveTab(tabName);
    setSelectedCourse(null);
    setActiveCoursePlay(null);
    speak(announceText, true);
    setStatusMsg(announceText);
  };

  const handleBuyCourse = (courseId) => {
    if (purchasedIds.includes(courseId)) return;
    setPurchasedIds(prev => [...prev, courseId]);
    setProgress(prev => ({ ...prev, [courseId]: { completion: 0 } }));
    speak("Course enrolled. You can now start listening to lessons.");
  };

  const updateProgress = (courseId, pct) => {
    setProgress(prev => ({
      ...prev,
      [courseId]: { ...prev[courseId], completion: pct }
    }));
  };

  // AI Tutor operations
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = { sender: "user", text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");

    setTimeout(() => {
      let reply = "In ASL, handshapes combined with non-manual expressions translate grammatical syntax. Focus on letter orientation.";
      if (chatInput.toLowerCase().includes("alphabet") || chatInput.toLowerCase().includes("abc")) {
        reply = "The alphabet fingerspelling uses 1 hand. Make sure to hold your hand still when spelling names.";
      } else if (chatInput.toLowerCase().includes("double") || chatInput.toLowerCase().includes("ll")) {
        reply = "For double letters like LL or OO, bounce your hand twice or slide it slightly to the side.";
      } else if (chatInput.toLowerCase().includes("quiz")) {
        reply = " Auditory quiz generated: What palm direction is correct for numbers 1 to 5? Palm facing inward, or palm facing outward?";
      }
      setChatMessages(prev => [...prev, { sender: "ai", text: reply }]);
      speak(reply, true);
    }, 1000);
  };

  const handleQuickQuestion = (qText) => {
    setChatInput(qText);
    setTimeout(() => handleSendMessage(), 150);
  };

  // Filters catalog
  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || c.category === category;
    const matchesDifficulty = difficulty === "all" || c.level.toLowerCase() === difficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Global voice commands (low vision/blind friendly navigation)
  const { listening, transcript } = useVoiceCommands({
    "go to home": () => navigateTo("home", "Navigated to Home Dashboard."),
    "go to courses": () => navigateTo("courses", "Navigated to Courses Library."),
    "go to library": () => navigateTo("courses", "Navigated to Courses Library."),
    "go to learning": () => navigateTo("my-learning", "Navigated to Enrolled Courses."),
    "go to tutor": () => navigateTo("ai-tutor", "Navigated to Audio AI Tutor."),
    "go to activity": () => navigateTo("activity", "Navigated to Activity Dashboard."),
    "go to profile": () => navigateTo("profile", "Navigated to Profile and certificates page."),
    "go to settings": () => navigateTo("settings", "Navigated to Accessibility settings."),
    "list courses": () => {
      const list = courses.map((c, i) => `Course ${i + 1}: ${c.title}`).join(". ");
      speak(`Here are the courses: ${list}. Say open course 1 to start.`, true);
    },
    "open course 1": () => { setSelectedCourse(courses[0]); speak("Opening details for American Sign Language Alphabet."); },
    "open course 2": () => { setSelectedCourse(courses[1]); speak("Opening details for Basic ASL Sentences."); },
    "open course 3": () => { setSelectedCourse(courses[2]); speak("Opening details for Numbers and Colors."); },
    "open course 4": () => { setSelectedCourse(courses[3]); speak("Opening details for Advanced Conversational ASL."); },
    "sign out": () => { speak("Signing out. Redirecting to landing page."); setTimeout(logout, 1200); },
    "stop": () => stop(),
    "help": () => speak("Commands: go to home, go to courses, go to learning, go to tutor, go to activity, go to settings, list courses, open course 1, stop, sign out.")
  }, voiceActive && !speaking);

  return (
    <div 
      className={`min-h-screen bg-[#050810] text-[#f1f5f9] font-sans flex relative ${
        fontSize === "xxl" ? "text-lg" : "text-base"
      }`}
    >
      {/* Visual glowing layout lines for low-vision contrast guidance */}
      {contrastTheme === "high-contrast" && (
        <div className="absolute inset-0 border-[6px] border-[#fbbf24] pointer-events-none z-[9999]" />
      )}

      {/* ARIA live region for screen readers */}
      <div role="status" aria-live="assertive" className="sr-only">{statusMsg}</div>

      {/* ── HIGH CONTRAST ACCESSIBLE SIDEBAR ── */}
      <aside 
        role="navigation"
        aria-label="Sidebar navigation"
        className={`w-80 flex flex-col justify-between sticky top-0 h-screen z-50 backdrop-blur-xl border-r ${
          contrastTheme === "high-contrast" ? "bg-black border-[#fbbf24]" : "bg-[#090d16]/95 border-white/5"
        }`}
      >
        <div className="p-6 flex flex-col gap-6">
          <div 
            onClick={() => navigateTo("home", "Navigated to Home Dashboard.")}
            className="flex flex-col gap-1 cursor-pointer"
            tabIndex={0}
            aria-label="AccessAI Blind Mode logo. Link to Home."
            onFocus={() => speak("AccessAI home logo link.")}
          >
            <span className="text-2xl font-black text-[#fbbf24] tracking-tight">AccessAI</span>
            <span className="self-start text-[10px] font-black uppercase tracking-widest bg-yellow-400/20 text-[#fbbf24] border border-[#fbbf24]/50 px-2.5 py-0.5 rounded-full">
              BLIND MODE
            </span>
          </div>

          <nav className="flex flex-col gap-2">
            {[
              { id: "home", label: "Home Dashboard", icon: "home", desc: "View daily stats and active courses." },
              { id: "courses", label: "Course Library", icon: "grid_view", desc: "Explore catalog. Press to browse." },
              { id: "my-learning", label: "My Learning", icon: "menu_book", desc: "View enrolled and continue lessons." },
              { id: "ai-tutor", label: "Audio AI Tutor", icon: "smart_toy", desc: "Chat verbally or generate exam review." },
              { id: "activity", label: "Activity Stats", icon: "analytics", desc: "Listen to weekly learning logs." },
              { id: "profile", label: "Profile & Badges", icon: "account_circle", desc: "View completion credentials." },
              { id: "settings", label: "Settings Adaptive", icon: "tune", desc: "Configure speech speeds and contrast themes." }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => navigateTo(tab.id, `Navigated to ${tab.label}.`)}
                onFocus={() => speak(`${tab.label}. ${tab.desc}`)}
                aria-label={`${tab.label}. ${tab.desc}`}
                aria-pressed={activeTab === tab.id}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left text-sm font-black transition-all ${
                  activeTab === tab.id 
                    ? "bg-[#fbbf24] text-black border-[#fbbf24] shadow-xl" 
                    : "text-slate-300 hover:text-white border-2 border-transparent hover:border-yellow-400 bg-slate-900/60"
                }`}
              >
                <span className="material-symbols-outlined !text-xl">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-white/10 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#fbbf24] text-black flex items-center justify-center font-black text-sm">
              AH
            </div>
            <div>
              <p className="text-xs font-bold text-[#fbbf24]">Aman Halkude</p>
              <p className="text-[10px] text-slate-400">Audio Navigator</p>
            </div>
          </div>
          <button
            onClick={logout}
            onFocus={() => speak("Sign Out button. Press enter to log out.")}
            aria-label="Sign Out"
            className="w-full py-3 bg-red-950 border border-red-500/50 hover:bg-red-900 text-red-300 font-bold rounded-xl text-center text-xs"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN AUDITORY AND VISUAL AREA ── */}
      <main className="flex-1 min-h-screen overflow-y-auto p-8 relative flex flex-col gap-6">
        
        {/* Status indicator banner */}
        <div className="flex justify-between items-center bg-black border-2 border-[#fbbf24]/50 p-4 rounded-xl">
          <div className="flex gap-4 items-center">
            {voiceActive && listening && (
              <div className="flex items-center gap-2 text-[#fbbf24] text-xs font-black uppercase">
                <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] animate-ping" />
                Mic Enabled
              </div>
            )}
            <span className="text-xs font-bold text-slate-400">TTS Audio Feedback: ACTIVE</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setVoiceActive(v => !v);
                speak(voiceActive ? "Voice recognition disabled." : "Voice recognition activated.");
              }}
              onFocus={() => speak("Voice Assistant toggle button.")}
              className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                voiceActive ? "bg-[#fbbf24] text-black border-[#fbbf24]" : "bg-slate-900 text-slate-400 border-white/5"
              }`}
            >
              Voice: {voiceActive ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => {
                const nextT = contrastTheme === "high-contrast" ? "standard-dark" : "high-contrast";
                setContrastTheme(nextT);
                speak(`Theme updated to ${nextT === "high-contrast" ? "high contrast yellow" : "standard dark mode"}.`);
              }}
              onFocus={() => speak("Contrast theme selector.")}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-900 border border-white/10 text-slate-300"
            >
              Toggle Contrast Theme
            </button>
          </div>
        </div>

        {voiceActive && transcript && (
          <div className="bg-emerald-950/40 border border-emerald-500 text-emerald-400 p-4 rounded-xl text-xs font-bold">
            Voice Heard: "{transcript}"
          </div>
        )}

        {/* 1. HOME DASHBOARD VIEW */}
        {activeTab === "home" && !selectedCourse && !activeCoursePlay && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Header welcome */}
            <div className="bg-slate-950 border-2 border-[#fbbf24] p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex flex-col gap-2 max-w-xl">
                <h1 className="text-3xl font-black text-[#fbbf24]" tabIndex={0} onFocus={() => speak("Welcome back, Aman. Get ready to expand your auditory and sign library.")}>Hello, Aman!</h1>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Every element announces details on focus. Use your keyboard TAB/SHIFT-TAB keys to jump inputs, or dictate navigation using speech.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="bg-slate-900 border border-[#fbbf24]/50 px-5 py-3 rounded-2xl flex flex-col items-center">
                  <span className="text-2xl font-bold text-yellow-400">7🔥</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Streak</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                tabIndex={0} 
                onFocus={() => speak("Goal progress card. Daily goal: 30 minutes. You have completed 83% of your goal today.")}
                className="bg-slate-900 border-2 border-white/10 p-6 rounded-2xl flex flex-col gap-3"
              >
                <h3 className="text-xs font-black text-[#fbbf24] uppercase tracking-wider">Goal progress</h3>
                <p className="text-sm font-bold">Completed: 25 minutes of 30 minutes (83%)</p>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-white/20">
                  <div className="h-full bg-[#fbbf24]" style={{ width: "83%" }} />
                </div>
              </div>

              <div 
                tabIndex={0}
                onFocus={() => speak("AI Study Companion card. Launch the AI Tutor page to practice vocabulary questions verbally.")}
                className="bg-slate-900 border-2 border-white/10 p-6 rounded-2xl flex flex-col justify-between gap-4"
              >
                <div>
                  <h3 className="text-xs font-black text-[#fbbf24] uppercase tracking-wider">AI Speech Tutor</h3>
                  <p className="text-xs text-slate-400 mt-2">Generate vocal quizzes and code summaries instantly.</p>
                </div>
                <button
                  onClick={() => navigateTo("ai-tutor", "Opening AI Tutor chat.")}
                  onFocus={() => speak("Launch AI Tutor page button.")}
                  className="py-3 bg-[#fbbf24] text-black font-black text-xs rounded-xl"
                >
                  Start Audio AI Chat
                </button>
              </div>
            </div>

            {/* Enrolled resume list */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-black text-[#fbbf24]">Enrolled Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.filter(c => purchasedIds.includes(c.id)).map(course => {
                  const pct = progress[course.id]?.completion || 0;
                  return (
                    <div 
                      key={course.id} 
                      className="bg-slate-900 border-2 border-white/10 rounded-2xl p-6 flex flex-col justify-between gap-4"
                      tabIndex={0}
                      onFocus={() => speak(`Enrolled course: ${course.title}. Progress: ${pct} percent. Focus down to resume player.`)}
                    >
                      <div>
                        <h3 className="text-base font-bold text-[#fbbf24]">{course.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{course.description}</p>
                      </div>
                      <div>
                        <button
                          onClick={() => { setActiveCoursePlay(course); setCurrentLessonIdx(0); speak(`Loading audio course player for ${course.title}.`); }}
                          onFocus={() => speak(`Resume learning course ${course.title} button.`)}
                          className="w-full py-3 bg-[#fbbf24] text-black font-black text-xs rounded-xl"
                        >
                          Launch Player ({pct}% Complete)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. COURSE LIBRARY VIEW */}
        {activeTab === "courses" && !selectedCourse && !activeCoursePlay && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-black text-[#fbbf24]">Explore Course Catalog</h1>
              <p className="text-xs text-slate-400">Audio-described courses supporting full voice integration.</p>
            </div>

            {/* Keyboard-accessible categories */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black border-2 border-white/10 p-3 rounded-xl">
              {[
                { id: "all", label: "📚 All Classes" },
                { id: "language", label: "🤟 ASL Lessons" },
                { id: "syntax", label: "✍️ ASL Grammar" }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); speak(`Filtered catalog by ${cat.label}`); }}
                  onFocus={() => speak(`Filter category: ${cat.label} button.`)}
                  className={`py-3 px-4 rounded-xl text-xs font-black border-2 ${
                    category === cat.id ? "bg-[#fbbf24] text-black border-[#fbbf24]" : "bg-slate-900 border-white/5 text-slate-300"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            <div className="flex flex-col gap-4">
              {filteredCourses.map((course, idx) => {
                const isOwned = purchasedIds.includes(course.id);
                return (
                  <div 
                    key={course.id}
                    className="p-6 bg-slate-900 border-2 border-white/10 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-yellow-400 transition-all"
                    tabIndex={0}
                    onFocus={() => speak(`Course ${idx + 1}: ${course.title}. Instructor: ${course.instructor}. Level: ${course.level}. Duration: ${course.duration}. ${isOwned ? "Enrolled." : "Click to view details and buy."}`)}
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#fbbf24]">{course.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{course.description}</p>
                      <div className="flex gap-4 text-[10px] font-bold text-slate-500 mt-2 uppercase">
                        <span>Instructor: {course.instructor}</span>
                        <span>Level: {course.level}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setSelectedCourse(course)}
                        onFocus={() => speak(`View course details and lessons for ${course.title} button.`)}
                        className="px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-xs font-bold text-white flex-1 sm:flex-none"
                      >
                        Syllabus Details
                      </button>
                      {!isOwned && (
                        <button
                          onClick={() => handleBuyCourse(course.id)}
                          onFocus={() => speak(`Enroll in ${course.title} for 9.99 dollars button.`)}
                          className="px-4 py-3 bg-[#fbbf24] text-black rounded-xl text-xs font-black flex-1 sm:flex-none"
                        >
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. MY LEARNING VIEW */}
        {activeTab === "my-learning" && !selectedCourse && !activeCoursePlay && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div>
              <h1 className="text-2xl font-black text-[#fbbf24]">My Enrolled Courses</h1>
              <p className="text-xs text-slate-400">Launch audio players or review quizzes.</p>
            </div>

            <div className="flex flex-col gap-4">
              {courses.filter(c => purchasedIds.includes(c.id)).map(course => {
                const pct = progress[course.id]?.completion || 0;
                return (
                  <div 
                    key={course.id}
                    className="p-6 bg-slate-900 border-2 border-white/10 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    tabIndex={0}
                    onFocus={() => speak(`Enrolled Course: ${course.title}. You are ${pct} percent done.`)}
                  >
                    <div>
                      <h3 className="text-base font-bold text-[#fbbf24]">{course.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{course.instructor} · completion rate {pct}%</p>
                    </div>
                    <button
                      onClick={() => { setActiveCoursePlay(course); setCurrentLessonIdx(0); speak(`Opening course player for ${course.title}.`); }}
                      onFocus={() => speak(`Launch audio course player for ${course.title} button.`)}
                      className="px-6 py-3 bg-[#fbbf24] text-black font-black rounded-xl text-xs"
                    >
                      Launch Course Player
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. COURSE DETAILS VIEW */}
        {selectedCourse && !activeCoursePlay && (
          <div className="flex flex-col gap-6 animate-fadeIn max-w-3xl mx-auto w-full">
            <button
              onClick={() => setSelectedCourse(null)}
              onFocus={() => speak("Back to course catalog button.")}
              className="self-start text-xs font-bold text-[#fbbf24] hover:underline"
            >
              ◀ Back to catalog
            </button>

            <div 
              className="bg-slate-950 border-2 border-[#fbbf24] p-8 rounded-3xl"
              tabIndex={0}
              onFocus={() => speak(`Syllabus overview. Course: ${selectedCourse.title}. Description: ${selectedCourse.description}. Level is ${selectedCourse.level}. Duration is ${selectedCourse.duration}.`)}
            >
              <h1 className="text-2xl font-black text-[#fbbf24]">{selectedCourse.title}</h1>
              <p className="text-xs text-slate-400 mt-2">{selectedCourse.description}</p>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-bold text-[#fbbf24]">Syllabus lessons</h2>
              {selectedCourse.lessons.map((lesson, idx) => (
                <div 
                  key={lesson.id} 
                  className="p-4 bg-slate-900 border border-white/5 rounded-xl flex justify-between"
                  tabIndex={0}
                  onFocus={() => speak(`Lesson ${idx + 1}: ${lesson.title}. Duration: ${lesson.duration}`)}
                >
                  <span className="text-xs font-bold">0{idx + 1}. {lesson.title}</span>
                  <span className="text-xs text-slate-500">{lesson.duration}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (!purchasedIds.includes(selectedCourse.id)) {
                  handleBuyCourse(selectedCourse.id);
                }
                setActiveCoursePlay(selectedCourse);
                setCurrentLessonIdx(0);
                setSelectedCourse(null);
              }}
              onFocus={() => speak("Enroll and launch player button.")}
              className="w-full py-4 bg-[#fbbf24] text-black font-black rounded-xl text-center text-sm"
            >
              Enroll & Start Learning
            </button>
          </div>
        )}

        {/* 5. COURSE PLAYER & LESSON NARRATOR */}
        {activeCoursePlay && (
          <div className="flex flex-col gap-6 animate-fadeIn max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-center border-b border-[#fbbf24] pb-4">
              <button
                onClick={() => setActiveCoursePlay(null)}
                onFocus={() => speak("Close course player button.")}
                className="px-4 py-2 bg-red-950 border border-red-500 text-red-300 font-bold text-xs rounded-lg"
              >
                ✕ Close Player
              </button>
              <div className="text-right text-xs">
                <span className="text-slate-400">Lesson {currentLessonIdx + 1} of {activeCoursePlay.lessons.length}</span>
                <p className="text-[#fbbf24] font-black">{activeCoursePlay.lessons[currentLessonIdx].title}</p>
              </div>
            </div>

            {/* Speech Player controller triggers */}
            <div className="bg-slate-900 border-2 border-white/10 p-8 rounded-2xl flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#fbbf24] animate-bounce">settings_voice</span>
                <span className="text-xs font-bold text-[#fbbf24] uppercase">Narrator audio playback is active</span>
              </div>
              <p 
                className="text-base text-slate-200 leading-relaxed font-semibold bg-black/60 p-6 rounded-xl border border-white/5"
                tabIndex={0}
                onFocus={() => speak(`Lesson text narrator. Content: ${activeCoursePlay.lessons[currentLessonIdx].content}. Focus down to repeat or step lessons.`)}
              >
                {activeCoursePlay.lessons[currentLessonIdx].content}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => speak(activeCoursePlay.lessons[currentLessonIdx].content, true)}
                  onFocus={() => speak("Repeat audio narration button.")}
                  className="py-3 bg-slate-800 border border-white/10 rounded-xl text-xs font-bold text-white"
                >
                  ↺ Repeat Audio
                </button>
                <button
                  disabled={currentLessonIdx === 0}
                  onClick={() => setCurrentLessonIdx(i => i - 1)}
                  onFocus={() => speak("Previous lesson button.")}
                  className="py-3 bg-slate-800 border border-white/10 rounded-xl text-xs font-bold text-white disabled:opacity-30"
                >
                  ◀ Previous Lesson
                </button>
                <button
                  disabled={currentLessonIdx === activeCoursePlay.lessons.length - 1}
                  onClick={() => {
                    setCurrentLessonIdx(i => i + 1);
                    const nextP = Math.round(((currentLessonIdx + 1) / activeCoursePlay.lessons.length) * 100);
                    updateProgress(activeCoursePlay.id, nextP);
                  }}
                  onFocus={() => speak("Next lesson button.")}
                  className="py-3 bg-[#fbbf24] text-black font-black text-xs rounded-xl disabled:opacity-30"
                >
                  Next Lesson ▶
                </button>
              </div>
            </div>

            {/* Auditory Quiz block */}
            <div className="bg-slate-900 border-2 border-white/10 p-6 rounded-xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-[#fbbf24] uppercase">Auditory Quiz check</h3>
              <p className="text-xs font-bold text-slate-200 leading-relaxed">{activeCoursePlay.quiz.question}</p>
              
              <div className="flex flex-col gap-2">
                {activeCoursePlay.quiz.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      const isCorrect = opt === activeCoursePlay.quiz.answer;
                      if (isCorrect) {
                        speak("Correct answer! Congratulations.");
                        updateProgress(activeCoursePlay.id, 100);
                      } else {
                        speak("Wrong answer. Try again.");
                      }
                    }}
                    onFocus={() => speak(`Option: ${opt} button.`)}
                    className="w-full py-3.5 px-4 bg-slate-950 hover:bg-slate-900 border border-white/10 hover:border-yellow-400 rounded-xl text-left text-xs text-slate-300 font-bold"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. AI NARRATOR VOICE TUTOR */}
        {activeTab === "ai-tutor" && (
          <div className="flex flex-col gap-6 animate-fadeIn max-w-3xl mx-auto w-full h-[calc(100vh-140px)]">
            <div className="border-b border-[#fbbf24] pb-4">
              <h1 className="text-2xl font-black text-[#fbbf24]">AccessAI Audio Tutor</h1>
              <p className="text-xs text-slate-400">Dicatate your question and AI responses will be narrated out loud.</p>
            </div>

            <div className="flex gap-2 bg-black border border-white/10 p-2 rounded-xl">
              {[
                { id: "chat", label: "Auditory Chat", icon: "forum" },
                { id: "homework", label: "Upload Code Help", icon: "school" }
              ].map(subT => (
                <button
                  key={subT.id}
                  onClick={() => setAiTutorTab(subT.id)}
                  onFocus={() => speak(`Sub tab ${subT.label} button.`)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg ${
                    aiTutorTab === subT.id ? "bg-[#fbbf24] text-black" : "text-slate-400"
                  }`}
                >
                  {subT.label}
                </button>
              ))}
            </div>

            {aiTutorTab === "chat" && (
              <div className="flex-1 flex flex-col justify-between gap-4 overflow-hidden">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-white/10 pb-2">
                  <button
                    onClick={() => handleQuickQuestion("Explain fingerspelling LL double letters")}
                    onFocus={() => speak("Ask prompt about double letters button.")}
                    className="p-3 bg-slate-900 border border-white/5 rounded-xl text-xs text-left text-[#fbbf24] font-bold"
                  >
                    Prompt: Fingerspelling double letters?
                  </button>
                  <button
                    onClick={() => handleQuickQuestion("Generate auditory vocabulary quiz")}
                    onFocus={() => speak("Ask to generate custom quiz button.")}
                    className="p-3 bg-slate-900 border border-white/5 rounded-xl text-xs text-left text-[#fbbf24] font-bold"
                  >
                    Prompt: Generate vocal quiz?
                  </button>
                </div>

                {/* Chat content scroll */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-4 py-2 pr-2">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div 
                        className={`max-w-xl p-4 rounded-xl text-xs leading-relaxed ${
                          msg.sender === "user" 
                            ? "bg-[#fbbf24] text-black font-black" 
                            : "bg-slate-900 border-2 border-white/10 text-slate-350"
                        }`}
                        tabIndex={0}
                        onFocus={() => speak(`${msg.sender === "user" ? "You asked" : "AI tutor replied"}: ${msg.text}`)}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat text input */}
                <div className="flex gap-3 bg-black border-2 border-[#fbbf24] p-3 rounded-2xl items-center">
                  <button 
                    onClick={() => {
                      const next = !isVoiceChatActive;
                      setIsVoiceChatActive(next);
                      speak(next ? "Voice recording mic activated." : "Mic muted.");
                    }}
                    onFocus={() => speak("Voice dictation toggle mic button.")}
                    className={`p-3 rounded-xl ${
                      isVoiceChatActive ? "bg-emerald-600 text-white animate-pulse" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="material-symbols-outlined !text-base">settings_voice</span>
                  </button>
                  <input
                    type="text"
                    placeholder="Type or dictate a query..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 bg-transparent text-xs outline-none text-white placeholder-slate-600"
                  />
                  <button 
                    onClick={handleSendMessage} 
                    onFocus={() => speak("Send message button.")}
                    className="p-3 bg-[#fbbf24] text-black rounded-xl"
                  >
                    <span className="material-symbols-outlined !text-sm">send</span>
                  </button>
                </div>
              </div>
            )}

            {aiTutorTab === "homework" && (
              <div 
                className="bg-slate-900 border-2 border-white/10 p-8 rounded-2xl flex flex-col gap-4 text-center cursor-pointer"
                onClick={() => speak("Audio file select dialog prompt loading.")}
                tabIndex={0}
                onFocus={() => speak("Upload homework or audio scripts. Press enter to upload.")}
              >
                <span className="material-symbols-outlined !text-4xl text-[#fbbf24] animate-pulse">cloud_upload</span>
                <p className="text-xs font-black">Press Enter to select file or drop text lessons logs</p>
              </div>
            )}
          </div>
        )}

        {/* 7. ACTIVITY DASHBOARD VIEW */}
        {activeTab === "activity" && (
          <div className="flex flex-col gap-6 animate-fadeIn max-w-4xl mx-auto w-full">
            <div>
              <h1 className="text-2xl font-black text-[#fbbf24]">Study Activity Records</h1>
              <p className="text-xs text-slate-400">Verbal review logs of weekly completed minutes.</p>
            </div>

            <div 
              className="bg-slate-900 border-2 border-white/10 p-6 rounded-2xl flex flex-col gap-4"
              tabIndex={0}
              onFocus={() => speak("Weekly minutes statistics. Monday: 15 minutes, Tuesday: 45 minutes, Wednesday: 30 minutes, Friday: 60 minutes. Total streak is maintained.")}
            >
              <h3 className="text-xs font-bold text-[#fbbf24] uppercase">Auditory activity logs</h3>
              
              <div className="flex justify-between items-end h-40 px-4 mt-4">
                {[
                  { day: "Mon", min: 15, h: "25%" },
                  { day: "Tue", min: 45, h: "75%" },
                  { day: "Wed", min: 30, h: "50%" },
                  { day: "Thu", min: 10, h: "15%" },
                  { day: "Fri", min: 60, h: "100%" },
                  { day: "Sat", min: 25, h: "40%" },
                  { day: "Sun", min: 40, h: "65%" }
                ].map((bar, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="relative w-6 bg-slate-950 border border-white/10 rounded-md h-28 flex items-end">
                      <div className="w-full bg-[#fbbf24]" style={{ height: bar.h }} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-[#fbbf24]">Earned Badges</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { title: "Quick Learner", desc: "First purchase completed", icon: "verified" },
                  { title: "Weekly Master", desc: "Maintained a 7-day streak", icon: "local_fire_department" },
                  { title: "Speech Fluency", desc: "ASL quiz 100%", icon: "school" }
                ].map((badge, idx) => (
                  <div 
                    key={idx} 
                    className="bg-slate-900 border border-white/10 p-5 rounded-2xl flex flex-col items-center gap-2 text-center"
                    tabIndex={0}
                    onFocus={() => speak(`Badge: ${badge.title}. Description: ${badge.desc}`)}
                  >
                    <span className="material-symbols-outlined text-[#fbbf24] !text-2xl">{badge.icon}</span>
                    <h4 className="text-xs font-bold">{badge.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 8. PROFILE & CERTIFICATES */}
        {activeTab === "profile" && (
          <div className="flex flex-col gap-6 animate-fadeIn max-w-4xl mx-auto w-full">
            <div 
              className="bg-slate-900 border-2 border-white/10 p-8 rounded-3xl"
              tabIndex={0}
              onFocus={() => speak("User profile Aman Halkude. Joined June 2026. Credentials: 2 completed certificates.")}
            >
              <h2 className="text-2xl font-black text-[#fbbf24]">Aman Halkude</h2>
              <p className="text-xs text-slate-400 mt-1">Audio-assistance student profile.</p>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-[#fbbf24]">My Certificates</h2>
              {[
                { id: "cert-1", title: "American Sign Language Alphabet", date: "June 25, 2026", code: "ACC-AI-ASL-8271" },
                { id: "cert-2", title: "Basic ASL Sentences & Greetings", date: "June 26, 2026", code: "ACC-AI-ASL-9982" }
              ].map(cert => (
                <div 
                  key={cert.id} 
                  className="bg-slate-900 border-2 border-white/10 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  tabIndex={0}
                  onFocus={() => speak(`Certificate for: ${cert.title}. Code: ${cert.code}. focused down to copy code.`)}
                >
                  <div>
                    <h3 className="text-base font-bold text-[#fbbf24]">{cert.title}</h3>
                    <p className="text-xs text-slate-500">ID: {cert.code} · Date: {cert.date}</p>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(cert.code); speak("Certificate code copied to clipboard."); }}
                    onFocus={() => speak(`Copy certificate code ${cert.code} button.`)}
                    className="px-4 py-3 bg-[#fbbf24] text-black font-black text-xs rounded-xl"
                  >
                    Copy Verification ID
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. ACCESSIBILITY SETTINGS */}
        {activeTab === "settings" && (
          <div className="flex flex-col gap-6 animate-fadeIn max-w-2xl mx-auto w-full">
            <div>
              <h1 className="text-2xl font-black text-[#fbbf24]">Accessibility Settings</h1>
              <p className="text-xs text-slate-400">Configure speech options and high contrast guidance outlines.</p>
            </div>

            <div className="bg-slate-900 border-2 border-white/10 p-8 rounded-2xl flex flex-col gap-6">
              {/* TTS Speed */}
              <div className="pb-6 border-b border-white/5 flex flex-col gap-3">
                <h3 className="text-sm font-bold text-[#fbbf24]" tabIndex={0} onFocus={() => speak("TTS narration speed configuration. Select Slow, Normal, or Fast.")}>Audio Speech Speed</h3>
                <div className="flex gap-2">
                  {["slow", "normal", "fast"].map(speed => (
                    <button
                      key={speed}
                      onClick={() => { setTtsSpeed(speed); speak(`Narration speed set to ${speed}.`); }}
                      onFocus={() => speak(`Set speed to ${speed} button.`)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${
                        ttsSpeed === speed ? "bg-[#fbbf24] text-black" : "bg-slate-950 text-slate-400"
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contrast */}
              <div className="pb-6 border-b border-white/5 flex flex-col gap-3">
                <h3 className="text-sm font-bold text-[#fbbf24]" tabIndex={0} onFocus={() => speak("Contrast layout selector. Choose High Contrast or Standard Dark.")}>Interface Contrast Mode</h3>
                <div className="flex gap-2">
                  {[
                    { id: "high-contrast", label: "Yellow High Contrast" },
                    { id: "standard-dark", label: "Standard Dark" }
                  ].map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => { setContrastTheme(theme.id); speak(`Contrast updated to ${theme.label}.`); }}
                      onFocus={() => speak(`Select ${theme.label} button.`)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        contrastTheme === theme.id ? "bg-[#fbbf24] text-black" : "bg-slate-950 text-slate-400"
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font scaling */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-[#fbbf24]" tabIndex={0} onFocus={() => speak("Text scaling options. Select extra large or extra extra large.")}>Content Font Size</h3>
                <div className="flex gap-2">
                  {["xl", "xxl"].map(fs => (
                    <button
                      key={fs}
                      onClick={() => { setFontSize(fs); speak(`Text scaling set to ${fs}.`); }}
                      onFocus={() => speak(`Adjust font to ${fs} button.`)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${
                        fontSize === fs ? "bg-[#fbbf24] text-black" : "bg-slate-950 text-slate-400"
                      }`}
                    >
                      {fs}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Embedded focused element outlines styles */}
      <style>{`
        *:focus-visible { 
          outline: 4px solid #fbbf24 !important; 
          outline-offset: 4px !important; 
        }
      `}</style>
    </div>
  );
}