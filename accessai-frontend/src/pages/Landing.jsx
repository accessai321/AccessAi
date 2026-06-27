import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useVoiceAssistant } from "../hooks/useVoice";
import { useAuth } from "../context/AuthContext";


const STATE_IDLE = "IDLE";
const STATE_GREETING = "GREETING";
const STATE_LISTENING = "LISTENING";
const STATE_PROCESSING = "PROCESSING";
const STATE_SPEAKING = "SPEAKING";

const modes = [
  {
    key: "blind",
    title: "Blind / Low Vision",
    description: "Voice-first interface with high-contrast elements and full screen reader optimization.",
    icon: "visibility_off",
    accent: "primary",
    bgFixed: "bg-primary-fixed",
    textAccent: "text-primary",
    ringColor: "ring-primary/20",
    borderActive: "border-primary",
    groupHoverBg: "group-hover:bg-primary"
  },
  {
    key: "deaf",
    title: "Deaf / Hard of Hearing",
    description: "Visual-first interaction with real-time transcription and visual haptic feedback.",
    icon: "hearing_disabled",
    accent: "tertiary",
    bgFixed: "bg-tertiary-fixed",
    textAccent: "text-tertiary",
    ringColor: "ring-tertiary/20",
    borderActive: "border-tertiary",
    groupHoverBg: "group-hover:bg-tertiary"
  },
  {
    key: "motor",
    title: "Motor Impaired",
    description: "Adaptive inputs with oversized hit areas, eye-tracking support, and simplified gestures.",
    icon: "accessible",
    accent: "secondary",
    bgFixed: "bg-secondary-fixed",
    textAccent: "text-secondary",
    ringColor: "ring-secondary/20",
    borderActive: "border-secondary",
    groupHoverBg: "group-hover:bg-secondary"
  }
];

export default function Landing() {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();
  const { loginDemoUser, DEMO_MODE } = useAuth();

  const {
    registerContext,
    speak,
    stop,
    resumeListening: globalResumeListening,
    speechBubble,
    setSpeechBubble,
    transcript,
    setTranscript,
    agentState,
    setAgentState
  } = useVoiceAssistant();

  const [showSpeechBubble, setShowSpeechBubble] = useState(true);

  // Debug Panel States
  const [debugStatus, setDebugStatus] = useState("Idle");
  const [debugTranscript, setDebugTranscript] = useState("");
  const [debugNormalized, setDebugNormalized] = useState("");
  const [debugIntent, setDebugIntent] = useState("None");
  const [debugFunction, setDebugFunction] = useState("None");
  const [debugResult, setDebugResult] = useState("None");

  const selectedRef = useRef(null);

  const textToSpeak = "Hello. I am AccessAI. Please say Blind Mode or Motor Mode.";

  const setSelectedWithRef = useCallback((val) => {
    selectedRef.current = val;
    setSelected(val);
  }, []);

  const speakText = useCallback((text, onEndCallback) => {
    setSpeechBubble(text);
    speak(text, onEndCallback);
  }, [speak, setSpeechBubble]);

  const resumeListening = useCallback(() => {
    setAgentState(STATE_LISTENING);
    setDebugStatus("Listening...");
    globalResumeListening();
  }, [globalResumeListening, setAgentState]);

  const handleOrbClick = useCallback(() => {
    setAgentState(STATE_SPEAKING);
    setDebugStatus("Speaking...");
    stop();
    setShowSpeechBubble(true);

    speakText(textToSpeak, () => {
      setTimeout(() => {
        resumeListening();
      }, 100);
    });
  }, [speakText, resumeListening, stop, setAgentState]);

  // Trigger greeting automatically on page load
  useEffect(() => {
    handleOrbClick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectMode = useCallback((modeKey, playTTS = true) => {
    setSelectedWithRef(modeKey);

    if (DEMO_MODE) {
      loginDemoUser(modeKey);
      navigate(`/${modeKey}`);
      return;
    }

    if (playTTS) {
      const modeName = modes.find(m => m.key === modeKey)?.title;
      const replyText = `${modeName} selected. Would you like to Login or Sign Up?`;

      setAgentState(STATE_SPEAKING);
      setDebugStatus("Speaking...");
      stop();

      console.log(`Assistant Speaking:\n"${replyText}"`);

      speakText(replyText, () => {
        setTimeout(() => {
          resumeListening();
        }, 100);
      });
    }
  }, [speakText, resumeListening, setSelectedWithRef, stop, setAgentState, DEMO_MODE, loginDemoUser, navigate]);

  const selectBlindMode = useCallback(() => {
    selectMode("blind", true);
  }, [selectMode]);

  const selectMotorMode = useCallback(() => {
    selectMode("motor", true);
  }, [selectMode]);

  const handleAuthRedirect = useCallback(() => {
    if (!selected) return;
    if (DEMO_MODE) {
      loginDemoUser(selected);
      navigate(`/${selected}`);
      return;
    }
    navigate(`/${selected}/login`);
  }, [selected, navigate, DEMO_MODE, loginDemoUser]);

  const openLogin = useCallback(() => {
    if (!selectedRef.current) {
      const replyText = "Please select Blind Mode or Motor Mode first before logging in.";
      setAgentState(STATE_SPEAKING);
      setDebugStatus("Speaking...");
      stop();
      console.log(`Assistant Speaking:\n"${replyText}"`);
      speakText(replyText, () => {
        setTimeout(() => {
          resumeListening();
        }, 100);
      });
      return;
    }
    const replyText = "Opening adaptive login.";
    setAgentState(STATE_SPEAKING);
    setDebugStatus("Speaking...");
    stop();
    console.log(`Assistant Speaking:\n"${replyText}"`);
    speakText(replyText, () => {
      navigate(`/${selectedRef.current}/login`);
    });
  }, [speakText, resumeListening, stop, navigate, setAgentState]);

  const openSignup = useCallback(() => {
    if (!selectedRef.current) {
      const replyText = "Please select Blind Mode or Motor Mode first before signing up.";
      setAgentState(STATE_SPEAKING);
      setDebugStatus("Speaking...");
      stop();
      console.log(`Assistant Speaking:\n"${replyText}"`);
      speakText(replyText, () => {
        setTimeout(() => {
          resumeListening();
        }, 100);
      });
      return;
    }
    const replyText = "Opening adaptive registration.";
    setAgentState(STATE_SPEAKING);
    setDebugStatus("Speaking...");
    stop();
    console.log(`Assistant Speaking:\n"${replyText}"`);
    speakText(replyText, () => {
      navigate(`/${selectedRef.current}/signup`);
    });
  }, [speakText, resumeListening, stop, navigate, setAgentState]);

  // Normalize transcript text
  const normalizeTranscript = useCallback((text) => {
    let normalized = text.toLowerCase().trim();

    // Exact mapping matches
    if (normalized === "log in" || normalized === "login" || normalized.includes("log in") || normalized.includes("login")) {
      return "login";
    }
    if (normalized === "sign up" || normalized === "signup" || normalized.includes("sign up") || normalized.includes("signup")) {
      return "signup";
    }
    if (normalized === "register" || normalized.includes("register")) {
      return "signup";
    }
    if (normalized === "blind" || normalized === "blind mode" || normalized.includes("blind")) {
      return "blind mode";
    }
    if (normalized === "motor" || normalized === "motor mode" || normalized.includes("motor")) {
      return "motor mode";
    }

    return normalized;
  }, []);

  // Intent detection and callback mapper
  const detectIntent = useCallback((normalizedText) => {
    if (normalizedText === "blind mode") {
      return { intent: "SELECT_MODE", entity: "blind", action: selectBlindMode, funcName: "selectBlindMode()" };
    }
    if (normalizedText === "motor mode") {
      return { intent: "SELECT_MODE", entity: "motor", action: selectMotorMode, funcName: "selectMotorMode()" };
    }
    if (normalizedText === "login") {
      return { intent: "OPEN_LOGIN", entity: null, action: openLogin, funcName: "openLogin()" };
    }
    if (normalizedText === "signup") {
      return { intent: "OPEN_SIGNUP", entity: null, action: openSignup, funcName: "openSignup()" };
    }
    if (normalizedText.includes("home")) {
      return {
        intent: "NAVIGATE_HOME", entity: null, action: () => {
          const replyText = "You are on the homepage.";
          setAgentState(STATE_SPEAKING);
          setDebugStatus("Speaking...");
          console.log(`Assistant Speaking:\n"${replyText}"`);
          speakText(replyText, () => {
            setTimeout(() => { resumeListening(); }, 100);
          });
        }, funcName: "navigateHome()"
      };
    }
    if (normalizedText.includes("dashboard") || normalizedText.includes("continue learning")) {
      return {
        intent: "NAVIGATE_DASHBOARD", entity: null, action: () => {
          if (selectedRef.current) {
            const replyText = "Opening dashboard...";
            setAgentState(STATE_SPEAKING);
            setDebugStatus("Speaking...");
              console.log(`Assistant Speaking:\n"${replyText}"`);
            speakText(replyText, () => { navigate(`/${selectedRef.current}`); });
          } else {
            const replyText = "Please select Blind Mode or Motor Mode first.";
            setAgentState(STATE_SPEAKING);
            setDebugStatus("Speaking...");
              console.log(`Assistant Speaking:\n"${replyText}"`);
            speakText(replyText, () => {
              setTimeout(() => { resumeListening(); }, 100);
            });
          }
        }, funcName: "navigateDashboard()"
      };
    }
    if (normalizedText.includes("courses")) {
      return {
        intent: "VIEW_COURSES", entity: null, action: () => {
          const replyText = "Please sign in first to view your courses.";
          setAgentState(STATE_SPEAKING);
          setDebugStatus("Speaking...");
          console.log(`Assistant Speaking:\n"${replyText}"`);
          speakText(replyText, () => {
            setTimeout(() => { resumeListening(); }, 100);
          });
        }, funcName: "viewCourses()"
      };
    }
    if (normalizedText.includes("profile")) {
      return {
        intent: "VIEW_PROFILE", entity: null, action: () => {
          const replyText = "Please sign in first to view your profile.";
          setAgentState(STATE_SPEAKING);
          setDebugStatus("Speaking...");
          console.log(`Assistant Speaking:\n"${replyText}"`);
          speakText(replyText, () => {
            setTimeout(() => { resumeListening(); }, 100);
          });
        }, funcName: "viewProfile()"
      };
    }
    if (normalizedText.includes("settings")) {
      return {
        intent: "VIEW_SETTINGS", entity: null, action: () => {
          const replyText = "Please sign in first to view settings.";
          setAgentState(STATE_SPEAKING);
          setDebugStatus("Speaking...");
          console.log(`Assistant Speaking:\n"${replyText}"`);
          speakText(replyText, () => {
            setTimeout(() => { resumeListening(); }, 100);
          });
        }, funcName: "viewSettings()"
      };
    }
    if (normalizedText.includes("next")) {
      return {
        intent: "NEXT", entity: null, action: () => {
          if (selectedRef.current) {
            openLogin();
          } else {
            const replyText = "Please select an accessibility mode first.";
            setAgentState(STATE_SPEAKING);
            setDebugStatus("Speaking...");
              console.log(`Assistant Speaking:\n"${replyText}"`);
            speakText(replyText, () => {
              setTimeout(() => { resumeListening(); }, 100);
            });
          }
        }, funcName: "goNext()"
      };
    }
    if (normalizedText.includes("back")) {
      return {
        intent: "BACK", entity: null, action: () => {
          setSelectedWithRef(null);
          const replyText = "Selection cleared.";
          setAgentState(STATE_SPEAKING);
          setDebugStatus("Speaking...");
          console.log(`Assistant Speaking:\n"${replyText}"`);
          speakText(replyText, () => {
            setTimeout(() => { resumeListening(); }, 100);
          });
        }, funcName: "goBack()"
      };
    }
    if (normalizedText.includes("repeat")) {
      return {
        intent: "REPEAT", entity: null, action: () => {
          handleOrbClick();
        }, funcName: "repeatInstructions()"
      };
    }
    if (normalizedText.includes("help")) {
      return {
        intent: "HELP", entity: null, action: () => {
          const replyText = "Supported commands are: Blind Mode, Motor Mode, Login, Sign Up, Home, Dashboard, Courses, Back, Repeat, and Help.";
          setAgentState(STATE_SPEAKING);
          setDebugStatus("Speaking...");
          console.log(`Assistant Speaking:\n"${replyText}"`);
          speakText(replyText, () => {
            setTimeout(() => { resumeListening(); }, 100);
          });
        }, funcName: "showHelp()"
      };
    }

    return null;
  }, [selectBlindMode, selectMotorMode, openLogin, openSignup, speakText, resumeListening, setSelectedWithRef, setAgentState, handleOrbClick, navigate]);

  const startGreeting = useCallback(() => {
    if (agentState !== STATE_IDLE) return;

    setAgentState(STATE_GREETING);
    setDebugStatus("Greeting...");
    speakText(textToSpeak, () => {
      setTimeout(() => {
        resumeListening();
      }, 100);
    });
  }, [speakText, resumeListening, agentState, setAgentState]);

  // Speech Recognition Context Registration
  useEffect(() => {
    const unregister = registerContext("LANDING", (spokenText, confidence) => {
      setTranscript(spokenText);
      setDebugTranscript(spokenText);

      const normalized = normalizeTranscript(spokenText);
      setDebugNormalized(normalized);

      const intentObj = detectIntent(normalized);
      if (intentObj) {
        setDebugIntent(intentObj.intent);
        setDebugFunction(intentObj.funcName);
        setDebugResult("SUCCESS");
        intentObj.action();
      } else {
        const replyText = "I didn't understand that command. Please try again.";
        setDebugIntent("UNKNOWN");
        setDebugFunction("None");
        setDebugResult("ERROR");

        setAgentState(STATE_SPEAKING);
        setDebugStatus("Speaking...");
        speakText(replyText, () => {
          setTimeout(() => {
            resumeListening();
          }, 100);
        });
      }
    }, true);
    return unregister;
  }, [registerContext, normalizeTranscript, detectIntent, speakText, resumeListening, setAgentState, setTranscript]);

  // Autoplay greeting on mount or click fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      startGreeting();
    }, 1000);

    const handleUserInteraction = () => {
      startGreeting();
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };

    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("keydown", handleUserInteraction);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
    };
  }, [startGreeting]);



  const getStatusText = () => {
    switch (agentState) {
      case STATE_GREETING:
        return "AccessAI is greeting you...";
      case STATE_LISTENING:
        return "Listening (say 'blind mode' or 'motor mode')...";
      case STATE_PROCESSING:
        return "Processing command...";
      case STATE_SPEAKING:
        return "AccessAI is speaking...";
      default:
        return "Voice agent ready";
    }
  };

  const selectedMode = modes.find((m) => m.key === selected);
  const isListening = agentState === STATE_LISTENING;

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-primary-container selection:text-white">
      {/* ── Header ── */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-primary font-headline">AccessAI</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors active:scale-90 duration-200" aria-label="Accessibility Settings">
            <span className="material-symbols-outlined text-on-surface-variant">settings_accessibility</span>
          </button>
          <button className="p-2 rounded-full hover:bg-surface-container-high transition-colors active:scale-90 duration-200" aria-label="Profile">
            <span className="material-symbols-outlined text-on-surface-variant">account_circle</span>
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop">
        <section className="max-w-6xl mx-auto flex flex-col items-center">
          <div className="text-center mb-12 mt-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-on-surface font-headline leading-tight tracking-tight">
              Welcome to AccessAI
            </h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
              Please select the accessibility profile that best fits your needs to begin your adaptive experience.
            </p>
          </div>

          {/* ── Grid Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter w-full mb-12">
            {modes.map((mode) => {
              const isSelected = selected === mode.key;
              return (
                <button
                  key={mode.key}
                  onClick={() => selectMode(mode.key, true)}
                  className={`glass-card p-8 rounded-2xl text-left flex flex-col gap-6 group focus-visible w-full ${isSelected
                      ? `-translate-y-2 border-2 ${mode.borderActive} ring-4 ${mode.ringColor} shadow-lg`
                      : "border border-outline-variant/30 hover:-translate-y-2 shadow-sm"
                    }`}
                  aria-pressed={isSelected}
                  aria-label={`Select ${mode.title}`}
                >
                  <div className={`w-16 h-16 rounded-2xl ${mode.bgFixed} flex items-center justify-center ${mode.textAccent} ${mode.groupHoverBg} group-hover:text-white transition-all`}>
                    <span className="material-symbols-outlined !text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {mode.icon}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-on-surface mb-2 font-headline">{mode.title}</h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed">{mode.description}</p>
                  </div>

                  <div className={`mt-auto flex items-center ${mode.textAccent} font-bold text-sm`}>
                    <span>Select Mode</span>
                    <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Auth Actions ── */}
          <div className="w-full max-w-md mx-auto flex flex-col gap-4">
            <button
              onClick={handleAuthRedirect}
              disabled={!selected}
              className={`w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl text-base font-semibold transition-all shadow-md ${selected
                  ? "bg-primary text-white hover:brightness-110 active:scale-[0.98] cursor-pointer shadow-primary/20"
                  : "bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed border border-outline-variant/20"
                }`}
            >
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
              {selected
                ? `Get Started as ${selectedMode?.title}`
                : "Select an accessibility profile above"}
            </button>

            <p className="text-center text-xs text-on-surface-variant/60 max-w-xs mx-auto leading-relaxed">
              Your profile selection will automatically adapt AccessAI's dashboards and features to your needs.
            </p>
          </div>
        </section>
      </main>

      {/* ── Tiny AccessAI Voice Agent ── */}
      <div className="fixed bottom-6 left-6 z-[100] flex items-end gap-4 pointer-events-none">
        {/* Pulsing Orb */}
        <button
          onClick={handleOrbClick}
          className="pointer-events-auto relative w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all outline-none focus-visible ring-4 ring-primary/20"
          aria-label="Click to repeat voice instructions"
          title="Click to repeat instructions"
        >
          {/* Pulsing ring animations */}
          <span className="absolute -inset-1 rounded-full border border-primary/40 animate-ping opacity-75"></span>
          <span className="absolute -inset-2 rounded-full border border-secondary/20 animate-pulse opacity-50"></span>

          {/* Waveform/Mic Icon */}
          <span className="material-symbols-outlined !text-2xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
            settings_voice
          </span>
        </button>

        {/* Speech Bubble */}
        {showSpeechBubble && (
          <div className="pointer-events-auto relative bg-white/95 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-4 shadow-xl max-w-xs md:max-w-sm flex flex-col gap-2 transition-all duration-300">
            <div className="flex items-start gap-3">
              {/* Play/Repeat Indicator */}
              <button
                onClick={handleOrbClick}
                className="flex-1 text-left select-none text-xs text-on-surface-variant font-medium leading-relaxed hover:text-primary transition-colors cursor-pointer"
                title="Click to repeat instructions"
              >
                "{textToSpeak}"
              </button>

              {/* Close Button */}
              <button
                onClick={() => setShowSpeechBubble(false)}
                className="p-1 rounded-md text-on-surface-variant/40 hover:text-on-surface-variant hover:bg-surface-container-high transition-colors text-xs font-semibold"
                aria-label="Dismiss speech bubble"
              >
                <span className="material-symbols-outlined !text-sm">close</span>
              </button>
            </div>

            {/* Listening / Live Transcript status */}
            <div className="border-t border-outline-variant/20 pt-2 flex flex-col gap-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-on-surface-variant/60">
                <span className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                <span>{getStatusText()}</span>
              </div>
              {transcript && (
                <div className="text-primary font-medium italic">
                  You said: "{transcript}"
                </div>
              )}
            </div>

            {/* Little bubble arrow */}
            <div className="absolute left-[-6px] bottom-5 w-3 h-3 bg-white border-l border-b border-outline-variant/30 rotate-45"></div>
          </div>
        )}
      </div>

      {/* ── Debug Panel ── */}
      <div className="fixed bottom-6 right-6 z-[100] bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 shadow-2xl text-white font-mono text-[11px] w-72 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
          <span className="font-bold text-slate-300 text-xs">AccessAI Debug Panel</span>
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
        </div>
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-slate-400 font-semibold font-sans">Status: </span>
            <span className="text-green-400 font-bold">{debugStatus}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold font-sans">Transcript: </span>
            <span className="text-white">"{debugTranscript || "none"}"</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold font-sans">Normalized: </span>
            <span className="text-sky-300">"{debugNormalized || "none"}"</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold font-sans">Intent: </span>
            <span className="text-yellow-400 font-bold">{debugIntent}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold font-sans">Function: </span>
            <span className="text-purple-400">{debugFunction}</span>
          </div>
          <div>
            <span className="text-slate-400 font-semibold font-sans">Result: </span>
            <span className={`font-bold ${debugResult === "SUCCESS" ? "text-green-400" : debugResult === "ERROR" ? "text-red-400" : "text-slate-300"}`}>
              {debugResult}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}