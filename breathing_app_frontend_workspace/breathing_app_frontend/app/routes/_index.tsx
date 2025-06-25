import { useState, useRef, useEffect } from "react";
import type { MetaFunction } from "@remix-run/node";

// PUBLIC_INTERFACE
export const meta: MetaFunction = () => [
  { title: "BreatheEase – Calming Breathing App" },
  { name: "description", content: "Practice calming breathing exercises with animated visuals and soothing music." },
];

// Phase cycles in seconds
const BREATH_PHASES = [
  { name: "Breathe In", duration: 4 },
  { name: "Hold", duration: 4 },
  { name: "Breathe Out", duration: 6 },
  { name: "Hold", duration: 2 },
];

// Session definitions (in seconds)
const SESSIONS = [
  { label: "1 min", seconds: 60 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
];

const COLORS = {
  accent: "#54c7c5",
  primary: "#5b8cfa",
  secondary: "#a684de",
};

const BG_COLOR_CLASSES = "bg-[#f9fbfd]";

function padTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

// PUBLIC_INTERFACE
export default function Index() {
  const [screen, setScreen] = useState<"home" | "session" | "done">("home");
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(0); // total left
  const [phaseIdx, setPhaseIdx] = useState<number>(0);
  const [phaseElapsed, setPhaseElapsed] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [audioReady, setAudioReady] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Calculate current phase (removed phaseProgress to fix lint)
  const currentPhase = BREATH_PHASES[phaseIdx];

  // Handle timer logic for session
  useEffect(() => {
    if (screen !== "session" || !isRunning) return;
    let req: number;
    const interval = () => {
      setPhaseElapsed((t) => {
        if (t + 1 >= currentPhase.duration) {
          // Next phase
          setPhaseIdx((idx) => (idx + 1) % BREATH_PHASES.length);
          return 0;
        }
        return t + 1;
      });
      setCountdown((left) => {
        if (left <= 1) {
          setIsRunning(false);
          setTimeout(() => setScreen("done"), 800); // Allow animation to finish
          return 0;
        }
        return left - 1;
      });
      req = window.setTimeout(interval, 1000);
    };
    req = window.setTimeout(interval, 1000);
    return () => clearTimeout(req);
    // eslint-disable-next-line
  }, [screen, isRunning, currentPhase.duration]);

  // Reset phase on session start
  useEffect(() => {
    if (screen === "session") {
      setPhaseIdx(0);
      setPhaseElapsed(0);
    }
  }, [screen, selectedSession]);

  // Play/stop background music when muted changes or music is ready
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = 0.33;
    if (!isMuted && audioReady) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isMuted, audioReady, screen]);

  // Handlers
  function handleSessionSelect(sec: number) {
    setSelectedSession(sec);
    setCountdown(sec);
    setScreen("session");
    setIsRunning(true);
  }

  function handleHome() {
    setScreen("home");
    setTimeout(() => {
      setCountdown(0);
      setSelectedSession(null);
      setPhaseIdx(0);
      setPhaseElapsed(0);
      setIsRunning(false);
    }, 10);
  }

  function handleRestart() {
    if (selectedSession) {
      setCountdown(selectedSession);
      setScreen("session");
      setPhaseIdx(0);
      setPhaseElapsed(0);
      setIsRunning(true);
    }
  }

  // Minimal background music: royalty free
  // (host locally if you wish, here is a calm, copyright-free mp3)
  const musicSrc = "https://cdn.pixabay.com/audio/2022/08/20/audio_124b5e6982.mp3";

  return (
    <main className={`min-h-screen w-full flex items-center justify-center flex-col transition-colors duration-500 ${BG_COLOR_CLASSES} font-sans`}>
      {/* Background music audio (invisible) */}
      <audio
        ref={audioRef}
        src={musicSrc}
        loop
        preload="auto"
        onCanPlayThrough={() => setAudioReady(true)}
        style={{ display: "none" }}
      >
        <track kind="captions" />
      </audio>
      {/* Floating music toggle button */}
      <MuteButton isMuted={isMuted} onToggle={() => setIsMuted((m) => !m)} />

      {screen === "home" && (
        <LandingScreen
          onSessionSelect={handleSessionSelect}
        />
      )}
      {screen === "session" && selectedSession !== null && (
        <BreathingSession
          duration={selectedSession}
          phaseIdx={phaseIdx}
          phaseElapsed={phaseElapsed}
          countdown={countdown}
          isRunning={isRunning}
          onReturn={handleHome}
          onRestart={handleRestart}
        />
      )}
      {screen === "done" && (
        <CompleteScreen
          selectedSession={selectedSession || 0}
          onHome={handleHome}
          onRestart={handleRestart}
        />
      )}
      {/* App title branding small, mobile sticky */}
      <div className="fixed left-1/2 top-3 z-10 -translate-x-1/2 sm:top-7 text-xs sm:text-base font-semibold tracking-wide text-gray-400 pointer-events-none select-none uppercase">
        BreatheEase
      </div>
    </main>
  );
}

// PUBLIC_INTERFACE
function LandingScreen({
  onSessionSelect,
}: {
  onSessionSelect: (dur: number) => void;
}) {
  return (
    <div className="max-w-sm w-full mx-auto flex flex-col items-center gap-8 p-6 sm:p-10 rounded-xl bg-white/95 shadow-2xl">
      <h1 className="font-extrabold text-center text-2xl sm:text-3xl mb-2 text-[#5b8cfa] tracking-tight" style={{fontFamily:"Inter"}}>
        BreatheEase
      </h1>
      <p className="text-base sm:text-lg text-gray-500 text-center mb-4">
        Practice calming, guided breathing to relax your mind and body. Select a session length to begin.
      </p>
      <div className="w-full flex flex-col gap-4 mt-2">
        {SESSIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => onSessionSelect(s.seconds)}
            className="py-4 w-full rounded-full bg-[#54c7c5] hover:bg-[#5b8cfa] focus-visible:ring-2 focus-visible:ring-[#a684de] text-white text-xl font-medium transition-all shadow-md outline-none"
            style={{ letterSpacing: 1 }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="w-full pt-8">
        <div className="mx-auto w-36 sm:w-40 aspect-square rounded-full flex items-center justify-center bg-gradient-to-tr from-[#eafaf9] to-[#ece9fa]">
          <span role="img" aria-label="calming" className="text-5xl">🧘‍♂️</span>
        </div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function BreathingSession({
  duration,
  phaseIdx,
  phaseElapsed,
  countdown,
  // Remove unused isRunning
  onReturn,
  onRestart,
}: {
  duration: number;
  phaseIdx: number;
  phaseElapsed: number;
  countdown: number;
  onReturn: () => void;
  onRestart: () => void;
}) {
  // Calculate current phase & next phase
  const phase = BREATH_PHASES[phaseIdx];
  const pct = phaseElapsed / phase.duration;

  // Find where we are in the overall session for SVG pulsing
  // Animate using CSS transition for size and color
  let pulseSize = 165 + 35 * (phaseIdx === 0 ? pct : phaseIdx === 2 ? 1 - pct : 0); // In-breath expands, out-breath contracts
  if (phaseIdx === 2) pulseSize = 200 - 35 * pct;
  if (phaseIdx === 1 || phaseIdx === 3) pulseSize = 200; // hold = full
  const pulseColor = phaseIdx === 0
    ? COLORS.primary
    : phaseIdx === 2
      ? COLORS.accent
      : COLORS.secondary;

  return (
    <section className="flex flex-col items-center justify-center min-h-screen w-full px-2 sm:px-0">
      <div className="mb-8 flex items-center gap-4 w-full max-w-xs sm:max-w-md">
        <button title="Return home" aria-label="Return home"
          className="rounded-xl bg-transparent ring-2 ring-[#a684de]/30 hover:ring-[#a684de] px-3 py-1 text-[#a684de] font-semibold transition"
          onClick={onReturn}
        >
          Home
        </button>
        <div className="mx-auto font-medium text-gray-400 text-base sm:text-lg tracking-wide select-none">
          Breathing Session
        </div>
        <button title="Restart" aria-label="Restart"
          className="rounded-xl bg-transparent ring-2 ring-[#54c7c5]/30 hover:ring-[#54c7c5] px-3 py-1 text-[#54c7c5] font-semibold transition"
          onClick={onRestart}
        >
          Restart
        </button>
      </div>
      {/* Breathing pulse animation visual */}
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <svg
            width={260}
            height={260}
            viewBox="0 0 260 260"
            className="transition-all duration-500"
            style={{
              filter: "drop-shadow(0px 2px 33px rgba(133,168,253,0.16))",
            }}
            aria-hidden
          >
            <circle
              cx={130}
              cy={130}
              r={pulseSize / 2}
              fill={pulseColor}
              fillOpacity="0.35"
              className="transition-all duration-700"
              style={{
                transitionTimingFunction: "cubic-bezier(.71,.12,.1,.98)",
              }}
            />
            <circle
              cx={130}
              cy={130}
              r={pulseSize / 2.6}
              fill="#fff"
              fillOpacity="0.54"
              className="transition-all duration-700"
              style={{
                transitionTimingFunction: "cubic-bezier(.71,.12,.1,.98)",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl sm:text-2xl font-bold text-gray-700" style={{ textShadow: "0 2px 14px rgba(91,140,250,0.07)" }}>
              {phase.name}
            </span>
            <span className="mt-1 text-md sm:text-lg text-gray-400 font-semibold tracking-wider select-none text-center">
              {getPhaseDesc(phase.name)}
            </span>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-center gap-8">
          <TimerDisplay duration={duration} left={countdown} />
        </div>
      </div>
      <div className="mt-12" />
      <div className="text-center text-gray-350 text-sm mt-2">
        Stay focused, breathe slowly and naturally.
      </div>
    </section>
  );
}

// PUBLIC_INTERFACE
function CompleteScreen({
  // Removed unused selectedSession
  onHome,
  onRestart,
}: {
  onHome: () => void;
  onRestart: () => void;
}) {
  const msg = getMotivationalMessage();
  return (
    <section className="flex flex-col items-center justify-center w-full min-h-screen px-4 sm:px-0">
      <div className="mb-8">
        <svg width={180} height={180} viewBox="0 0 220 220" aria-hidden>
          <circle
            cx={110}
            cy={110}
            r={85}
            fill="#eafaf9"
          />
          <circle
            cx={110}
            cy={110}
            r={65}
            fill="#54c7c5"
            fillOpacity="0.45"
          />
          <circle
            cx={110}
            cy={110}
            r={40}
            fill="#5b8cfa"
            fillOpacity="0.37"
          />
          <text
            x="110"
            y="115"
            textAnchor="middle"
            fontWeight={700}
            fontSize={38}
            fill="#5b8cfa"
            opacity="0.72"
          >
            ✓
          </text>
        </svg>
      </div>
      <div className="font-bold text-2xl sm:text-3xl mb-5 text-[#5b8cfa]">Session Complete!</div>
      <div className="text-lg text-gray-700 mb-6 max-w-md text-center">
        {msg}
      </div>
      <div className="flex flex-col gap-3 w-full max-w-[300px]">
        <button
          onClick={onRestart}
          className="py-3 rounded-full bg-[#54c7c5] hover:bg-[#5b8cfa] text-white text-lg font-medium transition-all shadow-sm outline-none"
        >
          Start Again
        </button>
        <button
          onClick={onHome}
          className="py-3 rounded-full bg-white border border-[#5b8cfa] hover:bg-[#eafaf9] text-[#5b8cfa] text-lg font-medium transition-all shadow-sm outline-none"
        >
          Home
        </button>
      </div>
    </section>
  );
}

// PUBLIC_INTERFACE
function TimerDisplay({ left }: { left: number; }) {
  return (
    <div className="flex flex-col items-center">
      <span className="block text-4xl font-mono tracking-widest text-gray-700 drop-shadow-sm">
        {padTime(left)}
      </span>
      <span className="mt-1 text-sm text-gray-400 tracking-wide uppercase font-semibold">
        Time left
      </span>
    </div>
  );
}

// PUBLIC_INTERFACE
function MuteButton({
  isMuted,
  onToggle,
}: {
  isMuted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="absolute right-5 bottom-6 sm:right-8 sm:bottom-12 z-30 rounded-full flex items-center justify-center w-12 h-12 bg-white/85 shadow-xl border border-[#eafaf9] hover:bg-[#eefbf6] transition"
      style={{
        boxShadow: '0 4px 22px 0 #a684de18',
      }}
      onClick={onToggle}
      title={isMuted ? "Play calming background music" : "Mute music"}
      aria-label="Toggle background music"
    >
      {isMuted
        ? <MuteIcon />
        : <SoundIcon />}
    </button>
  );
}

function MuteIcon() {
  return (
    <svg width="32" height="32" fill="none" stroke={COLORS.primary} strokeWidth="2.2" viewBox="0 0 32 32">
      <rect x="7.2" y="14.4" width="6" height="7.2" rx="1.4" fill={COLORS.primary} fillOpacity="0.27"/>
      <rect x="3.8" y="12" width="3.9" height="10" rx="1.4" fill={COLORS.accent} fillOpacity="0.25"/>
      <path d="M14.5 19.3 23 27M14.7 12.3 24 5" stroke={COLORS.secondary} strokeWidth="2"/>
      <path d="M18.8 5.8v20.2" stroke={COLORS.primary} strokeWidth="2"/>
      <rect x="18.2" y="8.5" width="9.4" height="15" rx="4.7" fill={COLORS.secondary} fillOpacity="0.09"/>
    </svg>
  );
}

function SoundIcon() {
  return (
    <svg width="32" height="32" fill="none" stroke={COLORS.primary} strokeWidth="2.2" viewBox="0 0 32 32">
      <rect x="7.2" y="14.4" width="6" height="7.2" rx="1.4" fill={COLORS.primary} fillOpacity="0.27"/>
      <rect x="3.8" y="12" width="3.9" height="10" rx="1.4" fill={COLORS.accent} fillOpacity="0.25"/>
      <path d="M18.8 5.8v20.2" stroke={COLORS.primary} strokeWidth="2"/>
      <rect x="18.2" y="8.5" width="9.4" height="15" rx="4.7" fill={COLORS.secondary} fillOpacity="0.09"/>
      <path
        d="M25.5 16c.47-.5 1.48-1.52 2-2m-2 2c.47.5 1.48 1.52 2 2"
        stroke={COLORS.accent} strokeWidth="2"/>
    </svg>
  );
}

// Helpers
function getMotivationalMessage(): string {
  // Rotates through a few motivators
  const messages = [
    "Great job! Notice how you feel now. Practice often for best results.",
    "Well done! Remember, calmness can begin with a single breath.",
    "Excellent! Return anytime for a fresh mind and steady heart.",
    "Breathe in peace, breathe out tension. Keep practicing!",
    "Your calm is powerful. Carry it with you throughout your day.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
function getPhaseDesc(phase: string): string {
  switch (phase) {
    case "Breathe In": return "Gently inhale and fill your lungs";
    case "Breathe Out": return "Slowly exhale, release tension";
    case "Hold": return "Pause and relax";
    default: return "";
  }
}
