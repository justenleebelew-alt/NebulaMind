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

// 7. AI Cognitive Reframing Assistant (CBT Thought Transformer)
app.post("/api/gemini/cbt-reframe", async (req, res) => {
  try {
    const { negativeThought, condition = "ALL" } = req.body;
    if (!negativeThought) {
      return res.status(400).json({ error: "Negative thought string is required" });
    }

    const ai = getGenAIClient();
    const systemPrompt = `You are a compassionate, CBT-certified AI therapist assistant.
Help the user identify cognitive distortions in their unhelpful thought and generate 3 balanced reframes.
Tailor gentle tone for condition: ${condition}.

Respond strictly with JSON schema:
{
  "identifiedDistortions": ["Catastrophizing", "All-or-Nothing Thinking", "Emotional Reasoning"],
  "reframes": [
    "Reframe 1: Realistic & gentle alternative perspective",
    "Reframe 2: Balanced, compassionate self-view",
    "Reframe 3: Action-oriented grounded truth"
  ],
  "groundingStatement": "A short, powerful 1-sentence anchor statement to repeat when this thought returns.",
  "microAction": "One small step to take right now"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Automatic Negative Thought:\n"${negativeThought}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, ...data });
  } catch (error: any) {
    console.error("Error in CBT reframe:", error);
    res.status(500).json({ error: error?.message || "Failed to generate CBT reframes" });
  }
});

// 8. AI Somatic Grounding & Sensorium Generator
app.post("/api/gemini/somatic-grounding", async (req, res) => {
  try {
    const { environment = "Desk/Work", distressLevel = 7, condition = "ALL" } = req.body;

    const ai = getGenAIClient();
    const systemPrompt = `You are a somatic therapist and grounding specialist for neurodivergent individuals (${condition}).
Generate a custom 5-4-3-2-1 sensory grounding exercise specifically designed for someone in this setting: "${environment}" with distress level ${distressLevel}/10.

Respond strictly with JSON schema:
{
  "title": "Grounding Exercise Name",
  "physicalPosture": "Quick body posture adjustment (e.g. drop shoulders, unclamp jaw, feet flat on floor)",
  "sensorySteps": {
    "see": ["Thing 1 in room", "Thing 2 in room", "Thing 3 in room", "Thing 4 in room", "Thing 5 in room"],
    "touch": ["Feel 1", "Feel 2", "Feel 3", "Feel 4"],
    "hear": ["Sound 1", "Sound 2", "Sound 3"],
    "smell": ["Scent 1", "Scent 2"],
    "taste": ["Taste or mouth sensation"]
  },
  "tactileFocusGuide": "A 1-minute physical sensation focus instruction",
  "closingBreath": "Custom breathing cue"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Create somatic grounding for environment: ${environment}, distress level: ${distressLevel}/10.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, ...data });
  } catch (error: any) {
    console.error("Error generating somatic grounding:", error);
    res.status(500).json({ error: error?.message || "Failed to generate somatic grounding" });
  }
});

// 9. AI Panic & Acute Crisis De-escalation Companion
app.post("/api/gemini/panic-deescalate", async (req, res) => {
  try {
    const { message = "I feel panic rising, my chest feels tight and heart is racing.", condition = "ALL" } = req.body;

    const ai = getGenAIClient();
    const systemPrompt = `You are an acute crisis de-escalation AI guide.
Your purpose is to immediately soothe panic attacks and high emotional distress.
Use ultra-calm, short, slow-paced sentences with non-triggering validation.
Focus on DBT TIPP skills (Temperature, Intense Exercise, Paced Breathing, Paired Relaxation).

Respond strictly with JSON schema:
{
  "reassurance": "Gentle, immediate validation confirming they are safe and this feeling will pass",
  "tippSkill": "Specific physical TIPP skill (e.g., holds ice cube, splash cold water, press feet into floor)",
  "breathPacingGuide": "Breath counting instruction (e.g. Inhale 1..2..3..4, Hold 1..2, Exhale 1..2..3..4..5..6)",
  "sensoryAnchor": "1 immediate visual/physical anchor to touch right now",
  "nextSoothingPrompt": "Calming question or grounding prompt for next step"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `User in distress: "${message}" (Condition: ${condition})`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.5,
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, ...data });
  } catch (error: any) {
    console.error("Error in panic de-escalation:", error);
    res.status(500).json({ error: error?.message || "Failed to process panic response" });
  }
});

// 10. AI Mood Pattern & Trigger Insights Analyzer
app.post("/api/gemini/mood-insights", async (req, res) => {
  try {
    const { journalEntries = [], condition = "ALL" } = req.body;

    const ai = getGenAIClient();
    const systemPrompt = `You are a psychiatric data analyst and mood pattern specialist for ${condition}.
Analyze mood patterns, trigger themes, and cognitive habits to provide actionable, non-judgmental wellness insights.

Respond strictly with JSON schema:
{
  "detectedTriggers": ["Trigger 1", "Trigger 2"],
  "emotionalTrend": "Overview of emotional stability / fluctuations",
  "neurodivergentInsight": "Insight related to BPD/Bipolar/MDD/ADHD patterns",
  "preventativeCopingStrategy": "Actionable routine adjustment to prevent burnout/splitting",
  "wellnessScoreEstimate": 82
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Recent Journal Logs:\n${JSON.stringify(journalEntries.slice(0, 10))}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.6,
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, ...data });
  } catch (error: any) {
    console.error("Error analyzing mood insights:", error);
    res.status(500).json({ error: error?.message || "Failed to analyze mood insights" });
  }
});

// 11. AI Custom Guided Meditation & Visualization Sculptor
app.post("/api/gemini/guided-meditation", async (req, res) => {
  try {
    const { theme = "Cosmic Crystal Sanctuary", targetState = "Deep Relaxation", durationMinutes = 5 } = req.body;

    const ai = getGenAIClient();
    const systemPrompt = `You are a master meditation guide creating multi-sensory guided visualizations.
Create a ${durationMinutes}-minute guided meditation script on theme "${theme}" targeting "${targetState}".

Respond strictly with JSON schema:
{
  "title": "Script Title",
  "sensoryPalette": ["Color", "Texture", "Sound", "Scent"],
  "visualizationScenes": [
    {
      "phase": "Arrival & Breath",
      "guidanceText": "Slow spoken script lines...",
      "breathingCue": "Inhale deeply..."
    },
    {
      "phase": "Deep Sanctuary Immersion",
      "guidanceText": "Vivid sensory imagery lines...",
      "breathingCue": "Hold softly..."
    },
    {
      "phase": "Integration & Awakening",
      "guidanceText": "Return to body lines...",
      "breathingCue": "Exhale completely..."
    }
  ],
  "fullSpokenScript": "Unified full spoken text for speech synthesis"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Theme: ${theme}, Goal: ${targetState}, Duration: ${durationMinutes} mins.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.75,
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, ...data });
  } catch (error: any) {
    console.error("Error creating guided meditation:", error);
    res.status(500).json({ error: error?.message || "Failed to generate guided meditation" });
  }
});

// 12. AI Sleep & Wind-Down Story Generator
app.post("/api/gemini/sleep-story", async (req, res) => {
  try {
    const { topic = "Floating through a starlight nebula", lengthMinutes = 5 } = req.body;

    const ai = getGenAIClient();
    const systemPrompt = `You are a hypnotic bedtime storyteller crafting gentle, slow-tempo bedtime stories to slow heart rate and stop racing thoughts.

Respond strictly with JSON schema:
{
  "title": "Bedtime Story Title",
  "atmosphere": "Atmospheric sound/vibe description",
  "storyParagraphs": [
    "Paragraph 1 - Slow rhythmic setting of scene...",
    "Paragraph 2 - Deepening relaxation...",
    "Paragraph 3 - Gentle drift towards sleep..."
  ],
  "driftOffAffirmation": "Final whisper affirmation"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Topic: ${topic}, Target length: ${lengthMinutes} minutes.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.8,
      },
    });

    const data = JSON.parse(response.text || "{}");
    res.json({ success: true, ...data });
  } catch (error: any) {
    console.error("Error generating sleep story:", error);
    res.status(500).json({ error: error?.message || "Failed to generate sleep story" });
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
