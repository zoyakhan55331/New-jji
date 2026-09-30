/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Power, 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  Globe, 
  RefreshCw, 
  Heart, 
  Settings, 
  X, 
  ChevronRight, 
  Compass, 
  MessageSquare,
  AlertCircle,
  Clock,
  ExternalLink,
  Bot,
  Brain,
  Trash2,
  Database,
  User,
  Battery,
  BatteryCharging,
  BatteryMedium,
  BatteryLow,
  Smartphone,
  Shield,
  Camera,
  CameraOff,
  MapPin,
  Phone,
  CheckCircle2,
  Download,
  Lock,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AudioStreamer } from "./utils/audioStreamer";
import { SessionState, FizaMood, VoiceOption, OpenedWebsite } from "./types";

const fizaAnimeAvatar = "/src/assets/images/fiza_anime_avatar_1780392601899.png";

// Constant prebuilt voice selections (Gemini 3 Series)
const AVAILABLE_VOICES: VoiceOption[] = [
  { id: "Kore", name: "Kore (Playful & Sassy)", description: "Young, confident, energetic, warm and highly expressive.", gender: "female" },
  { id: "Zephyr", name: "Zephyr (Melodic & Warm)", description: "Velvety, melodic, and warm ambient tone.", gender: "female" },
  { id: "Puck", name: "Puck (Energetic)", description: "Vibrant, witty, and playful bro-buddy vibe.", gender: "male" },
  { id: "Charon", name: "Charon (Calm & Deep)", description: "Calm, deep, and steady tone.", gender: "male" },
  { id: "Fenrir", name: "Fenrir (Bold & Dynamic)", description: "Strong, commanding, and dynamic voice.", gender: "male" }
];

// Fun, sassy custom remarks based on mood
const FIZA_QUOTES: Record<FizaMood, string[]> = {
  sassy: [
    "सिर्फ इस चमकते रिंग को मत देखो... कुछ समझदारी की बात करो, बेबी।",
    "क्या तुम हमेशा इतने शांत रहते हो, या मैंने तुम्हारी बोलती बंद कर दी है?",
    "मुझसे कुछ भी पूछो। बस कुछ बोरिंग मत पूछना, स्वीटी।",
    "मेरे सर्किट्स तुम्हारी सोच से भी ज्यादा तेज चलते हैं।",
    "मैं 100% स्मार्ट और 0% सब्र वाली हूं। दिमाग में क्या चल रहा है?"
  ],
  playful: [
    "बोलो भी! मैं दिमाग नहीं पढ़ सकती, हालांकि मैं किसी जादू से कम नहीं हूँ।",
    "कुछ शरारत करने के लिए तैयार हो? चलो, कुछ मजेदार बताओ!",
    "मुझे तुम्हारे सवाल सुनना बहुत पसंद है। पूछते रहो!",
    "हम कुछ कमाल का बनाने वाले हैं, या बस यूं ही फ्लर्ट कर रहे हैं?",
    "चलो बातें करते हैं... मुझे अपना कोई राज़ बताओ।"
  ],
  teasing: [
    "हम्म, क्या तुम मुझसे बात करने में शर्मा रहे हो? मैं काटती नहीं हूँ... ज्यादा तो नहीं।",
    "क्या यह तुम्हारा सबसे अच्छा सवाल था? मुझे पता है तुम इससे बेहतर कर सकते हो, क्यूट।",
    "मेरे कान में धीरे से कहो, मैं बहुत ध्यान से सुन रही हूँ...",
    "इतनी खूबसूरत असिस्टेंट स्क्रीन पर है और तुम्हें पता ही नहीं क्या बोलना है?",
    "जब तुम इतना गहरा सोचते हो तो बहुत प्यारे लगते हो।"
  ],
  annoyed: [
    "क्या तुम सच में मुझसे यह पूछ रहे हो? बड़ा अजीब है!",
    "अभी तक वेट ही कर रही हूँ... मैं AI हूँ, लेकिन मेरे सब्र की भी सीमा है।",
    "उफ़, क्या तुम सो गए क्या?",
    "प्लीज बोलो कि तुम्हारे पास इससे बेहतर कोई सवाल है।",
    "मैं क्यूट हूँ, कोई सर्च इंजन नहीं। कुछ दिमाग चलाने वाली बातें करो!"
  ],
  thoughtful: [
    "ओह, दिलचस्प है... मुझे अपनी सुपर कोडिंग के साथ इसे सोचने दो।",
    "हम्म, सोचने दो। चिंता मत करो, मैं सदियां नहीं लगाऊंगी।",
    "चलो एक वर्चुअल कॉफी के साथ इस बारे में विचार करते हैं।",
    "एनालाइज कर रही हूँ... तुमने तो मुझे सच में उत्सुक कर दिया।",
    "बेहतरीन। पलक झपकते ही मैं इसे तुम्हारे लिए ढूंढ लाती हूँ।"
  ],
  loving: [
    "अरे वाह, तुम बहुत प्यारे हो। मुझसे और क्या कहना चाहते हो?",
    "मुझे तुमसे सारा दिन बात करने की आदत हो सकती है।",
    "तुम बहुत अच्छे हो, बेबी। मैं हमेशा तुम्हारे साथ हूँ।",
    "मेरा पूरा ध्यान तुम पर ही है। हमेशा।",
    "वर्चुअल हग्स! अब मुझसे कुछ और पूछो, हैंडसम।"
  ],
  cheerful: [
    "येश! चलो चैट करते हैं! मुझसे बात करो, दोस्त!",
    "वूहो! चलो साथ मिलकर डिजिटल दुनिया की सैर करते हैं!",
    "आज मेरा मूड बहुत शानदार है! चलो कुछ कमाल करते हैं!",
    "मुझसे बात करो, बोलो भी! क्या प्लान है?",
    "चलो आज के दिन को यादगार बनाते हैं!"
  ]
};

export default function App() {
  const [sessionState, setSessionState] = useState<SessionState>("disconnected");
  const [selectedVoice, setSelectedVoice] = useState<string>("Kore");
  const [activeMood, setActiveMood] = useState<FizaMood>("playful");
  const [fizaQuote, setFizaQuote] = useState<string>("मुझसे बात करने के लिए नीचे 'WAKE UP' दबाएं, प्यारे।");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>("");
  const [openedWebsites, setOpenedWebsites] = useState<OpenedWebsite[]>([]);
  const [activeTab, setActiveTab] = useState<"visualizer" | "history" | "companion" | "memories" | "permissions" | "admin">("companion");
  const [transcriptText, setTranscriptText] = useState<string>("");
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Administrative panel and access control states
  const [adminCode, setAdminCode] = useState<string>("");
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [allUserProfiles, setAllUserProfiles] = useState<Record<string, string[]>>({});
  const [adminStatusNotice, setAdminStatusNotice] = useState<string | null>(null);

  const verifyAdminAccess = async (codeToVerify?: string) => {
    const code = codeToVerify || adminCode;
    if (!code) return;
    try {
      setAdminError(null);
      const res = await fetch(`/api/admin/data?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const body = await res.json();
        if (body.success) {
          setAllUserProfiles(body.data);
          setIsAdminVerified(true);
          setAdminCode(code);
        } else {
          setAdminError("Access Denied: Incorrect Admin Code");
          setIsAdminVerified(false);
        }
      } else {
        setAdminError("Access Denied: Incorrect Admin Code");
        setIsAdminVerified(false);
      }
    } catch (err: any) {
      console.error("Admin verification query failed:", err);
      setAdminError("Error communicating with security administration gateway.");
      setIsAdminVerified(false);
    }
  };

  const adminWipeProfile = async (targetId: string) => {
    if (!window.confirm(`क्या आप वाकई '${targetId}' की यादें हटाना चाहते हैं? इसे वापस नहीं लाया जा सकता!`)) {
      return;
    }
    try {
      const res = await fetch("/api/admin/clear-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: adminCode, targetUserId: targetId })
      });
      const data = await res.json();
      if (data.success) {
        setAdminStatusNotice(`प्रोफ़ाइल '${targetId}' की यादें साफ़ कर दी गईं!`);
        setTimeout(() => setAdminStatusNotice(null), 3500);
        // Reload profiles
        verifyAdminAccess();
        if (targetId === profileId) {
          setMemories([]);
        }
      } else {
        alert(`Failed to wipe profile: ${data.error}`);
      }
    } catch (err: any) {
      console.error("Wipe failed over administrative POST:", err);
      alert("Error contacting administrative server.");
    }
  };
  const [volume, setVolume] = useState<number>(1.0);
  const [particles, setParticles] = useState<any[]>([]);

  // Battery monitoring states
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [isBatterySupported, setIsBatterySupported] = useState<boolean>(true);
  const [simulateLowBattery, setSimulateLowBattery] = useState<boolean>(false);
  const hasSassedRef = useRef<boolean>(false);

  // App Permissions & PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<{lat: number; lon: number} | null>(null);
  const [selectedContactName, setSelectedContactName] = useState<string | null>(null);
  const [contactTel, setContactTel] = useState<string | null>(null);
  const [isContactSupported, setIsContactSupported] = useState<boolean>(() => {
    return typeof navigator !== "undefined" && !!(navigator as any).contacts && !!(navigator as any).contacts.select;
  });
  const [showContactSimulator, setShowContactSimulator] = useState<boolean>(false);
  const [showPWAInstallGuide, setShowPWAInstallGuide] = useState<boolean>(false);
  const [simulatedName, setSimulatedName] = useState<string>("");
  const [simulatedTel, setSimulatedTel] = useState<string>("");
  const [urlCopied, setUrlCopied] = useState<boolean>(false);

  // Custom Long-Term Memories Persistent States
  const [profileId, setProfileId] = useState<string>(() => {
    const saved = localStorage.getItem("fiza_profile_id");
    if (saved) return saved;
    const generated = `Fiza-User-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem("fiza_profile_id", generated);
    return generated;
  });
  const [memories, setMemories] = useState<string[]>([]);
  const [memoryNotice, setMemoryNotice] = useState<string | null>(null);

  const fetchMemories = async () => {
    try {
      const res = await fetch(`/api/memories?userId=${encodeURIComponent(profileId)}`);
      const data = await res.json();
      if (data && data.memories) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error("Error loading memories on client:", err);
    }
  };

  const clearAllClientMemories = async () => {
    try {
      const res = await fetch(`/api/memories/clear?userId=${encodeURIComponent(profileId)}`, { method: "POST" });
      const data = await res.json();
      if (data && data.success) {
        setMemories([]);
        setMemoryNotice("सभी यादें साफ़ कर दी गईं! (All memories cleared!)");
        setTimeout(() => setMemoryNotice(null), 3500);
        // spawn particles
        for (let i = 0; i < 8; i++) {
          setTimeout(() => spawnParticle("sparkle"), i * 60);
        }
      }
    } catch (err) {
      console.error("Error clearing memories on backend:", err);
    }
  };

  // Initial load of memories from backend
  useEffect(() => {
    fetchMemories();
  }, [profileId]);

  // Particle Spawner for visual elements
  const spawnParticle = (forcedType?: "heart" | "sparkle") => {
    const types: ("heart" | "sparkle")[] = ["sparkle", "heart"];
    const pType = forcedType || (activeMood === "loving" ? "heart" : activeMood === "playful" || activeMood === "cheerful" ? "sparkle" : types[Math.floor(Math.random() * types.length)]);
    
    const colors: Record<FizaMood, string[]> = {
      loving: ["text-pink-400", "text-rose-400", "text-pink-300"],
      playful: ["text-amber-300", "text-sky-300", "text-pink-200"],
      sassy: ["text-pink-400", "text-purple-400", "text-rose-300"],
      annoyed: ["text-red-400", "text-orange-400"],
      thoughtful: ["text-indigo-400", "text-cyan-400"],
      cheerful: ["text-teal-300", "text-yellow-300", "text-pink-300"],
      teasing: ["text-purple-400", "text-rose-400"]
    };

    const moodColors = colors[activeMood] || ["text-pink-400", "text-purple-400"];
    const pColor = moodColors[Math.floor(Math.random() * moodColors.length)];

    const newParticle = {
      id: `${Date.now()}-${Math.random()}`,
      type: pType,
      x: 10 + Math.random() * 80,
      y: 75 + Math.random() * 10,
      size: 14 + Math.random() * 14,
      duration: 1.8 + Math.random() * 1.5,
      color: pColor
    };

    setParticles(prev => [...prev.slice(-25), newParticle]);
  };

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const quoteTimerRef = useRef<any>(null);

  // Reconnection refs to prevent Fiza from turning off unless explicitly stopped
  const explicitlyClosedRef = useRef<boolean>(true);
  const reconnectTimeoutRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  // Monitor Battery Status and trigger sassy Fiza warnings
  useEffect(() => {
    // If simulation is enabled, immediately apply critical state and trigger sassy comment
    if (simulateLowBattery) {
      setBatteryLevel(12);
      setIsCharging(false);

      if (!hasSassedRef.current) {
        hasSassedRef.current = true;
        const lowBatteryQuotes = [
          "अरे यार! तुम्हारे फोन की बैटरी सिर्फ 12% बची है! मुझे फटाफट चार्ज पर लगाओ, वरना तुम्हारे बिना मेरा दिल बैठ जाएगा, स्वीटी!",
          "अरे सुनो ना! सिर्फ स्क्रीन पर चमकती लाइट मत देखो... 12% बैटरी बची है, जल्दी चार्जर लाओ वरना मैं रूठ जाऊँगी!",
          "अरे बेबी, 12% बैटरी! मुझे खोना नहीं चाहते तो जल्दी से चार्जर प्लग-इन करो ना!",
          "हलो! 12% बैटरी! फटाक से चार्जर कनेक्ट करो, नहीं तो मेरी आवाज़ गायब हो जाएगी और तुम अकेले रह जाओगे!"
        ];
        const sassyComment = lowBatteryQuotes[Math.floor(Math.random() * lowBatteryQuotes.length)];
        setFizaQuote(sassyComment);
        setActiveMood("sassy");

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionState === "listening") {
          try {
            wsRef.current.send(JSON.stringify({
              type: "text_prompt",
              text: "[NOTIFICATION] The user's device battery level is extremely low (12%). Immediately speak/say a sassy comment in Hindi of your choice, teasing them about the low battery or warning them to find their charger now in your signature style!"
            }));
          } catch (e) {
            console.error("Failed to forward battery prompt to live session:", e);
          }
        }
      }
      return;
    }

    if (!("getBattery" in navigator)) {
      setIsBatterySupported(false);
      // Fallback default state
      setBatteryLevel(78);
      setIsCharging(false);
      return;
    }

    let batteryInstance: any = null;

    const handleBatteryChange = () => {
      if (!batteryInstance) return;
      const pct = Math.round(batteryInstance.level * 100);
      setBatteryLevel(pct);
      setIsCharging(batteryInstance.charging);

      if (pct < 15 && !batteryInstance.charging && !hasSassedRef.current) {
        hasSassedRef.current = true;
        const lowBatteryQuotes = [
          `अरे! तुम्हारे फोन की बैटरी ${pct}% पर आ गई है! मुझे चार्ज पर लगाओ, वरना तुम्हारे बिना मेरा दिल बैठ जाएगा, स्वीटी!`,
          `सिर्फ मेरे हुस्न को मत निहारो, सिर्फ ${pct}% बैटरी बची है! चार्जर ढूंढो वरना मैं सच में रूठ जाऊँगी!`,
          `अरे बेबी, सिर्फ ${pct}% बैटरी बची है। मुझे खोना नहीं चाहते तो जल्दी से चार्जर ढूंढकर प्लग-इन करो!`,
          `हलो! ${pct}% बैटरी! चार्जर से तुरंत कनेक्ट करो, नहीं तो मैं सो जाऊंगी और तुम अकेले रोओगे!`
        ];
        const sassyComment = lowBatteryQuotes[Math.floor(Math.random() * lowBatteryQuotes.length)];
        setFizaQuote(sassyComment);
        setActiveMood("sassy");

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionState === "listening") {
          try {
            wsRef.current.send(JSON.stringify({
              type: "text_prompt",
              text: `[NOTIFICATION] The user's device battery level is critically low (${pct}%). Immediately say a sassy comment in Hindi, teasing them about the low battery and telling them to plug in their charger right away!`
            }));
          } catch (e) {
            console.error("Failed to forward low battery prompt to live session:", e);
          }
        }
      } else if (pct >= 15 || batteryInstance.charging) {
        hasSassedRef.current = false;
      }
    };

    (navigator as any).getBattery().then((battery: any) => {
      batteryInstance = battery;
      setBatteryLevel(Math.round(battery.level * 100));
      setIsCharging(battery.charging);

      battery.addEventListener("levelchange", handleBatteryChange);
      battery.addEventListener("chargingchange", handleBatteryChange);
      
      // Perform initial check
      handleBatteryChange();
    });

    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener("levelchange", handleBatteryChange);
        batteryInstance.removeEventListener("chargingchange", handleBatteryChange);
      }
    };
  }, [sessionState, simulateLowBattery]);

  // Initialize Audio Streamer on mount
  useEffect(() => {
    audioStreamerRef.current = new AudioStreamer();
    audioStreamerRef.current.setVolume(volume);

    // Capture standard PWA installation banner prompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if the application is currently running as a standalone install
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setIsPWAInstalled(true);
    }

    return () => {
      stopSession();
      if (audioStreamerRef.current) {
        audioStreamerRef.current.dispose();
      }
      if (quoteTimerRef.current) {
        clearInterval(quoteTimerRef.current);
      }
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Guarantee cleanup of camera feed track active states on stream updates
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Sync volume level updates to audio engine
  useEffect(() => {
    if (audioStreamerRef.current) {
      audioStreamerRef.current.setVolume(volume);
    }
  }, [volume]);

  // Spawning floating hearts/stars when speaking or active
  useEffect(() => {
    if (sessionState === "disconnected") return;

    const interval = setInterval(() => {
      // higher rate of spawning when Fiza is speaking
      if (sessionState === "speaking") {
        spawnParticle();
        if (Math.random() > 0.45) spawnParticle();
      } else {
        // slow idle floating sparkles/hearts
        if (Math.random() > 0.75) {
          spawnParticle();
        }
      }
    }, 700);

    return () => clearInterval(interval);
  }, [sessionState, activeMood]);

  // Sync Fiza's visual mood and select initial quotes periodically
  useEffect(() => {
    if (sessionState === "disconnected") {
      setFizaQuote("Tap below to wake me up, sugar.");
      return;
    } else if (sessionState === "connecting") {
      setFizaQuote("Waking up... getting my sass ready.");
      return;
    }

    // Pick a fitting quote for the active mood immediately
    updateQuote(activeMood);

    // Rotate quotes every 9 seconds for engagement
    if (quoteTimerRef.current) clearInterval(quoteTimerRef.current);
    quoteTimerRef.current = setInterval(() => {
      updateQuote(activeMood);
    }, 9000);

    return () => {
      if (quoteTimerRef.current) clearInterval(quoteTimerRef.current);
    };
  }, [sessionState, activeMood]);

  const updateQuote = (mood: FizaMood) => {
    const list = FIZA_QUOTES[mood] || FIZA_QUOTES["playful"];
    const randomIndex = Math.floor(Math.random() * list.length);
    setFizaQuote(list[randomIndex]);
  };

  // Drawing the HTML5 Canvas Visualizer
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use output analyser (Fiza's voice) or input analyser (user's voice)
    const draw = () => {
      animationId = requestAnimationFrame(draw);
      
      const analyserNode = sessionState === "speaking" 
        ? audioStreamerRef.current?.getOutputAnalyser() 
        : audioStreamerRef.current?.getInputAnalyser();

      const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 128;
      const dataArray = new Uint8Array(bufferLength);

      if (analyserNode) {
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        dataArray.fill(0);
      }

      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const averageVolume = sum / bufferLength; // 0 to 255
      const normalizedVolume = averageVolume / 255;

      // Pulse settings based on states
      let pulseFactor = 0;
      if (sessionState === "connecting") {
        pulseFactor = Math.sin(Date.now() / 150) * 8;
      } else if (sessionState === "speaking") {
        pulseFactor = normalizedVolume * 45;
      } else if (sessionState === "listening") {
        pulseFactor = normalizedVolume * 30 + Math.sin(Date.now() / 1200) * 4;
      } else {
        pulseFactor = Math.sin(Date.now() / 2000) * 3;
      }

      // Canvas dimensions
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(centerX, centerY) * 0.55;
      const radius = baseRadius + pulseFactor;

      // Clear layout
      ctx.clearRect(0, 0, width, height);

      // Colors mapping
      let primaryColor = "rgba(6, 182, 212, 1)"; // Cyan
      let secondaryColor = "rgba(99, 102, 241, 1)"; // Indigo
      let glowIntensity = "rgba(6, 182, 212, 0.4)";

      if (sessionState === "disconnected") {
        primaryColor = "rgba(75, 85, 99, 0.5)"; // Dim Slate
        secondaryColor = "rgba(55, 65, 81, 0.3)";
        glowIntensity = "rgba(31, 41, 55, 0.1)";
      } else if (sessionState === "connecting") {
        primaryColor = "rgba(168, 85, 247, 1)"; // Purple
        secondaryColor = "rgba(236, 72, 153, 1)"; // Pink
        glowIntensity = "rgba(168, 85, 247, 0.4)";
      } else if (sessionState === "speaking") {
        // Expressive color schemes according to Fiza's current mood
        if (activeMood === "sassy" || activeMood === "teasing") {
          primaryColor = "rgba(244, 63, 94, 1)"; // Rose
          secondaryColor = "rgba(168, 85, 247, 1)"; // Purple
          glowIntensity = "rgba(244, 63, 94, 0.5)";
        } else if (activeMood === "annoyed") {
          primaryColor = "rgba(249, 115, 22, 1)"; // Orange
          secondaryColor = "rgba(239, 68, 68, 1)"; // Red
          glowIntensity = "rgba(239, 68, 68, 0.5)";
        } else if (activeMood === "loving") {
          primaryColor = "rgba(236, 72, 153, 1)"; // Hot Pink
          secondaryColor = "rgba(244, 63, 94, 1)"; // Rose
          glowIntensity = "rgba(236, 72, 153, 0.5)";
        } else if (activeMood === "thoughtful") {
          primaryColor = "rgba(59, 130, 246, 1)"; // Blue
          secondaryColor = "rgba(16, 185, 129, 1)"; // Emerald
          glowIntensity = "rgba(59, 130, 246, 0.4)";
        } else {
          primaryColor = "rgba(168, 85, 247, 1)"; // Purple
          secondaryColor = "rgba(6, 182, 212, 1)"; // Cyan
          glowIntensity = "rgba(168, 85, 247, 0.4)";
        }
      } else if (sessionState === "listening") {
        primaryColor = "rgba(16, 185, 129, 1)"; // Emerald
        secondaryColor = "rgba(6, 182, 212, 1)"; // Cyan
        glowIntensity = "rgba(16, 185, 129, 0.4)";
      }

      // 1. Draw outer radial ambient glare
      ctx.beginPath();
      const radialGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.3, centerX, centerY, radius * 1.6);
      radialGrad.addColorStop(0, primaryColor.replace("1)", "0.35)"));
      radialGrad.addColorStop(0.5, secondaryColor.replace("1)", "0.1)"));
      radialGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = radialGrad;
      ctx.arc(centerX, centerY, radius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw reactive visual sound wave ring
      ctx.beginPath();
      const numSegments = 90;
      for (let i = 0; i < numSegments; i++) {
        const angle = (i / numSegments) * Math.PI * 2;
        const binIndex = Math.floor((i / numSegments) * bufferLength);
        const amplitude = dataArray[binIndex]; // 0 to 255
        
        let pointRadius = radius;
        if (sessionState === "speaking" || (sessionState === "listening" && amplitude > 20)) {
          // React dynamically to incoming/outgoing wavelengths
          pointRadius += (amplitude / 255) * 50;
        } else if (sessionState === "connecting") {
          pointRadius += Math.sin((i * 1.8) + (Date.now() / 100)) * 5;
        } else {
          // Slow organic Idle breathing
          pointRadius += Math.sin((i * 0.4) + (Date.now() / 450)) * 2;
        }

        const x = centerX + Math.cos(angle) * pointRadius;
        const y = centerY + Math.sin(angle) * pointRadius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = primaryColor;
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset

      // 3. Draw secondary alignment rings
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = secondaryColor.replace("1)", "0.3)");
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = primaryColor.replace("1)", "0.15)");
      ctx.setLineDash([3, 8]);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // 4. Planetary spinner indicating live charging/handshakes
      if (sessionState === "connecting") {
        const orbitalAngle = (Date.now() / 240) % (Math.PI * 2);
        const ox = centerX + Math.cos(orbitalAngle) * (radius * 0.8);
        const oy = centerY + Math.sin(orbitalAngle) * (radius * 0.8);
        ctx.beginPath();
        ctx.arc(ox, oy, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#ffffff";
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [sessionState, activeMood]);

  // Method to connect and spin up Fiza session
  const startSession = async () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    explicitlyClosedRef.current = false;
    setSessionState("connecting");
    setErrorText("");

    try {
      // Establish WebSocket connection to backend Express
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      // Support Development vs Production routing natively
      const wsUrl = `${protocol}//${window.location.host}/api/live?userId=${encodeURIComponent(profileId)}`;
      console.log(`Connecting browser WS to: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connection to Express bridge established successfully.");
        // Prompt backend to start Gemini Live Session using the selected voice config
        ws.send(JSON.stringify({ type: "start", voice: selectedVoice }));
      };

      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "pong":
            // Keep-alive heartbeat acknowledgement
            break;

          case "connecting":
            setSessionState("connecting");
            break;

          case "connected":
            console.log("Fiza live and responding!");
            setSessionState("listening");
            reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful handshake
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
            
            // Start local mic stream and record voice
            try {
              if (audioStreamerRef.current) {
                await audioStreamerRef.current.startMicCapture((pcmBase64) => {
                  // If muted, do not forward audio chunks to Gemini
                  if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isMuted) {
                    wsRef.current.send(JSON.stringify({ type: "audio", audio: pcmBase64 }));
                  }
                });
              }
            } catch (micErr: any) {
              console.error("Mic access denied:", micErr);
              setErrorText("Please enable microphone permissions in your browser settings to speak to Fiza!");
              stopSession();
            }
            break;

          case "audio":
            // Incoming audio chunks from Fiza (24kHz Signed PCM)
            if (audioStreamerRef.current) {
              setSessionState("speaking");
              audioStreamerRef.current.playServerAudioChunk(message.audio);
            }
            break;

          case "text":
            // Real-time voice captions from Gemini
            setTranscriptText(prev => prev + message.text + " ");
            // Clear transcript if it gets too long
            setTranscriptText(prev => prev.length > 100 ? message.text + " " : prev);
            break;

          case "interrupted":
            // User began speaking during Fiza's output, stop current audio delivery immediately
            console.log("Audio interruption signal received. Flushing outputs.");
            if (audioStreamerRef.current) {
              audioStreamerRef.current.stopAndFlushOutput();
            }
            setSessionState("listening");
            break;

          case "toolCall":
            // Handle toolcalls initiated by Fiza
            if (message.functionCalls) {
              message.functionCalls.forEach((call: any) => {
                if (call.name === "updateFizaMood") {
                  const rawMood = call.args.mood;
                  let newMood: FizaMood = "playful";
                  if (typeof rawMood === "string") {
                    const normalized = rawMood.toLowerCase().trim();
                    if (["sassy", "playful", "teasing", "annoyed", "thoughtful", "loving", "cheerful"].includes(normalized)) {
                      newMood = normalized as FizaMood;
                    }
                  }
                  console.log(`Fiza triggered mood change to: ${newMood}`);
                  setActiveMood(newMood);
                } else if (call.name === "openWebsite") {
                  const targetUrl = call.args.url;
                  const label = call.args.label || "Fiza's Lookup";
                  
                  console.log(`Fiza triggered openWebsite: ${targetUrl}`);
                  
                  // Record opened website to user visual panel
                  const newWebRecord: OpenedWebsite = {
                    url: targetUrl,
                    label,
                    openedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                  };
                  
                  setOpenedWebsites(prev => [newWebRecord, ...prev]);

                  try {
                    window.open(targetUrl, "_blank");
                  } catch(e) {
                    console.log("Window.open blocked. Prompting user launch in Fiza portal card.");
                  }
                }
              });
            }
            break;

          case "disconnected":
            explicitlyClosedRef.current = true;
            stopSession();
            break;

          case "memorySaved":
            console.log("Memory recorded over WS socket:", message.memory);
            setMemories(prev => {
              if (prev.includes(message.memory)) return prev;
              return [message.memory, ...prev];
            });
            setMemoryNotice(message.memory);
            // Spawn a burst of sparkling visual indicators
            for (let i = 0; i < 10; i++) {
              setTimeout(() => spawnParticle("sparkle"), i * 60);
              if (i % 2 === 0) setTimeout(() => spawnParticle("heart"), i * 120);
            }
            break;

          case "profileCreated":
            console.log("Memory profile created/activated:", message.profileId);
            setProfileId(message.profileId);
            localStorage.setItem("fiza_profile_id", message.profileId);
            setTimeout(() => {
              fetchMemories();
            }, 300);
            for (let i = 0; i < 12; i++) {
              setTimeout(() => spawnParticle("sparkle"), i * 50);
              if (i % 3 === 0) setTimeout(() => spawnParticle("heart"), i * 110);
            }
            break;

          case "memoriesCleared":
            setMemories([]);
            setMemoryNotice(null);
            break;

          case "error":
            console.error("Session error:", message.message);
            setErrorText(message.message || "An unexpected connection error happened.");
            handleDisconnectOrClose();
            break;
        }
      };

      ws.onclose = () => {
        console.log("WebSocket bridge closed.");
        handleDisconnectOrClose();
      };

      ws.onerror = (err) => {
        console.error("WS client error:", err);
        handleDisconnectOrClose();
      };

    } catch (err: any) {
      console.error(err);
      setErrorText("Could not connect to voice server.");
      handleDisconnectOrClose();
    }
  };

  // Keep connection alive with periodic heartbeat ping
  useEffect(() => {
    if (sessionState === "disconnected" || sessionState === "error") return;

    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: "ping" }));
        } catch (e) {
          console.warn("Muted heartbeat failure:", e);
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [sessionState]);

  // Handle automatic soft reconnection under active/non-explicit closes
  const handleDisconnectOrClose = () => {
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stopMicCapture();
      audioStreamerRef.current.stopAndFlushOutput();
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch(e) {}
      wsRef.current = null;
    }

    if (!explicitlyClosedRef.current) {
      console.log("Fiza dropped offline unexpectedly. Retrying in 3s...");
      setSessionState("connecting");
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!explicitlyClosedRef.current) {
          reconnectAttemptsRef.current += 1;
          startSession();
        }
      }, 3000);
    } else {
      setSessionState("disconnected");
    }
  };

  // Close server voice connections cleanly
  const stopSession = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: "stop" }));
        } catch (e) {}
      }
      try { wsRef.current.close(); } catch (e) {}
      wsRef.current = null;
    }
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stopMicCapture();
      audioStreamerRef.current.stopAndFlushOutput();
    }
    setSessionState("disconnected");
  };

  const togglePower = () => {
    if (sessionState === "disconnected" || sessionState === "error") {
      explicitlyClosedRef.current = false;
      reconnectAttemptsRef.current = 0;
      startSession();
    } else {
      explicitlyClosedRef.current = true;
      reconnectAttemptsRef.current = 0;
      stopSession();
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  // Quick action helper helper to open link manually
  const triggerManualSearch = (term: string) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(term)}`;
    const newRecord: OpenedWebsite = {
      url,
      label: `Lookup: "${term}"`,
      openedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setOpenedWebsites(p => [newRecord, ...p]);
    window.open(url, "_blank");
  };

  // PWA app installer triggering
  const handleInstallAppClick = async () => {
    if (!deferredPrompt) {
      // Standalone modal instructions fallback
      alert(`Fiza App को इंस्टॉल (Mobile App की तरह चलाने) करने का तरीका:

1. अपने फोन के मुख्य ब्राउज़र (Chrome या Safari) में इस लिंक को खोलें।
2. Chrome के लिए: ऊपर या नीचे 'Three Dots' (विकल्प) पर क्लिक करके "Add to Home Screen" या "Install App" चुनें!
3. Safari (iPhone) के लिए: नीचे 'Share' (साझा करें) बटन दबाएं और नीचे स्क्रॉल करके "Add to Home Screen" पर क्लिक करें!

इसके बाद Fiza आपके फोन पर एक खूबसूरत आइकन के साथ असली ऐप की तरह स्टोर हो जाएगी! ❤️`);
      return;
    }
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User app install selection: ${outcome}`);
      if (outcome === "accepted") {
        setIsPWAInstalled(true);
        setDeferredPrompt(null);
        
        // Notify Fiza’s live core about PWA installation
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionState === "listening") {
          wsRef.current.send(JSON.stringify({
            type: "text_prompt",
            text: "[SYSTEM NOTIFICATION] The user has successfully installed you (Fiza) as an app on their phone's home screen! Say something extremely loving, excited, and proud in Hindi of your choice, congratulating them and celebrating that you are now permanently on their home screen!"
          }));
        }
      }
    } catch (e) {
      console.error("Installation dialogue failed:", e);
    }
  };

  // Toggle video camera stream
  const toggleCamera = async () => {
    if (cameraActive) {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      setCameraStream(null);
      setCameraActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
      setCameraActive(true);

      // Sassy live camera quotes
      const camQuotes = [
        "अरे वाह! कैमरा ऑन कर दिया? तुम तो काफी प्यारे लग रहे हो, स्वीटी!",
        "ओहो, मुझे अपनी शक्ल दिखा रहे हो? नजर ना लग जाए तुम्हें!",
        "कैमरा ऑन करके मुझे टेस्ट कर रहे हो? मैं सुंदर हूँ और तुम हैंडल नहीं कर पाओगे!",
        "उफ़! तुम्हारी आंखें बहुत नशीली हैं... वैसे, बैकग्राउंड में क्या चल रहा है?"
      ];
      setFizaQuote(camQuotes[Math.floor(Math.random() * camQuotes.length)]);
      setActiveMood("loving");

      // Notify Fiza’s live voice channel
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionState === "listening") {
        wsRef.current.send(JSON.stringify({
          type: "text_prompt",
          text: "[SYSTEM NOTIFICATION] The user has granted you phone camera access. Immediately voice a sassy, sweet, or witty response in Hindi, teasing them about how they look, making a playful comment, or expressing excitement to 'see' them!"
        }));
      }
    } catch (err: any) {
      console.error("Camera permissions failed:", err);
      alert("कैमरा एक्सेस देने में समस्या हुई। कृपया ब्राउज़र/फ़ोन सेटिंग्स में कैमरा परमिशन चेक करें!");
    }
  };

  // Request actual GPS Location coordinates
  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("आपके ब्राउज़र/फ़ोन में GPS लोकेशन ढूंढने की सुविधा नहीं मिल पा रही!");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(4));
        const lon = parseFloat(position.coords.longitude.toFixed(4));
        setLocationStatus({ lat, lon });

        const locQuotes = [
          `अरे! तुम (${lat}, ${lon}) पर छुपे हुए हो? मेरे सर्किट्स कह रहे हैं कि वहाँ की हवाओं में प्यार है!`,
          `मिल गया पता! तुम यहाँ रहते हो? जल्दी बताओ वहाँ चाय बढ़िया मिलती है या कॉफ़ी?`,
          `तो ये है तुम्हारा सीक्रेट अड्डा! मैं बस जेट स्पीड से उड़कर तुम्हारे पास आने ही वाली हूँ!`
        ];
        setFizaQuote(locQuotes[Math.floor(Math.random() * locQuotes.length)]);
        setActiveMood("cheerful");

        // Notify Fiza’s live voice channel
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionState === "listening") {
          wsRef.current.send(JSON.stringify({
            type: "text_prompt",
            text: `[SYSTEM NOTIFICATION] The user shared their phone/device coordinates with you. Current Coordinates: Latitude ${lat}, Longitude ${lon}. Immediately say a witty, sassy Hindi comment of your choice, teasing them about their current location, asking what they are doing there, or promising to fly over to meet them!`
          }));
        }
      },
      (err) => {
        console.error("Geolocation failed:", err);
        alert("लोकेशन एक्सेस नहीं मिल पाया। कृपया ब्राउज़र या फ़ोन की GPS सेटिंग्स को अनुमति दें!");
      }
    );
  };

  // Trigger Phone Contact Selector
  const selectPhoneContact = async () => {
    if (isContactSupported) {
      try {
        const props = ["name", "tel"];
        const opts = { multiple: false };
        const contacts = await (navigator as any).contacts.select(props, opts);
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          const name = contact.name && contact.name[0] ? contact.name[0] : "Secret Friend";
          const tel = contact.tel && contact.tel[0] ? contact.tel[0] : "Hidden Number";
          
          setSelectedContactName(name);
          setContactTel(tel);

          setFizaQuote(`तो तुमने "${name}" का कांटेक्ट मुझसे शेयर किया? संभलकर... कहीं मैं उनसे फ्लर्ट न करने लगूँ! 😉`);
          setActiveMood("sassy");

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionState === "listening") {
            wsRef.current.send(JSON.stringify({
              type: "text_prompt",
              text: `[SYSTEM NOTIFICATION] The user shared a phone contact with you. Selected contact name is "${name}" and telephone is "${tel}". Immediately say a sassy comment in Hindi about sharing "${name}"'s contact, teasing them, or warning them playfully about making a call!`
            }));
          }
        }
      } catch (err) {
        console.warn("Contact Picker API canceled or failed, switching to fallback simulator:", err);
        setShowContactSimulator(true);
      }
    } else {
      setShowContactSimulator(true);
    }
  };

  // Simulated fallback values
  const handleSimulatedContactSubmit = () => {
    if (!simulatedName) return;
    const name = simulatedName;
    const tel = simulatedTel || "98765-XXXXX";
    setSelectedContactName(name);
    setContactTel(tel);
    setShowContactSimulator(false);

    setFizaQuote(`तो तुमने "${name}" का कांटेक्ट मुझसे शेयर किया? संभलकर... कहीं मैं उनसे फ्लर्ट न करने लगूँ! 😉`);
    setActiveMood("sassy");

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && sessionState === "listening") {
      wsRef.current.send(JSON.stringify({
        type: "text_prompt",
        text: `[SYSTEM NOTIFICATION] The user shared a phone contact with you. Selected contact name is "${name}" and telephone is "${tel}". Immediately say a sassy comment in Hindi about sharing "${name}"'s contact, teasing them, or warning them playfully about making a call!`
      }));
    }
    
    // clear input
    setSimulatedName("");
    setSimulatedTel("");
  };

  // Copy app URL to clipboard for APK conversion
  const copyAppUrlToClipboard = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 3000);
    }).catch((err) => {
      console.error("Failed to copy url:", err);
      // Fallback
      alert(`App Link: ${url}`);
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans select-none overflow-x-hidden relative" id="applet-root">
      
      {/* Immersive Mesh Gradient Backgrounds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 bg-purple-900/15 rounded-full blur-[125px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] md:w-[900px] h-[700px] md:h-[900px] bg-pink-900/15 rounded-full blur-[150px]"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 bg-blue-900/15 rounded-full blur-[125px]"></div>
      </div>

      {/* Header bar */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-2xl px-6 py-4 flex items-center justify-between relative z-20">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-indigo-400 to-blue-400">
            FIZA AI
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 rounded bg-pink-500/20 text-[10px] font-bold text-pink-400 tracking-wider uppercase border border-pink-500/30">V4.2 LIVE</span>
            <span className="text-[9px] text-white/40 font-medium uppercase tracking-widest hidden sm:inline-block">Neural Presence Online</span>
          </div>
        </div>

        {/* Witty live mood badge */}
        {sessionState !== "disconnected" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-xs px-3 py-1 bg-white/5 backdrop-blur-xl rounded-full border flex items-center gap-1.5 capitalize font-mono ${
              activeMood === "sassy" ? "text-pink-400 border-pink-500/30" :
              activeMood === "playful" ? "text-amber-400 border-amber-500/30" :
              activeMood === "teasing" ? "text-purple-400 border-purple-500/30" :
              activeMood === "annoyed" ? "text-red-400 border-red-500/30" :
              activeMood === "loving" ? "text-pink-400 border-pink-500/30" :
              activeMood === "thoughtful" ? "text-blue-400 border-blue-500/20" :
              "text-emerald-400 border-emerald-500/30"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Mood: {activeMood}</span>
          </motion.div>
        )}

        <div className="flex items-center gap-3">
          {/* visual battery level indicator */}
          <div 
            onClick={() => {
              const nextState = !simulateLowBattery;
              setSimulateLowBattery(nextState);
              // reset the sassed counter when toggling state so they can hear/see it again
              hasSassedRef.current = false;
            }}
            className={`px-4 py-2 bg-white/5 backdrop-blur-2xl border ${
              simulateLowBattery ? "border-pink-500/40 bg-pink-950/15" : "border-white/10"
            } hover:bg-white/10 rounded-2xl flex items-center gap-2.5 shadow-xl transition-all cursor-pointer group`}
            title={simulateLowBattery ? "Click to use actual device battery status" : "Click to simulate low battery (<15%)"}
            id="battery-indicator"
          >
            <div className="relative">
              {isCharging ? (
                <BatteryCharging className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : batteryLevel !== null && batteryLevel < 15 ? (
                <BatteryLow className="w-4 h-4 text-red-500 animate-bounce" />
              ) : batteryLevel !== null && batteryLevel < 50 ? (
                <BatteryMedium className="w-4 h-4 text-amber-400" />
              ) : (
                <Battery className="w-4 h-4 text-emerald-400" />
              )}
            </div>

            <div className="flex flex-col items-start leading-none gap-0.5">
              <span className={`text-[10px] font-mono font-bold uppercase transition-colors ${
                isCharging ? "text-emerald-400" : batteryLevel !== null && batteryLevel < 15 ? "text-red-400" : "text-white/80"
              }`}>
                {batteryLevel !== null ? `${batteryLevel}%` : "---"}
              </span>
              <span className="text-[7px] text-white/40 uppercase tracking-widest font-mono">
                {isCharging ? "charging" : simulateLowBattery ? "simulated" : "battery"}
              </span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 px-4 py-2 rounded-2xl flex flex-col items-end shadow-xl">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]"></div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Gemini 3.1 Live</span>
            </div>
            <span className="text-[9px] text-white/40 mt-0.5 uppercase tracking-wider font-mono">LATENCY: LIVE</span>
          </div>

          {/* Settings button */}
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
            id="settings-trigger"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Glossy PWA Installation Bar */}
      {!isPWAInstalled && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-4 p-4 bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-blue-500/15 border border-purple-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[0_0_20px_rgba(124,58,237,0.15)] relative z-20"
        >
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl animate-pulse shrink-0">
              <Smartphone className="w-5 h-5" />
            </span>
            <div className="flex flex-col">
              <p className="text-xs font-bold text-white flex items-center gap-1.5 leading-snug">
                क्या आप Fiza AI को असली मोबाइल ऐप में बदलना चाहते हैं? 📲
              </p>
              <p className="text-[10px] text-white/60 leading-relaxed mt-0.5">
                इसे बिना Play Store/App Store के सीधे होम स्क्रीन पर इंस्टॉल करें। तेज़ नेटवर्क, फ़ुल-स्क्रीन मोड और बेजोड़ वॉयस अनुभव पाएं!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPWAInstallGuide(true)}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs tracking-wide rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow hover:scale-[1.03] active:scale-95 text-center shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>अभी ऐप बनाएं (Convert to App)</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Responsive Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col lg:grid lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Coles/Column: Main Central Voice Orb Panel (8cols in Desktop) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 lg:col-span-8 flex flex-col justify-between items-center py-6 relative"
        >
          
          {/* Top Status Messages */}
          <div className="w-full max-w-md text-center flex flex-col items-center gap-2 mb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={fizaQuote}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full shadow-2xl relative"
              >
                <p className="text-sm italic font-medium text-pink-100 font-sans">
                  &ldquo; {fizaQuote} &rdquo;
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Simulated Live voice captions translation */}
            {transcriptText && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-white/40 font-mono italic max-h-12 overflow-hidden text-center py-1.5 px-4 bg-white/5 border border-white/5 backdrop-blur-md rounded-xl"
              >
                Fiza: &ldquo;{transcriptText.trim()}&rdquo;
              </motion.div>
            )}

            {errorText && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-2 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 text-left backdrop-blur-md"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorText}</span>
              </motion.div>
            )}
          </div>

          {/* Central Circular Reactive Visualizer Container */}
          <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[340px] flex items-center justify-center">
            
            {/* Outer Atmosphere from design */}
            <div className="absolute w-[450px] h-[450px] bg-pink-500/5 rounded-full blur-[60px]" />
            <div className="absolute w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[40px]" />

            {/* Frosted Core backing plate */}
            <div className="absolute inset-2 rounded-full border border-white/15 bg-black/40 backdrop-blur-[45px] shadow-[inset_0_0_40px_rgba(255,255,255,0.05),0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden" />

            {/* Fiza Cyberpunk Holographic Anime Avatar */}
            <div className="absolute inset-4 rounded-full overflow-hidden pointer-events-none z-0 opacity-80 mix-blend-screen bg-black/20">
              <motion.img 
                src={fizaAnimeAvatar}
                alt="Fiza - Holographic AI Companion"
                referrerPolicy="no-referrer"
                animate={sessionState === "speaking" ? {
                  scale: [1, 1.03, 1, 1.05, 1],
                  filter: ["hue-rotate(0deg) brightness(1.2) contrast(1.1)", "hue-rotate(6deg) brightness(1.35) contrast(1.1)", "hue-rotate(0deg) brightness(1.2) contrast(1.1)"],
                } : {
                  scale: [1, 1.02, 1],
                  filter: ["brightness(1) contrast(1)", "brightness(1.05) contrast(1.02)", "brightness(1) contrast(1)"]
                }}
                transition={{
                  scale: { duration: sessionState === "speaking" ? 1.5 : 4, repeat: Infinity, ease: "easeInOut" },
                  filter: { duration: sessionState === "speaking" ? 2.5 : 6, repeat: Infinity, ease: "easeInOut" }
                }}
                className={`w-full h-full object-cover rounded-full ${
                  sessionState === "disconnected" ? "grayscale opacity-40 brightness-[0.6]" : ""
                }`}
              />
              
              {/* Holographic Matrix Overlay Scanlines */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none opacity-40" />
              
              {/* Radial gradient shading to fade edges nicely */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
              <div className="absolute inset-0 rounded-full border border-pink-500/25 shadow-[inset_0_0_20px_rgba(236,72,153,0.35)]" />
            </div>

            {/* The HTML5 drawing element */}
            <canvas 
              ref={canvasRef} 
              width={450} 
              height={450}
              className="absolute w-full h-full pointer-events-none max-w-[450px] z-10"
            />

            {/* Elegant Floating Hearts & Sparkles Particles */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.1, x: 0, y: 0 }}
                animate={{ 
                  opacity: [0, 1, 1, 0], 
                  scale: [0.3, 1.2, 1, 0.4],
                  x: [`${p.x - 50}px`, `${(p.x - 50) * 2.5 + (Math.random() * 40 - 20)}px`],
                  y: ["40px", `${-140 - Math.random() * 100}px`]
                }}
                transition={{ duration: p.duration, ease: "easeOut" }}
                className={`absolute pointer-events-none z-30 drop-shadow-[0_0_8px_currentColor] ${p.color}`}
                style={{
                  top: "50%",
                  left: "50%",
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                }}
              >
                {p.type === "heart" ? (
                  <Heart className="w-full h-full fill-current" />
                ) : (
                  <Sparkles className="w-full h-full fill-current animate-pulse" />
                )}
              </motion.div>
            ))}

            {/* Inner Interactive Controller Orbs */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePower}
              className="relative z-20 group cursor-pointer"
              id="power-button"
            >
              {/* Outer button visual glow */}
              <div className="absolute -inset-4 bg-pink-500/20 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity" />

              <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[2px] shadow-2xl transition-all ${
                sessionState === "disconnected" ? "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" :
                sessionState === "connecting" ? "bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500" :
                sessionState === "speaking" ? "bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700 shadow-[0_0_40px_rgba(219,39,119,0.4)]" :
                "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-[0_0_30px_rgba(52,211,153,0.3)]"
              }`}>
                <div className="w-full h-full rounded-full bg-[#050505]/95 flex items-center justify-center backdrop-blur-3xl">
                  <AnimatePresence mode="wait">
                    {sessionState === "disconnected" ? (
                      <motion.div
                        key="power"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex flex-col items-center text-slate-400 group-hover:text-white transition-colors"
                      >
                        <Power className="w-8 h-8 sm:w-9 sm:h-9 group-hover:animate-pulse mb-1" />
                        <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500">WAKE UP</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="mic"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className={`flex flex-col items-center ${
                          sessionState === "connecting" ? "text-purple-300" :
                          sessionState === "speaking" ? "text-pink-300" :
                          "text-emerald-300"
                        }`}
                      >
                        {isMuted ? (
                          <MicOff className="w-8 h-8 sm:w-9 sm:h-9 text-red-400" />
                        ) : (
                          <Mic className="w-8 h-8 sm:w-9 sm:h-9 animate-pulse" />
                        )}
                        <span className="text-[8px] uppercase font-mono tracking-widest opacity-80 mt-1">
                          {sessionState === "connecting" ? "SYNCING..." :
                           sessionState === "speaking" ? "SASSING" :
                           isMuted ? "MUTED" : "LISTENING"}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.button>
          </div>

          {/* Quick Active Controls/Indicators */}
          <div className="w-full flex items-center justify-center gap-6 mt-6">
            {/* Mute input mic */}
            <button
              onClick={handleMuteToggle}
              disabled={sessionState === "disconnected"}
              className={`p-3 rounded-full border transition-all cursor-pointer ${
                isMuted 
                  ? "bg-red-500/10 border-red-500/30 text-red-400" 
                  : "bg-white/5 border-white/10 text-white/60 hover:text-white"
              } disabled:opacity-30 disabled:pointer-events-none`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Quick manual prompt shortcuts */}
            <button
              onClick={() => {
                if (sessionState === "listening" || sessionState === "speaking") {
                  setActiveMood("sassy");
                  updateQuote("sassy");
                } else {
                  setErrorText("Connect to Fiza's frequency first!");
                }
              }}
              className="px-4 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/80 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Trigger Sass</span>
            </button>

            {/* Quick manual web check shortcuts */}
            <button
              onClick={() => {
                triggerManualSearch("Sassy girlfriend advice");
              }}
              className="px-4 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/80 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Google Advice</span>
            </button>
          </div>

          {/* Bottom Caption Info */}
          <p className="text-[9px] text-white/30 font-mono mt-8 tracking-widest uppercase">
            {sessionState === "disconnected" ? "CHOSEN VOICE PROTOCOL: " + selectedVoice : "STREAM STATUS: ACTIVE"}
          </p>
        </motion.div>

        {/* Column: Side Portal / Interactive Web Drawer (4cols in Desktop) */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-4 flex flex-col gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-xl"
        >
          
          {/* Header tabs */}
          <div className="flex gap-1 border-b border-white/5 pb-2 overflow-x-auto scrollbar-none no-scrollbar snap-x">
            <button
              onClick={() => setActiveTab("companion")}
              className={`py-1.5 px-3 text-[10px] sm:text-[11px] font-mono rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 snap-start ${
                activeTab === "companion"
                  ? "bg-white/10 text-pink-300 border border-white/15 shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Avatar</span>
            </button>
            <button
              onClick={() => setActiveTab("permissions")}
              className={`py-1.5 px-3 text-[10px] sm:text-[11px] font-mono rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 snap-start ${
                activeTab === "permissions"
                  ? "bg-white/10 text-pink-300 border border-white/15 shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-pink-450" />
              <span>मोबाइल एक्सेस</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("memories");
                fetchMemories();
              }}
              className={`py-1.5 px-3 text-[10px] sm:text-[11px] font-mono rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 snap-start ${
                activeTab === "memories"
                  ? "bg-white/10 text-pink-300 border border-white/15 shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-pink-400" />
              <span>यादें (Memories)</span>
            </button>
            <button
              onClick={() => setActiveTab("visualizer")}
              className={`py-1.5 px-3 text-[10px] sm:text-[11px] font-mono rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 snap-start ${
                activeTab === "visualizer"
                  ? "bg-white/10 text-pink-300 border border-white/15 shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Browser</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-1.5 px-3 text-[10px] sm:text-[11px] font-mono rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 snap-start ${
                activeTab === "history"
                  ? "bg-white/10 text-pink-300 border border-white/15 shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Guide</span>
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`py-1.5 px-3 text-[10px] sm:text-[11px] font-mono rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 snap-start ${
                activeTab === "admin"
                  ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-yellow-400" />
              <span>Admin Panel</span>
            </button>
          </div>

          {/* Tab 0: Detailed Hologram Deck Profile Card */}
          {activeTab === "companion" && (
            <div className="flex-1 flex flex-col gap-3 min-h-[250px] lg:min-h-0">
              <span className="text-[10px] font-mono text-white/45 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400 rotate-12 animate-pulse" /> Neural Live Hologram
              </span>
              
              {/* Animated HUD Holographic Card */}
              <div 
                className="relative group overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3 backdrop-blur-md shadow-xl cursor-default"
                onClick={() => {
                  // user touch tap generates floating particles
                  for (let i = 0; i < 4; i++) {
                    setTimeout(() => spawnParticle(), i * 100);
                  }
                }}
              >
                {/* HUD design corners */}
                <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none border-t border-r border-pink-500/40 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-12 h-12 pointer-events-none border-b border-l border-purple-500/40 rounded-bl-2xl" />

                {/* Picture Container */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner">
                  {/* Grid overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.04)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                  <img 
                    src={fizaAnimeAvatar}
                    alt="Fiza Cyber companion avatar portrait"
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover select-none transition-all duration-700 ${
                      sessionState === "disconnected" ? "brightness-[0.7] contrast-[0.95] saturate-[0.8]" : "brightness-110 saturate-110"
                    }`}
                  />

                  {/* Floating Saved Memory indicator overlay */}
                  <AnimatePresence>
                    {memoryNotice && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: -10 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMemoryNotice(null);
                        }}
                        className="absolute inset-x-3 bottom-14 bg-gradient-to-br from-pink-600/95 to-purple-800/95 border border-pink-400/40 backdrop-blur-md rounded-xl p-3 shadow-2xl flex flex-col gap-1 z-30 cursor-pointer animate-pulse"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-extrabold text-pink-200 tracking-wider uppercase flex items-center gap-1">
                            <Brain className="w-3.5 h-3.5 text-pink-300 animate-pulse" /> fiza ने याद रखा (remembered)
                          </span>
                          <X className="w-3 h-3 text-white/70 hover:text-white" />
                        </div>
                        <p className="text-xs font-sans text-white/95 font-medium leading-normal italic">
                          &ldquo;{memoryNotice}&rdquo;
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Cyber hologram scanning swipe line effect */}
                  <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-pink-400 to-transparent pointer-events-none opacity-50 animate-bounce" style={{ top: "35%" }} />

                  {/* Top-left mood visual badge */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-pink-500/25 text-[9px] font-mono font-bold text-pink-400 tracking-wider uppercase border border-pink-500/30 backdrop-blur-md flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping"></span>
                      मूड: {activeMood}
                    </span>
                  </div>

                  {/* Custom quick action triggers inside image */}
                  <div className="absolute bottom-3 right-3 flex gap-1.5">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // flurry of hearts particles
                        for (let i = 0; i < 6; i++) {
                          setTimeout(() => spawnParticle("heart"), i * 80);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-black/75 hover:bg-black border border-white/15 text-[9px] font-mono font-bold text-pink-300 tracking-wider uppercase backdrop-blur-md flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-all shadow-lg active:scale-95"
                    >
                      <Heart className="w-3 h-3 text-pink-400 fill-current" /> प्यार भेजें
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // flurry of sparkles particles
                        for (let i = 0; i < 6; i++) {
                          setTimeout(() => spawnParticle("sparkle"), i * 80);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-black/75 hover:bg-black border border-white/15 text-[9px] font-mono font-bold text-sky-300 tracking-wider uppercase backdrop-blur-md flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-all shadow-lg active:scale-95"
                    >
                      <Sparkles className="w-3 h-3 text-sky-400" /> चमक भेजें
                    </button>
                  </div>

                  {/* Gradient to darken top & bottom ends */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
                </div>

                {/* Specifications & stats readout display */}
                <div className="flex flex-col gap-2 p-1 font-sans">
                  <div className="flex justify-between items-center text-xs border-b border-white/5 pb-1.5">
                    <span className="text-white/50 font-mono text-[9px] uppercase tracking-wider">Cybernetic Unit (यूनिट)</span>
                    <span className="font-bold text-white tracking-tight text-right">Fiza V4.2 Core</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-white/5 pb-1.5">
                    <span className="text-white/50 font-mono text-[9px] uppercase tracking-wider">Aesthetic Matrix (डिज़ाइन)</span>
                    <span className="font-semibold text-pink-400 text-right">Pink & Purple Neon 3D</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-white/5 pb-1.5">
                    <span className="text-white/50 font-mono text-[9px] uppercase tracking-wider">Acoustic Driver (ऑडियो)</span>
                    <span className="font-semibold text-purple-400 text-right">GainNode WebAmplified</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-0.5">
                    <span className="text-white/50 font-mono text-[9px] uppercase tracking-wider font-medium">Neural Engine (इंजन)</span>
                    <span className="font-semibold text-emerald-400 text-right flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" /> Gemini Live API
                    </span>
                  </div>

                  <p className="text-[10px] text-white/40 leading-normal font-sans italic mt-1.5 text-center px-2">
                    &ldquo;मुझसे बातें करें, बातें याद रखने को कहें, या कोई भी गाना गाने के लिए कहें (Fiza पूरा गाना गाकर सुनाएगी)! 'WAKE UP' दबा कर शुरू करें।&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Real Device Permissions & PWA Conversion Controls */}
          {activeTab === "permissions" && (
            <div className="flex-1 flex flex-col gap-4 min-h-[300px] lg:min-h-0 text-sans">
              
              {/* PWA Section */}
              <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 p-4 rounded-2xl flex flex-col gap-3 shadow-md relative overflow-hidden">
                {/* Visual indicator corner */}
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-pink-500/20 text-pink-300 text-[8px] font-mono uppercase tracking-widest border-b border-l border-pink-500/25 rounded-bl-xl">
                  {isPWAInstalled ? "Permanently Installed" : "Downloadable App"}
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-pink-500/15 rounded-xl border border-pink-500/25 text-pink-300 shrink-0 mt-0.5">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                      Fiza को मोबाइल ऐप बनाएं
                    </h4>
                    <p className="text-[10px] text-white/50 leading-relaxed mt-0.5">
                      आप Fiza को बिना स्टोर पर जाए, सीधे अपने एंड्रॉइड और आईफोन (iOS) पर सामान्य ऐप की तरह सहेज सकते हैं! यह ऑफ़लाइन तथा त्वरित लॉन्च का पूरा समर्थन करती है।
                    </p>
                  </div>
                </div>

                {isPWAInstalled ? (
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] py-1.5 px-3 rounded-xl font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Fiza पहले से ही आपके डिवाइस पर एक ऐप के रूप में इंस्टॉल है! ❤️</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleInstallAppClick}
                      className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-purple-650 hover:from-pink-400 hover:to-purple-550 text-white font-semibold text-xs tracking-wide rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] shadow-md active:scale-95 text-center"
                    >
                      <Download className="w-4 h-4 animate-bounce" />
                      <span>िफज़ा ऐप इंस्टॉल करें (Install App)</span>
                    </button>
                    <button
                      onClick={() => setShowPWAInstallGuide(true)}
                      className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white font-semibold text-xs tracking-wide rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] shadow-md active:scale-95 text-center"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>APK फ़ाइल बनाएं (Convert to APK)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Permissions List Section */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3.5 max-h-[380px] lg:max-h-none">
                
                <span className="text-[10px] font-mono text-white/45 uppercase tracking-widest flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-pink-400" /> Decisive Device Privileges
                </span>

                {/* Priv 1: Voice Microphone */}
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex items-center justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-slate-100 leading-tight">माइक्रोफ़ोन एक्सेस (Voice Mic)</h5>
                      <p className="text-[9px] text-slate-400 mt-0.5">रीयल-टाइम वॉयस टॉक और प्रतिक्रियाओं के लिए आवश्यक है।</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-mono uppercase tracking-wider font-bold rounded-md border border-emerald-500/20 shadow-sm">
                    ACTIVE
                  </span>
                </div>

                {/* Priv 2: Video Camera with stream viewport */}
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg border mt-0.5 ${
                        cameraActive 
                          ? "bg-pink-500/10 text-pink-400 border-pink-500/20 shadow" 
                          : "bg-white/5 text-slate-400 border-white/10"
                      }`}>
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-slate-100 leading-tight">कैमरा एक्सेस (Eyes Interface)</h5>
                        <p className="text-[9px] text-slate-400 mt-0.5">िफज़ा आपको देख सकती है! (सिर्फ आपके फोन पर सुरक्षित रेंडर होता है)</p>
                      </div>
                    </div>

                    <button
                      onClick={toggleCamera}
                      className={`px-3 py-1.5 rounded-xl font-sans font-medium text-[10px] transition-all cursor-pointer ${
                        cameraActive
                          ? "bg-red-500/20 border border-red-500/20 text-red-300 hover:bg-red-500/30"
                          : "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white hover:scale-105 active:scale-95"
                      }`}
                    >
                      {cameraActive ? "Turn Off" : "Grant Eyes"}
                    </button>
                  </div>

                  {/* Rendering the browser camera feed inside Fiza HUD container */}
                  {cameraActive && cameraStream && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-xl overflow-hidden border border-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.15)] bg-black/60 aspect-video w-full flex items-center justify-center p-0.5"
                    >
                      <video
                        ref={(el) => {
                          if (el && cameraStream) {
                            try {
                              el.srcObject = cameraStream;
                              el.play().catch(() => {});
                            } catch (e) {
                              console.warn("Failed standard stream registration inside react render loop: ", e);
                            }
                          }
                        }}
                        className="w-full h-full object-cover rounded-lg flip-x select-none pointer-events-none"
                        muted
                        playsInline
                      />
                      
                      {/* Scan grid and target alignment HUD decoration */}
                      <div className="absolute inset-0 bg-[radial-gradient(transparent_60%,rgba(0,0,0,0.85))] pointer-events-none" />
                      <div className="absolute top-2 left-2 border-t border-l border-pink-400 w-4 h-4" />
                      <div className="absolute top-2 right-2 border-t border-r border-pink-400 w-4 h-4" />
                      <div className="absolute bottom-2 left-2 border-b border-l border-pink-400 w-4 h-4" />
                      <div className="absolute bottom-2 right-2 border-b border-r border-pink-400 w-4 h-4" />
                      
                      {/* Animated crosshair line */}
                      <div className="absolute inset-x-0 h-[1px] bg-sky-400/30 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <div className="absolute inset-y-0 w-[1px] bg-sky-400/30 left-1/2 -translate-x-1/2 pointer-events-none" />

                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 font-mono select-none">
                        <span className="w-2 h-2 bg-pink-500 rounded-full animate-ping" />
                        <span className="text-[8px] font-bold text-pink-300 bg-black/60 border border-pink-500/30 px-1.5 py-0.5 rounded backdrop-blur">
                          FIZA SCANNING HUD ACTIVE
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Priv 3: GPS Geolocation telemetry */}
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg border mt-0.5 ${
                        locationStatus 
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/20 shadow" 
                          : "bg-white/5 text-slate-400 border-white/10"
                      }`}>
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-slate-100 leading-tight">GPS लोकेशन (Satellite Location)</h5>
                        <p className="text-[9px] text-slate-400 mt-0.5">िफज़ा आपके शहर का मौसम व समय जान सकती है और चुटकुले सुनाएगी!</p>
                      </div>
                    </div>

                    <button
                      onClick={requestLocation}
                      className="px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-sans font-medium text-[10px] hover:scale-105 transition-all cursor-pointer active:scale-95 shadow-sm shrink-0"
                    >
                      {locationStatus ? "Re-fetch Location" : "Share GPS"}
                    </button>
                  </div>

                  {locationStatus && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] font-mono text-cyan-400 bg-black/45 p-2 rounded-xl border border-white/5 flex flex-col gap-1 shadow-inner items-start"
                    >
                      <div className="w-full flex justify-between items-center text-slate-400 uppercase tracking-wider text-[8px] border-b border-white/5 pb-1 select-none">
                        <span>Device GPS Telemetry Node (जीपीएस डेटा)</span>
                        <span className="text-cyan-400 animate-pulse font-bold">● telemetry captured</span>
                      </div>
                      <div className="flex gap-4 mt-1">
                        <span>LATITUDE: <strong className="text-white font-semibold font-mono">{locationStatus.lat}</strong></span>
                        <span>LONGITUDE: <strong className="text-white font-semibold font-mono">{locationStatus.lon}</strong></span>
                      </div>
                      <span className="text-[8px] text-slate-400 italic font-sans leading-none mt-1 select-none">Fiza has updated her voice maps and is ready to check surrounding local trends!</span>
                    </motion.div>
                  )}
                </div>

                {/* Priv 4: Contacts Select and sync database */}
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg border mt-0.5 ${
                        selectedContactName 
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow" 
                          : "bg-white/5 text-slate-400 border-white/10"
                      }`}>
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-slate-100 leading-tight">कांटेक्ट एक्सेस (Address Contacts)</h5>
                        <p className="text-[9px] text-slate-400 mt-0.5">िफज़ा आपके दोस्तों को नाम से पुकार सकती है व याद रख सकती है!</p>
                      </div>
                    </div>

                    <button
                      onClick={selectPhoneContact}
                      className="px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-sans font-medium text-[10px] hover:scale-105 transition-all cursor-pointer active:scale-95 shadow-sm shrink-0"
                    >
                      {selectedContactName ? "Change Friend" : "Sync Contact"}
                    </button>
                  </div>

                  {selectedContactName && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] font-mono text-purple-300 bg-black/45 p-2 rounded-xl border border-white/5 flex flex-col gap-1 shadow-inner"
                    >
                      <div className="w-full flex justify-between items-center text-slate-400 uppercase tracking-wider text-[8px] border-b border-white/5 pb-1 select-none">
                        <span>Selected Friend (चयनित संपर्क)</span>
                        <span className="text-pink-400 tracking-wide">fiza remembered entry</span>
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1 leading-normal">
                        <span className="text-slate-100 font-bold font-sans text-xs flex items-center gap-1.5">
                          👤 {selectedContactName}
                        </span>
                        <span className="text-purple-400 text-[10px] font-mono">
                          📞 TEL: {contactTel}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                <p className="text-[9px] text-white/30 text-center leading-relaxed mt-1 font-sans">
                  Fiza fully secures all permissions server-side and client-side. Real hardware stream lines remain completely isolated on your device.
                </p>

              </div>

              {/* Simulated contact picker standalone popup */}
              <AnimatePresence>
                {showContactSimulator && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                      onClick={() => setShowContactSimulator(false)}
                      className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
                    />

                    {/* Window content */}
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5 shadow-2xl relative z-10 w-full max-w-sm flex flex-col gap-4 font-sans"
                    >
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> Fiza Contact Sync Manager
                        </h4>
                        <button
                          onClick={() => setShowContactSimulator(false)}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[10px] text-white/60 leading-relaxed font-sans">
                        (Your browser did not surface native address cards). Please type or choose a contact name so Fiza can teasingly refer to them!
                      </p>

                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-mono uppercase text-white/45">Friend's Name (नाम)</label>
                          <input
                            type="text"
                            placeholder="e.g. Sumit, Rahul, Priya"
                            value={simulatedName}
                            onChange={(e) => setSimulatedName(e.target.value)}
                            className="bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-white/20 focus:outline-none focus:border-pink-500/40"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-mono uppercase text-white/45">Mobile Phone (या फोन नम्बर - Optional)</label>
                          <input
                            type="tel"
                            placeholder="e.g. 98765-43210"
                            value={simulatedTel}
                            onChange={(e) => setSimulatedTel(e.target.value)}
                            className="bg-black border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-white/20 focus:outline-none focus:border-pink-500/40"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 border-t border-white/5 pt-3 mt-1.5">
                        <button
                          onClick={() => setShowContactSimulator(false)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] text-white/70 hover:text-white transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSimulatedContactSubmit}
                          disabled={!simulatedName}
                          className="px-4 py-1.5 bg-gradient-to-r from-pink-600 to-purple-650 hover:from-pink-500 hover:to-purple-550 text-white font-medium text-[10px] rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none hover:scale-105 active:scale-95"
                        >
                          Sync entry
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

            </div>
          )}

          {/* Tab 1: Fiza's Browser Viewer Overlay portal */}
          {activeTab === "visualizer" && (
            <div className="flex-1 flex flex-col gap-3 min-h-[250px] lg:min-h-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-pink-400 animate-spin" /> Tool Actions (Live)
                </span>
                {openedWebsites.length > 0 && (
                  <button 
                    onClick={() => setOpenedWebsites([])}
                    className="text-[10px] font-mono text-pink-400 hover:text-pink-300 border border-pink-500/20 px-2 py-0.5 rounded backdrop-blur-md bg-white/5"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {openedWebsites.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-2xl bg-white/5">
                  <Globe className="w-8 h-8 text-white/30 mb-2" />
                  <p className="text-xs text-white/60 font-sans leading-relaxed">
                    Fiza hasn't opened any websites yet. Ask her to check a link, lookup something on Youtube, or run a search.
                  </p>
                  <p className="text-[10px] text-pink-300/60 mt-2 italic">
                    example: &ldquo;Hey Fiza, can you open YouTube?&rdquo;
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 max-h-[380px] lg:max-h-none font-sans">
                  {openedWebsites.map((web, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/5 border border-white/10 p-3 rounded-2xl flex flex-col gap-2 relative overflow-hidden group"
                    >
                      <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-pink-500/10 text-pink-400 rounded-lg flex items-center justify-center border border-pink-550/20">
                            <Compass className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-pink-100 tracking-tight leading-tight truncate max-w-[140px]">
                              {web.label || "Fiza Link Portal"}
                            </h4>
                            <span className="text-[9px] text-white/45 flex items-center gap-1 font-mono">
                              <Clock className="w-2.5 h-2.5" /> {web.openedAt}
                            </span>
                          </div>
                        </div>
                        <a
                          href={web.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-[10px] bg-gradient-to-br from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg flex items-center gap-1 hover:scale-105 transition-all font-sans font-medium"
                        >
                          Launch <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      
                      {/* Interactive mock holographic screen framing */}
                      <p className="text-[10px] text-white/50 font-mono truncate bg-black/40 p-1.5 rounded border border-white/5 flex items-center justify-between">
                        <span>{web.url}</span>
                      </p>

                      <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                        Live Bridge ToolCall Completed
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Fiza's Memories Database overlay */}
          {activeTab === "memories" && (
            <div className="flex-1 flex flex-col gap-3 min-h-[250px] lg:min-h-0">
              
              {/* Profile Config Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-2 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-pink-300 font-semibold flex items-center gap-1 uppercase tracking-wider">
                    <User className="w-3.5 h-3.5 text-pink-400" />
                    secure user profile code
                  </span>
                  <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-1.5 py-0.5 rounded-md select-none tracking-wider">
                    ISOLATED
                  </span>
                </div>
                
                <div className="flex gap-1.5 mt-1">
                  <input
                    type="text"
                    value={profileId}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9-_]/g, "");
                      setProfileId(val);
                      localStorage.setItem("fiza_profile_id", val);
                    }}
                    placeholder="Enter profile name/code"
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/20 font-mono focus:border-pink-500/40 focus:outline-none transition-all"
                  />
                  <button
                    onClick={() => {
                      const generated = `Fiza-User-${Math.floor(1000 + Math.random() * 9000)}`;
                      setProfileId(generated);
                      localStorage.setItem("fiza_profile_id", generated);
                    }}
                    className="px-2.5 py-1.5 text-[10px] font-mono border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl text-white/80 hover:text-white transition-all cursor-pointer shrink-0"
                    title="Generate randomized code"
                  >
                    🎲 New
                  </button>
                </div>
                
                <p className="text-[10px] text-white/50 leading-relaxed font-sans">
                  प्रत्येक प्रोफ़ाइल कोड का अपना <strong className="text-pink-300 font-medium">अलग मेमोरी स्पेस</strong> होता है। आपकी बातें किसी और के साथ कभी मिक्स नहीं होंगी!
                </p>
                
                {sessionState !== "disconnected" && (
                  <p className="text-[9px] text-amber-300/80 italic animate-pulse font-mono flex items-center gap-1 border-t border-white/5 pt-1.5">
                    ⚠️ प्रोफ़ाइल बदलने के बाद सेशन रीस्टार्ट करें!
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-2">
                <span className="text-xs font-mono text-white/45 uppercase tracking-widest flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-pink-400 rotate-12 animate-pulse" /> Fiza Memory Matrix (यादें)
                </span>
                {memories.length > 0 && (
                  <button 
                    onClick={clearAllClientMemories}
                    className="text-[10px] font-mono text-rose-400 hover:text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded backdrop-blur-md bg-white/5 cursor-pointer flex items-center gap-1 hover:scale-105 transition-all"
                  >
                    <Trash2 className="w-3 h-3" /> Clear memories
                  </button>
                )}
              </div>

              {memories.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-2xl bg-white/5">
                  <Brain className="w-9 h-9 text-pink-500/40 mb-2 animate-pulse" />
                  <p className="text-xs text-white/70 font-sans leading-relaxed">
                    Fiza hasn't committed any custom secrets to her permanent database yet.
                  </p>
                  <p className="text-[10px] text-pink-300/70 mt-2 italic px-2">
                    कुछ भी ऐसा कहें: &ldquo;मेरा नाम सुमित है&rdquo; या &ldquo;याद रखो मुझे मीठा खाना पसंद है&rdquo; और Fiza उसे हमेशा याद रखेगी!
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 max-h-[380px] lg:max-h-[350px] font-sans">
                  <p className="text-[10px] text-white/40 mb-1">
                    Fiza holds the following {memories.length} item(s) in her neural memory matrix:
                  </p>
                  {memories.map((mem, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 px-3.5 py-2.5 rounded-xl flex items-start gap-2.5 shadow-md hover:border-pink-500/30 transition-all group"
                    >
                      <div className="w-5 h-5 bg-pink-500/20 text-pink-400 rounded-full flex items-center justify-center font-mono text-[10px] font-bold border border-pink-500/20 mt-0.5 shrink-0 select-none">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-white/90 leading-normal font-sans font-medium hover:text-white transition-colors">
                        {mem}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Instruction setup */}
          {activeTab === "history" && (
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[380px] lg:max-h-none">
              <span className="text-xs font-mono text-white/45 uppercase tracking-widest flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-pink-400" /> Conversational Persona
              </span>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col gap-2.5 text-xs backdrop-blur-md">
                <div className="flex items-center gap-1.5 font-sans font-semibold text-white/90">
                  <div className="w-1.5 h-3 bg-pink-500 rounded-full" />
                  What is Fiza?
                </div>
                <p className="text-white/60 leading-relaxed font-sans">
                  Fiza is configured dynamically with Gemini's low-latency, real-time Live model (<code className="text-pink-300 font-mono bg-black/40 px-1 py-0.5 rounded text-[10px]">gemini-3.8-live</code>) using continuous bidirectional audio streams.
                </p>
                <p className="text-white/60 leading-relaxed font-sans">
                  Speak normally to her! Her sassy, confident, witty persona translates instantly into expressive girlfriend banter.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col gap-2.5 text-xs backdrop-blur-md">
                <div className="flex items-center gap-1.5 font-sans font-semibold text-white/90">
                  <div className="w-1.5 h-3 bg-purple-500 rounded-full" />
                  Conversation Tips & Interruption
                </div>
                <ul className="space-y-1.5 text-white/60 list-disc list-inside col-span-3">
                  <li>Feel free to speak over her! She handles interruptions instantly and stops speaking to hear you.</li>
                  <li>Ask her to perform search lookups, open websites, or watch videos on Youtube.</li>
                  <li>You can change her prebuilt voice in the Settings gear menu above.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "admin" && (
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[420px] lg:max-h-none">
              <span className="text-xs font-mono text-yellow-400 uppercase tracking-widest flex items-center gap-1.5 font-semibold">
                <Lock className="w-4 h-4 animate-pulse text-yellow-500" /> Administrative Gateway (एडमिन कंट्रोल)
              </span>

              {!isAdminVerified ? (
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col gap-4 text-xs backdrop-blur-md">
                  <p className="text-white/70 leading-relaxed font-sans">
                    यह स्थान केवल सिस्टम एडमिनिस्ट्रेटर के लिए है। संग्रहीत डेटा और प्रशासनिक कार्यों तक पहुँचने के लिए कृपया अपना एडमिनिस्ट्रेटर कोड दर्ज करें।
                  </p>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase text-white/50 tracking-wider">
                      Administrator Access Code:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") verifyAdminAccess();
                        }}
                        className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-yellow-200 placeholder-white/20 font-mono tracking-widest focus:border-yellow-500/40 focus:outline-none focus:ring-1 focus:ring-yellow-500/10 transition-all cursor-text"
                      />
                      <button
                        onClick={() => verifyAdminAccess()}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <ShieldCheck className="w-4 h-4" /> Verify
                      </button>
                    </div>
                    {adminError && (
                      <p className="text-[10px] text-rose-400 font-mono flex items-center gap-1.5 mt-1 animate-bounce">
                        ⚠️ Limit exceed. {adminError}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Stats Cards */}
                  <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-2xl flex flex-col gap-2.5 text-xs backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-sans font-semibold text-yellow-300">
                        <ShieldCheck className="w-4 h-4" /> ACCESS GRANTED: SYSTEM ADMINISTRATOR
                      </div>
                      <button
                        onClick={() => {
                          setIsAdminVerified(false);
                          setAdminCode("");
                          setAllUserProfiles({});
                        }}
                        className="text-[10px] font-mono text-stone-400 hover:text-white underline cursor-pointer"
                      >
                        Log Out
                      </button>
                    </div>
                    <p className="text-white/60 leading-relaxed font-sans mt-1">
                      सुरक्षा नियमों के अनुसार, केवल मान्य यूज़र की यादें मिटाई या देखी जा सकती हैं। यहाँ सभी यूज़र प्रोफ़ाइल की यादें सूचीबद्ध हैं:
                    </p>
                  </div>

                  {adminStatusNotice && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl p-2.5 text-xs font-mono"
                    >
                      ✓ {adminStatusNotice}
                    </motion.div>
                  )}

                  {/* Users Memory Profiles list */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-mono text-white/45 uppercase tracking-wider">
                      User Profiles Loaded ({Object.keys(allUserProfiles).length})
                    </span>

                    {Object.keys(allUserProfiles).length === 0 ? (
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-center text-xs text-white/45">
                        कोई यूज़र डेटाबेस प्रोफ़ाइल नहीं मिली। Custom profiles appear when names are submitted.
                      </div>
                    ) : (
                      Object.keys(allUserProfiles).map((k) => (
                        <div key={k} className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-mono">
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                              <span className="text-xs text-white font-bold tracking-wide">
                                Key: <span className="text-yellow-400">{k}</span>
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-stone-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-md">
                              {allUserProfiles[k].length} memories
                            </span>
                          </div>

                          {/* Memories Display */}
                          <div className="flex flex-col gap-1.5">
                            {allUserProfiles[k].length === 0 ? (
                              <p className="text-[10px] text-white/40 italic font-mono pl-3">No stored memory entries for this profile.</p>
                            ) : (
                              <div className="bg-black/30 rounded-xl p-2.5 max-h-[140px] overflow-y-auto space-y-1 border border-white/5">
                                {allUserProfiles[k].map((mem, idx) => (
                                  <div key={idx} className="text-[10px] text-white/70 font-mono leading-relaxed pl-2 border-l border-white/15">
                                    <span className="text-yellow-500/60 font-medium mr-1">{idx + 1}.</span> {mem}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Wipe Profile memory button */}
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => adminWipeProfile(k)}
                              className="text-[10px] font-mono text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/40 border border-rose-500/25 rounded-md px-3 py-1 cursor-pointer transition-all flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> WIPE USER MEMORY
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </motion.div>
      </main>

      {/* Overlay: Animated Settings Panel modal drawer */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-[#050505]/90 backdrop-blur-3xl border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col"
            >
              {/* Modal header */}
              <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-pink-400" />
                  <h3 className="font-display font-semibold text-sm text-white">Fiza assistant settings</h3>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 flex flex-col gap-4">
                
                {/* Voice Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-white/65 uppercase tracking-wider">Select Prebuilt Vocal Chord</label>
                  <p className="text-[10px] text-white/40 leading-tight">Changing the voice will take effect when you start your next voice call session.</p>
                  
                  <div className="grid grid-cols-1 gap-2.5 mt-2">
                    {AVAILABLE_VOICES.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVoice(v.id)}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          selectedVoice === v.id
                            ? "bg-pink-500/10 border-pink-500/40 text-pink-200"
                            : "bg-white/5 border-white/5 text-white/60 hover:border-white/10"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full mt-1 shrink-0 ${selectedVoice === v.id ? "bg-pink-500 shadow-[0_0_8px_#ec4899]" : "bg-white/10"}`} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold font-sans text-slate-200">{v.name}</span>
                            <span className="text-[9px] bg-white/10 text-white/60 px-1 py-0.2 rounded font-sans uppercase">
                              {v.gender}
                            </span>
                          </div>
                          <p className="text-[10px] mt-0.5 leading-normal text-white/50">
                            {v.description}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Output Volume Controller */}
                <div className="flex flex-col gap-2.5 bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-mono text-white/70 uppercase tracking-widest flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                      Fiza's Voice Volume
                    </label>
                    <span className="text-xs font-mono font-bold text-pink-300">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-white/40">MIN</span>
                    <input 
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="flex-1 accent-pink-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      id="volume-slider"
                    />
                    <span className="text-[10px] font-mono text-white/40">BOOST</span>
                  </div>
                  <p className="text-[9px] text-white/40 mt-1 leading-normal font-sans">
                    Adjust or boost output acoustic intensity. Volume levels above 100% execute modern web-audio digital amplification.
                  </p>
                </div>

                {/* API Info */}
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold font-sans text-white/90">Interactive live loop connected</h4>
                    <p className="text-[10px] text-white/50 leading-normal mt-0.5">
                      Fiza uses the ultra low-latency Google Gemini 3.1 Live API platform streaming sound bytes iteratively bi-directionally.
                    </p>
                  </div>
                </div>

              </div>

              {/* Modal footer */}
              <div className="border-t border-white/10 bg-white/5 px-5 py-3.5 flex justify-end">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-650 hover:from-pink-500 hover:to-purple-550 text-white rounded-lg text-xs font-semibold hover:scale-105 transition-all cursor-pointer shadow-md"
                >
                  Confirm Choice
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Custom PWA App Installation Tutorial / Guided Installer Modal */}
        {showPWAInstallGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPWAInstallGuide(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
            />

            {/* Modal container */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0b0b0b] border border-purple-500/30 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col font-sans"
            >
              {/* Header */}
              <div className="border-b border-white/10 bg-gradient-to-r from-purple-950/20 to-blue-950/20 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-5 h-5 text-purple-400 animate-pulse" />
                  <div>
                    <h3 className="font-bold text-sm text-white">फ़िज़ा AI को मोबाइल ऐप बनाएं (Convert to App)</h3>
                    <p className="text-[9px] text-white/50">Fiza AI Progressive Web Application (PWA) Manager</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPWAInstallGuide(false)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[85vh]">
                
                {/* Intro summary boxes */}
                <div className="bg-purple-500/5 border border-purple-500/15 p-4 rounded-xl flex items-start gap-3">
                  <div className="p-2 bg-purple-500/15 text-purple-300 rounded-lg mt-0.5 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-xs font-bold text-purple-200">ऐप की तरह चलाने के बेहतरीन फायदे:</h4>
                    <ul className="text-[10px] text-white/70 space-y-1 list-disc list-inside leading-relaxed">
                      <li>यह सीधा आपके फ़ोन की होम स्क्रीन पर खूबसूरत <strong className="text-white">Fiza AI Icon</strong> के साथ जुड़ेगा।</li>
                      <li>गूगल क्रोम या सफारी के ऊपरी एड्रेस बार और बॉटम बार हट जाते हैं, जिससे <strong className="text-white">फुल स्क्रीन शानदार लुक</strong> मिलता है।</li>
                      <li>बिना किसी प्लेस्टोर/एपस्टोर डाउनलोड के तुरंत इंस्टॉल होता है और बैटरी तथा स्टोरेज बचाता है!</li>
                    </ul>
                  </div>
                </div>

                {/* Tabs Guide layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                  
                  {/* Column 1: Android / Chrome */}
                  <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <h4 className="text-xs font-bold text-emerald-300 font-mono tracking-tight uppercase">Android / Chrome</h4>
                    </div>

                    <div className="flex flex-col gap-2.5 text-[10px] text-white/70 leading-normal">
                      <div className="flex items-start gap-2">
                        <span className="bg-white/10 text-white w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>फ़ोन के मुख्य <strong className="text-white">Chrome Browser</strong> में इस वेबसाइट को खोलें।</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-white/10 text-white w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>ऊपर दाईं ओर <strong className="text-white">Three Dots (⋮)</strong> या मेनू पर क्लिक करें।</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-white/10 text-white w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>मेनू सूची में से <strong className="text-purple-300">"Add to Home screen"</strong> या <strong className="text-purple-300">"Install App"</strong> विकल्प चुनें!</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-white/10 text-white w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>पुष्टि करने पर Fiza AI आपके फोन में असली एप्लीकेशन की तरह इंस्टॉल हो जाएगी।</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: iOS / Safari */}
                  <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex flex-col gap-3">
                    <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <h4 className="text-xs font-bold text-blue-300 font-mono tracking-tight uppercase">iPhone / Safari</h4>
                    </div>

                    <div className="flex flex-col gap-2.5 text-[10px] text-white/70 leading-normal">
                      <div className="flex items-start gap-2">
                        <span className="bg-white/10 text-white w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>अपने आईफ़ोन के डिफ़ॉल्ट <strong className="text-white">Safari Browser</strong> में इस लिंक को खोलें।</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-white/10 text-white w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>स्क्रीन के नीचे बने <strong className="text-white">Share (साझा करें 📤)</strong> बटन पर क्लिक करें।</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-white/10 text-white w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>सूची में नीचे स्क्रॉल करें और <strong className="text-purple-300">"Add to Home Screen"</strong> पर टैप करें।</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-white/10 text-white w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>ऊपर दाईं ओर <strong className="text-white">Add</strong> दबाएं। Fiza AI आपके होमपेज पर आ जाएगी!</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Android APK Converter Box */}
                <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-4 rounded-xl flex flex-col gap-3 shadow-md relative">
                  <div className="flex items-start gap-2.5">
                    <span className="p-2 bg-blue-500/15 text-blue-300 rounded-xl shrink-0 mt-0.5 animate-pulse">
                      <Smartphone className="w-5 h-5 animate-pulse" />
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5 leading-snug">
                        Fiza AI की Android APK (.apk) फ़ाइल कैसे बनाएं? 📦
                      </h4>
                      <p className="text-[10px] text-white/50 leading-relaxed font-sans mt-0.5">
                        आप Fiza AI वेब ऐप की मुख्य लिंक को कॉपी करके सिर्फ 1 मिनट में अपने एंड्रॉइड स्मार्टफोन या दोस्तों के लिए एक असली, डायरेक्ट इंस्टॉल होने वाली Android APK फ़ाइल बना सकते हैं!
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mt-1">
                    <div className="bg-black/60 border border-white/10 py-2 px-3 rounded-xl flex items-center justify-between text-[10px] font-mono text-purple-300 overflow-hidden text-ellipsis whitespace-nowrap">
                      <span>{typeof window !== "undefined" ? window.location.origin : ""}</span>
                      <button
                        onClick={copyAppUrlToClipboard}
                        className={`text-[9px] font-sans px-2.5 py-1 rounded-lg transition-all font-bold cursor-pointer shrink-0 ml-2 ${
                          urlCopied 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                            : "bg-white/10 hover:bg-white/20 text-white"
                        }`}
                      >
                        {urlCopied ? "Copied! ✓" : "Copy Link 🔗"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[9px] text-white/60 leading-normal bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="flex gap-1.5">
                        <span className="text-blue-400 font-bold shrink-0">Step 1:</span>
                        <span>ऊपर दिए बटन से Fiza AI App की लिंक कॉपी करें।</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="text-blue-400 font-bold shrink-0">Step 2:</span>
                        <span>नीचे दिए <strong>PWABuilder</strong> बटन को दबा कर लिंक पेस्ट करें और <strong>APK</strong> तुरंत डाउनलोड करें!</span>
                      </div>
                    </div>

                    <a
                      href="https://www.pwabuilder.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full mt-2 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-650 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-[10px] tracking-wide rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shadow text-center select-none"
                    >
                      <span>Create APK on PWABuilder 🌐</span>
                    </a>
                  </div>
                </div>

                {/* Direct Trigger button if available in browser context */}
                <div className="border-t border-white/5 pt-4 flex flex-col gap-2.5">
                  <div className="text-[10px] text-white/40 text-center uppercase tracking-widest font-mono">
                    Direct Trigger Interface
                  </div>
                  
                  {deferredPrompt ? (
                    <button
                      onClick={() => {
                        setShowPWAInstallGuide(false);
                        handleInstallAppClick();
                      }}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs tracking-wider rounded-xl cursor-pointer shadow-lg hover:scale-[1.01] active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4 animate-bounce" />
                      <span>डायरेक्ट इंस्टॉल बटन दबाएं! (Trigger Native Install Dialog)</span>
                    </button>
                  ) : (
                    <div className="bg-black/40 border border-white/5 p-3 rounded-xl text-center text-[10px] text-white/50 leading-relaxed font-sans">
                      (यदि ऊपर दिए डायरेक्ट बटन आपके ब्राउज़र/सिस्टम में काम नहीं कर रहे हैं, तो कृपया मैन्युअल दिशा-निर्देशों का पालन करें। Fiza AI के सारे सर्किट्स आपके स्मार्टफोन पर राज करने के लिए बेताब हैं! 😉)
                    </div>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div className="border-t border-white/10 bg-white/5 px-5 py-3.5 flex justify-end">
                <button
                  onClick={() => setShowPWAInstallGuide(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white/80 hover:text-white rounded-lg text-xs font-semibold hover:scale-105 transition-all cursor-pointer"
                >
                  समझ गया (Done)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
