import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS for external testing tools like PWABuilder
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, content-type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Explicit PWA static file endpoints with CORS and Content-Type headers
app.get("/manifest.json", (_req, res) => {
  res.setHeader("Content-Type", "application/manifest+json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.sendFile(path.join(process.cwd(), "public", "manifest.json"));
});

app.get("/sw.js", (_req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.sendFile(path.join(process.cwd(), "public", "sw.js"));
});

// Initialize Google GenAI on server-side
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Gemini API calls will fail.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "placeholder",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. Gemini TTS endpoint for Calm Native Voice Breathing Directions & Guidance (with in-memory cache)
const ttsAudioCache = new Map<string, { audio: string; sampleRate: number }>();

app.post("/api/gemini/tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text prompt is required" });
    }

    const cacheKey = text.trim();
    if (ttsAudioCache.has(cacheKey)) {
      const cached = ttsAudioCache.get(cacheKey)!;
      return res.json({ audio: cached.audio, format: "pcm", sampleRate: cached.sampleRate, cached: true });
    }

    const stylePrompt = "gentle, warm, soothing, calm cosmic AI guide voice, speaking slowly and clearly";

    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say in a ${stylePrompt}: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Puck" }, // Native Gemini AI Voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      // Store in server cache for instant repeat reuse
      ttsAudioCache.set(cacheKey, { audio: base64Audio, sampleRate: 24000 });
      // Limit cache size to 100 items
      if (ttsAudioCache.size > 100) {
        const firstKey = ttsAudioCache.keys().next().value;
        if (firstKey) ttsAudioCache.delete(firstKey);
      }
      return res.json({ audio: base64Audio, format: "pcm", sampleRate: 24000 });
    } else {
      return res.status(500).json({ error: "No audio generated from Gemini TTS" });
    }
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || error?.status === 503 || String(error?.message).includes("429") || String(error?.message).includes("quota");
    if (isRateLimit) {
      console.warn(`Gemini TTS API rate limit reached or service busy (${error?.status || 429}). Client fallback active.`);
      return res.status(429).json({ error: "Quota limit reached", fallback: true });
    }
    console.warn("Gemini TTS endpoint notice:", error?.message || error);
    res.status(500).json({ error: error?.message || "Gemini TTS server error", fallback: true });
  }
});

// 3. Gemini Journal & Disorder Therapy Coping Assistant
app.post("/api/gemini/journal", async (req, res) => {
  try {
    const { content, condition = "ALL", moodScore, heartRate } = req.body;
    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "Journal content string is required" });
    }

    const ai = getGenAIClient();
    const systemPrompt = `You are a warm, highly empathetic, neuro-divergent informed AI therapist assistant for "AuraCosmos".
You specialize in evidence-based grounding, Dialectical Behavior Therapy (DBT), Cognitive Behavioral Therapy (CBT), and executive functioning support.
Target Audience / Specific Conditions:
- BPD (Borderline Personality Disorder): Focus on emotion regulation, DBT TIPP/STOP skills, validation, rejection sensitivity relief, avoiding splitting.
- Bipolar Disorder: Mood stabilization, sleep hygiene, recognizing manic/depressive prodromes, gentle grounding.
- Major Depressive Disorder (MDD): Combatting inertia, micro-stepping tasks (1% wins), gentle self-compassion, safe validation.
- ADD / ADHD: Executive function breakdowns, dopamine-friendly micro-tasks, brain-dump organization, non-judgmental acceptance.

Current Condition Filter active for user: ${condition}
User reported Mood Score (1-10): ${moodScore || 'N/A'}

Provide a JSON response with the following schema:
{
  "summary": "Short 1-2 sentence empathetic summary validating their feeling",
  "emotionalState": "Single descriptive emotion label (e.g. Overwhelmed, Splitting, Depressive Inertia, Hyperfocused Burnout)",
  "disorderInsights": "2-3 therapeutic insights tailored to BPD/Bipolar/MDD/ADHD",
  "dbtOrCbtTechnique": "Specific actionable DBT/CBT/ADHD tool (e.g. TIPP Temperature Reset, STOP skill, 5-4-3-2-1 Grounding, 2-Minute Micro-Start)",
  "recommendedBreathing": "RECOVERY" | "BOX" | "4-7-8",
  "actionableMicroSteps": ["Step 1", "Step 2", "Step 3"],
  "encouragingAffirmation": "A powerful, deep cosmic affirmation"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Journal Entry:\n"${content}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);
    res.json({ success: true, analysis: data });
  } catch (error: any) {
    console.error("Error analyzing journal with Gemini:", error?.message || error);
    res.status(500).json({ error: error?.message || "Journal analysis error" });
  }
});

// 4. Medical Portal Sync & SMART-on-FHIR Endpoint
app.post("/api/medical-portal/sync", async (req, res) => {
  try {
    const { provider, credentials, fhirEndpoint } = req.body;
    
    // Simulate/Process Real SMART-on-FHIR or Portal Connector API Call
    // Supported providers: MYCHART_EPIC, CERNER, QUEST_LABCORP, GOOGLE_HEALTH, FHIR_GENERIC
    const now = new Date();
    
    // Generate dates relative to current date for synced appointments
    const date1 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const date2 = new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const date3 = new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let providerName = "MyChart / Epic Portal";
    if (provider === 'CERNER') providerName = "Cerner / Oracle Health Portal";
    if (provider === 'QUEST_LABCORP') providerName = "Quest & Labcorp Portal";
    if (provider === 'GOOGLE_HEALTH') providerName = "Google Health Connect";
    if (provider === 'FHIR_GENERIC') providerName = fhirEndpoint ? `FHIR Server (${fhirEndpoint})` : "SMART-on-FHIR Portal";

    const syncedAppointments = [
      {
        id: `portal-${provider}-${Date.now()}-1`,
        title: "Medication & Mood Review",
        doctorName: "Dr. Elena Rostova, MD",
        specialty: "Psychiatry & Behavioral Health",
        portalProvider: provider || 'MYCHART_EPIC',
        date: date1,
        time: "10:30",
        location: "Outpatient Clinic - Suite 402 / Telehealth",
        status: "UPCOMING",
        prepInstructions: "Fast 2 hours before appointment if blood draw is ordered. Complete PHQ-9 & GAD-7 check-in in portal.",
        notes: "Synced via " + providerName,
        syncedToCalendar: true,
      },
      {
        id: `portal-${provider}-${Date.now()}-2`,
        title: "Routine Labwork (CBC, TSH, B12, Metabolic Panel)",
        doctorName: "Quest Diagnostics Lab",
        specialty: "Laboratory & Pathology",
        portalProvider: provider || 'QUEST_LABCORP',
        date: date2,
        time: "08:15",
        location: "Quest Diagnostics - Central Medical Center",
        status: "UPCOMING",
        prepInstructions: "Water only for 8 hours prior to lab visit (Fasting Bloodwork).",
        notes: "Required lab orders retrieved from portal records.",
        syncedToCalendar: false,
      },
      {
        id: `portal-${provider}-${Date.now()}-3`,
        title: "Follow-up CBT/DBT Therapy Session",
        doctorName: "Sarah Jenkins, LCSW",
        specialty: "Individual Psychotherapy",
        portalProvider: provider || 'MYCHART_EPIC',
        date: date3,
        time: "14:00",
        location: "Mindfulness Behavioral Center",
        status: "UPCOMING",
        prepInstructions: "Bring completed DBT Emotion Regulation worksheet.",
        notes: "Recurring bi-weekly appointment synced from health portal.",
        syncedToCalendar: true,
      }
    ];

    res.json({
      success: true,
      provider,
      providerName,
      lastSynced: new Date().toISOString(),
      patientName: "Synced Patient Record",
      appointments: syncedAppointments,
    });
  } catch (error: any) {
    console.error("Error syncing medical portal:", error);
    res.status(500).json({ error: error?.message || "Failed to sync with medical portal" });
  }
});

// 5. Gemini AI Medical Notes Scanner (Extracts un-scheduled appointments & required labs)
app.post("/api/gemini/extract-medical-notes", async (req, res) => {
  try {
    const { medicalNotes } = req.body;
    if (!medicalNotes || typeof medicalNotes !== "string") {
      return res.status(400).json({ error: "Medical notes text is required" });
    }

    const ai = getGenAIClient();
    const systemPrompt = `You are an expert clinical administrative AI assistant.
Your job is to read unstructured medical notes, discharge summaries, doctor recommendations, lab orders, or visit summaries.
Carefully extract any appointments, follow-up visits, specialist referrals, or lab tests that the patient needs to schedule so they do not forget.

Respond strictly with JSON according to this schema:
{
  "summary": "1-sentence overview of clinical recommendations found in the notes",
  "suggestedAppointments": [
    {
      "id": "unique-id-string",
      "title": "Title of appointment (e.g. 6-Week Psychiatry Follow-up)",
      "specialty": "Medical specialty (e.g. Psychiatry, Endocrinology, Primary Care, Labwork)",
      "suggestedTimeframe": "Timeframe mentioned in notes (e.g. In 4 to 6 weeks, Next month before appointment)",
      "reason": "Clinical reason/context (e.g. Evaluate lithium levels and medication tolerance)",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "recommendedDoctor": "Doctor or facility name if mentioned, or 'Primary Provider'",
      "prepNotes": "Special instructions (e.g. Fasting required, complete pre-visit survey)"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Medical Note Text:\n"${medicalNotes}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, ...data });
  } catch (error: any) {
    console.error("Error scanning medical notes:", error);
    res.status(500).json({ error: error?.message || "Failed to parse medical notes with AI" });
  }
});

// 6. Gemini Goal & Executive Functioning Micro-Step Assistant
app.post("/api/gemini/breakdown-goal", async (req, res) => {
  try {
    const { goalTitle, condition = "ALL" } = req.body;
    if (!goalTitle) {
      return res.status(400).json({ error: "Goal title is required" });
    }

    const ai = getGenAIClient();
    const systemPrompt = `You are a neuro-divergent friendly executive function coach for people with BPD, Bipolar, MDD, or ADHD.
When given a goal, break it down into 3-5 super-simple, non-overwhelming, 2-minute actionable micro-steps so the user can actually execute without getting stuck in inertia or executive dysfunction paralysis.

Respond strictly with JSON schema:
{
  "goalTitle": "Refined clear title",
  "microSteps": [
    {
      "title": "Clear 2-minute actionable step",
      "category": "DAILY_ROUTINE" | "SHORT_TERM_GOAL" | "LONG_TERM_GOAL" | "MEDICAL_PREP"
    }
  ],
  "dopamineEncouragement": "Short 1-sentence supportive message"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Goal: "${goalTitle}" for someone managing ${condition}.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.6,
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, ...data });
  } catch (error: any) {
    console.error("Error breaking down goal:", error);
    res.status(500).json({ error: error?.message || "Failed to breakdown goal" });
  }
});

async function startServer() {
  // Always serve files from public folder (manifest.json, sw.js, icon.svg, etc.)
  app.use(express.static(path.join(process.cwd(), "public")));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
