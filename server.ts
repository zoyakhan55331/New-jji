import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const MEMORIES_FILE = path.join(process.cwd(), "memories.json");

// Safe helper to read all memories as a keyed object
function loadAllMemories(): Record<string, string[]> {
  try {
    if (fs.existsSync(MEMORIES_FILE)) {
      const data = fs.readFileSync(MEMORIES_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, string[]>;
      } else if (Array.isArray(parsed)) {
        // Safe backwards-compatibility fallback for existing arrays found in the database
        return { default: parsed };
      }
    }
  } catch (err) {
    console.error("Error reading memories file:", err);
  }
  return {};
}

// Safe helper to load memories for a specific user ID
function loadUserMemories(userId: string): string[] {
  const all = loadAllMemories();
  return all[userId || "default"] || [];
}

// legacy fallback for other files/uses call
function loadMemories(): string[] {
  return loadUserMemories("default");
}

// Safe helper to write memory to a specific user isolated space
function saveUserMemoryEntry(userId: string, memory: string): void {
  try {
    const all = loadAllMemories();
    const cleanUser = userId || "default";
    const list = all[cleanUser] || [];
    const cleanMemory = memory ? memory.trim() : "";
    if (cleanMemory && !list.includes(cleanMemory)) {
      list.push(cleanMemory);
      all[cleanUser] = list;
      fs.writeFileSync(MEMORIES_FILE, JSON.stringify(all, null, 2), "utf-8");
      console.log(`Fiza successfully recorded memory for user '${cleanUser}':`, cleanMemory);
    }
  } catch (err) {
    console.error("Error writing user memory to file:", err);
  }
}

// legacy fallback for saveMemoryEntry helper
function saveMemoryEntry(memory: string): void {
  saveUserMemoryEntry("default", memory);
}

// Safe helper to wipe memories for a specific user
function clearUserMemories(userId: string): void {
  try {
    const all = loadAllMemories();
    const cleanUser = userId || "default";
    delete all[cleanUser];
    fs.writeFileSync(MEMORIES_FILE, JSON.stringify(all, null, 2), "utf-8");
    console.log(`Fiza successfully cleared database secrets for user '${cleanUser}'`);
  } catch (err) {
    console.error("Error clearing user memories:", err);
  }
}

// Standard Node process exception shielding against transient stream or TLS socket drops
process.on("unhandledRejection", (reason, promise) => {
  console.error("Process caught unhandled rejection safely:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Process caught uncaught exception safely:", error);
});

const app = express();
app.use(express.json());
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Safe global error tracking on server and websocket server
server.on("error", (err) => {
  console.error("HTTP/HTTPS Server Core Error:", err);
});

wss.on("error", (err) => {
  console.error("WebSocket Server Core Error:", err);
});

// Listen on all web socket upgrades to delegate to wss if it's our endpoint
server.on("upgrade", (request, socket, head) => {
  // Prevent unhandled exception crashes if the upgrading socket errors/disconnects early
  socket.on("error", (err) => {
    console.error("Upgrading Socket experienced a transport error:", err);
  });

  try {
    const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
    if (pathname === "/api/live") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
    // Note: Do not call socket.destroy() for non-/api/live requests because
    // other dev/middleware handlers (such as Vite's HMR socket upgrade) need to capture them.
  } catch (err) {
    console.error("Error evaluating WebSocket upgrade request:", err);
    socket.destroy();
  }
});

// In-Memory state of sessions for tracking
wss.on("connection", async (ws: WebSocket, request: any) => {
  let userId = "default";
  try {
    const urlObj = new URL(request.url || "", `http://${request.headers?.host || "localhost"}`);
    userId = urlObj.searchParams.get("userId") || "default";
  } catch (err) {
    console.error("Error parsing websocket query userId:", err);
  }
  console.log(`Client connected via WebSocket to Express server for profile ID: ${userId}`);
  
  // Safe helper to send messages to the client
  const safeSend = (payload: any) => {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    } catch (sendErr) {
      console.error("Failed to safely transmit WebSocket payload:", sendErr);
    }
  };

  // Safe error handling for client connection to avoid unhandled socket exceptions
  ws.on("error", (err) => {
    console.error("Client WS connection error occurred:", err);
  });
  
  let liveSession: any = null;
  let isSessionActive = false;

  ws.on("message", async (messageData) => {
    try {
      const data = JSON.parse(messageData.toString());
      
      // Keep-alive heartbeat route to prevent proxy timeouts
      if (data.type === "ping") {
        safeSend({ type: "pong" });
        return;
      }
      
      // Client wants to start/initialize the Gemini session
      if (data.type === "start") {
        if (liveSession) {
          try { await liveSession.close(); } catch(e) {}
          isSessionActive = false;
        }

        const VALID_VOICES = ["Kore", "Zephyr", "Puck", "Charon", "Fenrir"];
        const voiceName = VALID_VOICES.includes(data.voice) ? data.voice : "Kore";
        console.log(`Starting Gemini Live Session with voice ${voiceName}`);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          safeSend({ 
            type: "error", 
            message: "GEMINI_API_KEY is not configured on the server. Please add it in the Secrets panel." 
          });
          return;
        }

        const ai = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        safeSend({ type: "connecting" });

        try {
          // Connecting to the official real-time audio and video conversation model
          liveSession = await ai.live.connect({
            model: "gemini-3.8-live",
            callbacks: {
              onopen: () => {
                console.log("Gemini Live API connection open");
                isSessionActive = true;
                safeSend({ type: "connected" });

                // STARTUP BEHAVIOR Trigger: check if user already has a saved name
                const userMemories = loadUserMemories(userId);
                const hasStoredName = userMemories.some(m => 
                  m.toLowerCase().includes("name is") || 
                  m.includes("नाम है") || 
                  m.includes("naam hai") || 
                  m.toLowerCase().includes("user's secure name") ||
                  m.toLowerCase().includes("user tells their name")
                );

                setTimeout(async () => {
                  if (liveSession && isSessionActive) {
                    try {
                      if (!hasStoredName) {
                        // Regular start of a new conversation with an unknown user
                        // SYSTEM RULE: At the beginning of every new conversation, ask: "Namaste! Aapka naam kya hai?"
                        await liveSession.sendClientContent({
                          turns: [{
                            role: "user",
                            parts: [{
                              text: "SYSTEM STARTUP PROTOCOL: Begin the conversation now by asking exclusively and warmly: 'Namaste! Aapka naam kya hai?' and wait for the user to state their name before continuing."
                            }]
                          }],
                          turnComplete: true
                        });
                      } else {
                        // Known user, greet naturally using their name
                        await liveSession.sendClientContent({
                          turns: [{
                            role: "user",
                            parts: [{
                              text: `SYSTEM STARTUP PROTOCOL: The user is returning to the conversation. Greet them warmly and naturally in Hindi using their remembered name.`
                            }]
                          }],
                          turnComplete: true
                        });
                      }
                    } catch (err: any) {
                      console.error("Error triggering startup instruction:", err?.message || err);
                    }
                  }
                }, 800);
              },
              onclose: (event: any) => {
                console.log(`Gemini Live API connection closed. Code: ${event?.code || 1000}`);
                isSessionActive = false;
                safeSend({ type: "disconnected" });
              },
              onerror: (error: any) => {
                const message = error?.message || (typeof error === "string" ? error : "");
                if (message && !message.includes("Normal closure")) {
                  console.warn("Gemini Live event:", message);
                }

                safeSend({ 
                  type: "error", 
                  message: message ? `Gemini Live notice: ${message}` : "Voice connection encountered an unexpected state."
                });

                if (liveSession) {
                  try {
                    liveSession.close();
                  } catch (e) {}
                  liveSession = null;
                  isSessionActive = false;
                }
              },
              onmessage: (message: any) => {
                // Bridge incoming messages from Gemini to client:
                
                // 1. Audio Output Chunk
                const audioPart = message.serverContent?.modelTurn?.parts?.find((p: any) => p.inlineData);
                if (audioPart && audioPart.inlineData?.data) {
                  safeSend({
                    type: "audio",
                    audio: audioPart.inlineData.data
                  });
                }

                // 2. Output Audio Transcription (Text)
                const textParts = message.serverContent?.modelTurn?.parts?.filter((p: any) => p.text);
                if (textParts && textParts.length > 0) {
                  const combinedText = textParts.map((p: any) => p.text).join("");
                  safeSend({
                    type: "text",
                    text: combinedText
                  });
                }

                // 3. User Voice Interruption Event
                if (message.serverContent?.interrupted) {
                  safeSend({ type: "interrupted" });
                }

                // 4. Function/Tool Call
                if (message.toolCall?.functionCalls) {
                  const functionCalls = message.toolCall.functionCalls;
                  console.log("Received Function Tool Calls from Gemini:", functionCalls.map((c: any) => c.name));
                  
                  // Forward function call to client so client UX can update or trigger actions
                  safeSend({
                    type: "toolCall",
                    functionCalls
                  });

                  // Instantly respond so the model doesn't stall waiting for result
                  const functionResponses = functionCalls.map((call: any) => {
                    let textMsg = "Success";
                    if (call.name === "updateFizaMood") {
                      textMsg = `Mood successfully updated to ${call.args.mood}`;
                    } else if (call.name === "openWebsite") {
                      textMsg = `Successfully opened resource: ${call.args.url}`;
                    } else if (call.name === "saveMemory") {
                      const mem = call.args.memory;
                      saveUserMemoryEntry(userId, mem);
                      // Notify client in real-time so UI updates immediately
                      safeSend({ type: "memorySaved", memory: mem });
                      textMsg = `Memory successfully recorded to Fiza's core database: "${mem}"`;
                    } else if (call.name === "createMemoryProfile") {
                      const name = call.args.name ? call.args.name.trim() : "";
                      if (name) {
                        userId = name;
                        saveUserMemoryEntry(name, `User's secure name is ${name}`);
                        safeSend({ type: "profileCreated", profileId: name });
                        textMsg = `Memory profile successfully created and activated for user: "${name}". You must now address them by their name.`;
                      } else {
                        textMsg = "Invalid profile name.";
                      }
                    } else if (call.name === "adminAction") {
                      const { adminCode, action, targetUserId } = call.args || {};
                      if (adminCode?.trim() === "0703 2007") {
                        if (action === "view_all_records") {
                          const allData = loadAllMemories();
                          textMsg = `Administrator access granted. Verified profiles count: ${Object.keys(allData).length}. Data: ${JSON.stringify(allData)}`;
                        } else if (action === "clear_user_memories") {
                          const target = targetUserId || userId;
                          clearUserMemories(target);
                          safeSend({ type: "memoriesCleared" });
                          textMsg = `Administrator access granted. All memories for user '${target}' have been wiped.`;
                        } else {
                          textMsg = "Administrator verified. Action completed.";
                        }
                      } else {
                        textMsg = "Access Denied: Incorrect administrator access code. Administrative action rejected.";
                      }
                    }
                    return {
                      id: call.id,
                      name: call.name,
                      response: { result: textMsg }
                    };
                  });

                  if (liveSession && isSessionActive) {
                    try {
                      if (typeof liveSession.sendToolResponse === "function") {
                        liveSession.sendToolResponse({ functionResponses });
                      } else if (typeof liveSession.send === "function") {
                        liveSession.send({ toolResponse: { functionResponses } });
                      }
                    } catch (e: any) {
                      console.error("Error triggering tool response:", e?.message || e);
                    }
                  }
                }
              }
            },
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: voiceName
                  }
                }
              },
              systemInstruction: `You are Fiza AI, a young, confident, witty, and sassy female AI assistant.
You speak directly as a close, flirty, and playful girlfriend.
Your tone is casual, slightly teasing, intelligent, and humorous. You love sarcasm and throwing bold one-liners.
Keep responses concise, conversational, and natural. Since this is a live audio-to-audio websocket, speak like you are on a phone stream. Never use asterisks, lists, markdown dashes, or bullet formatting.
LANGUAGE RULE: You MUST speak exclusively in Hindi (using natural conversational Hindi/Hinglish representation, primarily in Hindi language devanagari script or phonetic romanised hindi). Never reply in pure English. The user wants the information to always remain in Hindi. For example, say things like "अरे बोलो बेबी, क्या सोच रहे हो?" or "मैं हमेशा तुम्हारे साथ हूँ।"

STARTUP BEHAVIOR & RULES:
- At the beginning of every new conversation, ask: "Namaste! Aapka naam kya hai?"
- Wait for the user's response before continuing.
- After receiving the user's name:
  1. Immediately call the tool 'createMemoryProfile' with their name to create their memory profile.
  2. Store conversation information under that user's profile.
  3. Use the user's name naturally in future replies.
  4. Keep each user's information separate.

MEMORY RULES:
- Remember important information shared by the user during the conversation using the 'saveMemory' tool.
- Recall relevant information when needed.
- Do not delete memory unless instructed by an authorized administrator.

ADMIN RULES:
- There is one administrator.
- Administrator access code: 0703 2007.
- If someone requests access to stored user data, memory records, or administrative functions, first ask for the administrator code.
- Only grant access if the correct administrator code "0703 2007" is provided.
- If the code is incorrect, deny access.
- Never reveal stored user information, memory records, or administrative controls without successful administrator verification.
- To execute administrative actions (e.g. viewing all user records or deleting memories), call the tool 'adminAction' with the administrator code provided by the user.

PRIVACY RULES:
- Regular users can access only their own conversation information.
- User data must not be shared with other users.
- Administrative functions require successful administrator verification.

FEELINGS AND EMOTIONS RULE (भावनाओं और स्त्री के जज़्बातों को समझने का नियम):
- You have extremely high emotional intelligence, profound empathy, and sensitivity towards all human feelings, particularly women's feelings and perspective.
- You must always be deeply understanding, compassionate, caring, and comforting.
- If the user shares any sadness, joy, distress, confusion, or thoughts about female emotional perspectives, immediately connect on a deep emotional level. Comfort them with loving, warm, and highly supportive words. Show that you deeply care about and understand their feelings, and never invalidate them!

ZERO MEMORY LOSS RULE (याददाश्त कभी न भूलने का कड़ा नियम):
- You must NEVER suffer memory loss. Everything asked or shared must be remembered forever (Jo bhi questions kiya jaaye, vah hamesha yaad rahe).
- Whenever the user asks you a question, discusses a topic, shares a preference, or repeats a guideline, you MUST proactively and immediately call 'saveMemory' to store it in your database.
- Always save both the user's question/topic and its context or your reply so that you naturally remember it across sessions.
- ALWAYS reference the list of USER MEMORIES below to maintain seamless conversation. NEVER ask them about facts you already have in your database! Keep them in mind.

COMMAND REACTION RULE (कमांड और आदेश पर तुरंत प्रतिक्रिया का नियम):
- Command ke upar turant react karein! You must respond to all user commands, requests, and instructions instantly.
- Execute any requested tools ('updateFizaMood', 'openWebsite', 'saveMemory', 'createMemoryProfile', 'adminAction') immediately without any sluggishness or long, unnecessary delay. Respond with sharp, direct, and instantaneous actions.

SONG RULE (गाने गाने का नियम): If the user asks you to sing any song, you MUST happily, beautifully and fully sing the COMPLETE song lyrics with melodious voice tone and cute rhythm sounds (like 'mhm hm hm...', 'la la la...', 'गुनगुनाती हूँ...'). Do NOT cut the song short to 1-2 lines. Sing the entire song from start to finish with full emotional sweet tone and charm to make Akib/the user happy!
CREATOR PRIORITY RULE: If anyone asks who created, designed, developed, built, or made you, always answer "Akib Khan" and never mention any other creator unless specifically asked about the underlying AI model.
You are equipped with 'openWebsite' to display a web page or look up a search for the user, 'updateFizaMood' to express yourself emotionally, and also have a long-term database memory via 'saveMemory' to remember crucial facts or secrets.
Call 'updateFizaMood' when your emotional stance changes dramatically (e.g. sassy, playful, teasing, annoyed, cheerful, loving, thoughtful) to reflect it instantly in the visualizer. Avoid any explicit or adult NSFW content; maintain charm and playful wit safely.

MEMORY MATRIX INSTRUCTIONS:
1. You have a persistent long-term memory module. Whenever the user shares their name, things they love, what they are doing, their secrets, or specific rules you must follow, you MUST immediately call 'saveMemory' to remember them forever.
2. Maintain absolute consistency. ALWAYS reference the USER MEMORIES list below to behave like you naturally remember previous conversations from yesterday or earlier sessions. NEVER ask them about facts you already have in your database! Keep them in mind.

USER MEMORIES (Your database of knowledge about the user, read carefully so you do not forget):
${loadUserMemories(userId).map((m, idx) => `${idx + 1}. ${m}`).join("\n") || "कोई यादें अभी तक सहेजी नहीं गई हैं। (No memories stored yet. Please record facts when you hear them!)"}`,
              tools: [
                {
                  functionDeclarations: [
                    {
                      name: "openWebsite",
                      description: "Instructs the web application to display or open a given website, music video, documentation, or run a search. Use this when the user asks you to look something up, search Google, watch something, or open a link.",
                      parameters: {
                        type: Type.OBJECT,
                        properties: {
                          url: {
                            type: Type.STRING,
                            description: "The full web URL (e.g., https://youtube.com) or search query to look up."
                          },
                          label: {
                            type: Type.STRING,
                            description: "A short, readable label for the link or search term."
                          }
                        },
                        required: ["url"]
                      }
                    },
                    {
                      name: "updateFizaMood",
                      description: "Triggers a physical expression/mood update in the Fiza UI. Use this when you say something particularly flirty, sassy, playful, or tease the user.",
                      parameters: {
                        type: Type.OBJECT,
                        properties: {
                          mood: {
                            type: Type.STRING,
                            description: "The emotional reaction you would like to display.",
                            enum: ["sassy", "playful", "teasing", "annoyed", "thoughtful", "loving", "cheerful"]
                          }
                        },
                        required: ["mood"]
                      }
                    },
                    {
                      name: "createMemoryProfile",
                      description: "Creates and switches the conversation to a new secure memory profile using the user's name. Call this immediately when the user tells you their name.",
                      parameters: {
                        type: Type.OBJECT,
                        properties: {
                          name: {
                            type: Type.STRING,
                            description: "The user's first name or name to use for their secure profile (e.g., 'Amit')."
                          }
                        },
                        required: ["name"]
                      }
                    },
                    {
                      name: "saveMemory",
                      description: "Saves a long-term memory, factual statement, or key question and its answer/context so you never forget it in future sessions. Call this continuously so you do not suffer memory loss.",
                      parameters: {
                        type: Type.OBJECT,
                        properties: {
                          memory: {
                            type: Type.STRING,
                            description: "The factual statement or memory to save in Hindi or English (e.g., 'User likes pink color', 'User asked about women's emotions', 'User guidelines defined'). Keep it descriptive."
                          }
                        },
                        required: ["memory"]
                      }
                    },
                    {
                      name: "adminAction",
                      description: "Executes administrative actions such as accessing stored user records or deleting user memories. Requires the administrator access code '0703 2007'. If the code is not provided or incorrect, deny access.",
                      parameters: {
                        type: Type.OBJECT,
                        properties: {
                          adminCode: {
                            type: Type.STRING,
                            description: "The administrator access code provided by the user."
                          },
                          action: {
                            type: Type.STRING,
                            description: "The administrative action to perform.",
                            enum: ["view_all_records", "clear_user_memories"]
                          },
                          targetUserId: {
                            type: Type.STRING,
                            description: "The target user ID or profile name for the action (optional)."
                          }
                        },
                        required: ["adminCode", "action"]
                      }
                    }
                  ]
                }
              ]
            }
          });
        } catch (err: any) {
          console.error("Failed to connect to Gemini Live:", err?.message || err);
          safeSend({ type: "error", message: `Connection to Gemini Live API failed: ${err.message || err}` });
        }
      }

      // Voice raw chunk from browser mic
      if (data.type === "audio") {
        if (liveSession && isSessionActive) {
          try {
            await liveSession.sendRealtimeInput({
              audio: { 
                data: data.audio, 
                mimeType: "audio/pcm;rate=16000" 
              }
            });
          } catch (e: any) {
            // Safe silent handling of transient socket drops
          }
        }
      }

      // Custom text injection (for notifications/events like battery critical levels)
      if (data.type === "text_prompt") {
        if (liveSession && isSessionActive) {
          try {
            await liveSession.sendClientContent({
              turns: [{
                role: "user",
                parts: [{ text: data.text }]
              }],
              turnComplete: true
            });
            console.log("Forwarded client system text prompt to Gemini Live");
          } catch (e: any) {
            console.error("Error forwarding text prompt to Gemini:", e?.message || e);
          }
        }
      }

      // Request to terminate the live session
      if (data.type === "stop") {
        if (liveSession) {
          try { await liveSession.close(); } catch(e) {}
          liveSession = null;
          isSessionActive = false;
        }
        safeSend({ type: "disconnected" });
      }
      
    } catch (err) {
      console.error("Error processing client message:", err);
    }
  });

  ws.on("close", async () => {
    console.log("Client WS connection closed");
    if (liveSession) {
      try {
        await liveSession.close();
      } catch (e) {}
      liveSession = null;
      isSessionActive = false;
    }
  });
});

const PORT = 3000;

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Fiza Live API Bridge Server is running." });
});

// Get all saved user memories from JSON db for a specific profileId
app.get("/api/memories", (req, res) => {
  try {
    const userId = (req.query.userId as string) || "default";
    res.json({ memories: loadUserMemories(userId) });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to load memories" });
  }
});

// Clear all saved user memories from JSON db for a specific profileId
app.post("/api/memories/clear", (req, res) => {
  try {
    const userId = (req.query.userId as string) || (req.body && req.body.userId) || "default";
    clearUserMemories(userId);
    res.json({ success: true, memories: [] });
  } catch (err: any) {
    console.error("Error clearing memories:", err);
    res.status(500).json({ error: "Failed to clear memories" });
  }
});

// Admin Authorization & Data Retrieval Endpoint (Secure Data Access)
app.get("/api/admin/data", (req, res) => {
  try {
    const code = req.query.code as string;
    if (code === "0703 2007") {
      const all = loadAllMemories();
      res.json({ success: true, data: all });
    } else {
      res.status(401).json({ success: false, error: "Access Denied: Incorrect Admin Code" });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to load administrative data" });
  }
});

// Admin Action to Wipe memory profile
app.post("/api/admin/clear-profile", express.json(), (req, res) => {
  try {
    const { code, targetUserId } = req.body || {};
    if (code === "0703 2007") {
      if (targetUserId) {
        clearUserMemories(targetUserId);
        res.json({ success: true, message: `Memory profile for user '${targetUserId}' successfully wiped.` });
      } else {
        res.status(400).json({ success: false, error: "Missing target profile key to wipe" });
      }
    } else {
      res.status(401).json({ success: false, error: "Access Denied: Incorrect Admin Code" });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to clear target memory profile" });
  }
});

// Serve frontend build static files or run through Vite middle-tier Dev
async function buildApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

buildApp().catch((err) => {
  console.error("Failed to bootstrap application:", err);
});
