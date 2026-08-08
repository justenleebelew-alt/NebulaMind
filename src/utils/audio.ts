/**
 * Audio synthesis utility for Nebula Mind
 * Handles cosmic ambient drone, male voice speech guidance (Gemini API TTS + Web Speech API fallback),
 * and subtle phase completion chimes.
 */

let audioCtx: AudioContext | null = null;
let droneOsc1: OscillatorNode | null = null;
let droneOsc2: OscillatorNode | null = null;
let droneGain: GainNode | null = null;
let isDronePlaying = false;
let currentAudioSource: AudioBufferSourceNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
}

// Pre-populate browser speech synthesis voices as soon as available
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export function stopCurrentSpeech(): void {
  // 1. Cancel browser Web Speech API synthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  // 2. Stop any active Gemini PCM audio source buffer
  if (currentAudioSource) {
    try {
      currentAudioSource.stop();
      currentAudioSource.disconnect();
    } catch (e) {
      // Audio source may already have finished
    }
    currentAudioSource = null;
  }
}

export type AmbientSoundType = 'rain' | 'whitenoise' | 'drone' | 'off';

let activeAmbientType: AmbientSoundType = 'off';
let ambientGainNode: GainNode | null = null;
let ambientNodes: (AudioNode | OscillatorNode | AudioBufferSourceNode)[] = [];

let currentGuidanceVoiceVolume = 1.0;
let currentAmbientVolume = 0.15;

export function setGuidanceVoiceVolume(vol: number): void {
  currentGuidanceVoiceVolume = Math.max(0, Math.min(1, vol));
}

export function getGuidanceVoiceVolume(): number {
  return currentGuidanceVoiceVolume;
}

export function setAmbientVolume(vol: number): void {
  currentAmbientVolume = Math.max(0, Math.min(1, vol));
  if (ambientGainNode && audioCtx) {
    try {
      ambientGainNode.gain.setValueAtTime(currentAmbientVolume, audioCtx.currentTime);
    } catch (e) {
      // ignore
    }
  }
}

export function getAmbientVolume(): number {
  return currentAmbientVolume;
}

export function stopAmbientSound(): void {
  if (!ambientGainNode || !audioCtx) {
    activeAmbientType = 'off';
    isDronePlaying = false;
    return;
  }
  try {
    ambientGainNode.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
    const nodesToCleanup = [...ambientNodes];
    const gainToCleanup = ambientGainNode;
    setTimeout(() => {
      nodesToCleanup.forEach(node => {
        try {
          if ('stop' in node && typeof (node as any).stop === 'function') {
            (node as any).stop();
          }
          node.disconnect();
        } catch (e) {
          // ignore
        }
      });
      try {
        gainToCleanup.disconnect();
      } catch (e) {}
    }, 1250);
  } catch (e) {
    console.warn('Error stopping ambient sound:', e);
  }
  ambientNodes = [];
  ambientGainNode = null;
  activeAmbientType = 'off';
  isDronePlaying = false;
}

export function startAmbientSound(type: AmbientSoundType, volume = currentAmbientVolume): void {
  if (type === 'off') {
    stopAmbientSound();
    return;
  }

  currentAmbientVolume = volume;

  // If already playing this exact sound, return
  if (activeAmbientType === type && ambientGainNode) return;

  // Stop previous ambient sound first
  stopAmbientSound();

  try {
    const ctx = getAudioContext();
    ambientGainNode = ctx.createGain();
    ambientGainNode.gain.setValueAtTime(0, ctx.currentTime);
    ambientGainNode.gain.linearRampToValueAtTime(currentAmbientVolume, ctx.currentTime + 2);
    ambientGainNode.connect(ctx.destination);
    activeAmbientType = type;

    if (type === 'drone') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, ctx.currentTime);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110.5, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(ambientGainNode);

      osc1.start();
      osc2.start();
      ambientNodes = [osc1, osc2, filter];
      isDronePlaying = true;
    } else if (type === 'rain') {
      // 3-second stereo pink/brown noise rain buffer
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
          b6 = white * 0.115926;
        }
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Filter to simulate soft rainfall
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(1100, ctx.currentTime);

      // Low frequency oscillator (LFO) for gentle rain intensity swell
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
      lfoGain.gain.setValueAtTime(250, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(lowpass.frequency);

      noiseSource.connect(lowpass);
      lowpass.connect(ambientGainNode);

      noiseSource.start();
      lfo.start();
      ambientNodes = [noiseSource, lowpass, lfo, lfoGain];
    } else if (type === 'whitenoise') {
      // 2-second looped white noise buffer with soothing lowpass filter
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.12;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(850, ctx.currentTime);

      noiseSource.connect(lowpass);
      lowpass.connect(ambientGainNode);

      noiseSource.start();
      ambientNodes = [noiseSource, lowpass];
    }
  } catch (err) {
    console.warn('Could not start ambient sound:', err);
  }
}

export function startCosmicAmbientDrone(volume = 0.15) {
  startAmbientSound('drone', volume);
}

export function stopCosmicAmbientDrone() {
  stopAmbientSound();
}

export function playPhaseChime(frequency = 432) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.8);
  } catch (err) {
    // Ignore audio error if user hasn't interacted yet
  }
}

export type VoiceGender = 'male' | 'female' | 'nonbinary';

// Strictly locate a female Web Speech synthesis voice
function getStrictFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  let voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const femaleIdentifiers = [
    'samantha', 'victoria', 'karen', 'zira', 'hazel', 'fiona', 'veena',
    'moira', 'tessa', 'siri', 'susan', 'ava', 'allison', 'female',
    'google us english', 'google uk english female', 'siobhan', 'catherine'
  ];

  return voices.find(v => {
    const nameLower = v.name.toLowerCase();
    return v.lang.startsWith('en') && femaleIdentifiers.some(f => nameLower.includes(f));
  }) || voices.find(v => v.lang.startsWith('en')) || null;
}

// Strictly locate a male Web Speech synthesis voice, rejecting female voices
function getStrictMaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  let voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const maleIdentifiers = [
    'david', 'daniel', 'mark', 'george', 'james', 'alex', 'fred',
    'oliver', 'arthur', 'rishi', 'richard', 'aaron', 'guy', 'male',
    'uk english male', 'us english male', 'australia male', 'tom'
  ];

  const femaleIdentifiers = [
    'samantha', 'victoria', 'karen', 'zira', 'hazel', 'fiona', 'veena',
    'moira', 'tessa', 'siri', 'susan', 'ava', 'allison', 'female',
    'google us english', 'google uk english female', 'siobhan', 'catherine',
    'helena', 'monica', 'laura', 'sara', 'anna'
  ];

  // 1. Search for explicit male voice matching male names and NOT female names
  const maleVoice = voices.find(v => {
    const nameLower = v.name.toLowerCase();
    const isFemale = femaleIdentifiers.some(f => nameLower.includes(f));
    const isMale = maleIdentifiers.some(m => nameLower.includes(m));
    return v.lang.startsWith('en') && isMale && !isFemale;
  });

  if (maleVoice) return maleVoice;

  // 2. Search for any English voice that strictly does not match female keywords
  const nonFemaleVoice = voices.find(v => {
    const nameLower = v.name.toLowerCase();
    return v.lang.startsWith('en') && !femaleIdentifiers.some(f => nameLower.includes(f));
  });

  return nonFemaleVoice || null;
}

// Client-side cache for Gemini TTS audio clips to prevent quota exhaustion
const clientAudioCache = new Map<string, { audio: string; sampleRate: number }>();
let ttsRateLimitedUntil = 0;

// Speak instruction with native Gemini AI voice
export async function speakAIVoice(
  text: string
): Promise<void> {
  if (!text) return;

  // Stop any ongoing speech or PCM audio immediately so audio never overlaps
  stopCurrentSpeech();

  const cacheKey = text.trim();

  // 1. Instant play from client cache if available
  if (clientAudioCache.has(cacheKey)) {
    const cached = clientAudioCache.get(cacheKey)!;
    playPCMBase64Audio(cached.audio, cached.sampleRate || 24000);
    return;
  }

  // 2. Try server Gemini TTS if not currently in rate-limit backoff window
  const isRateLimited = Date.now() < ttsRateLimitedUntil;
  if (!isRateLimited) {
    try {
      const response = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audio) {
          // Store in client-side cache for instant subsequent calls
          clientAudioCache.set(cacheKey, { audio: data.audio, sampleRate: data.sampleRate || 24000 });

          // Stop any WebSpeech that might have started during fetch
          stopCurrentSpeech();
          playPCMBase64Audio(data.audio, data.sampleRate || 24000);
          return;
        }
      } else if (response.status === 429 || response.status === 503) {
        // Set a 60-second cooldown on TTS endpoint attempts to save network requests
        ttsRateLimitedUntil = Date.now() + 60000;
      }
    } catch (e) {
      console.warn('Gemini TTS endpoint unavailable or failed, falling back to Web Speech synth:', e);
    }
  }

  // Web Speech API fallback
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Ensure any prior synthesis is stopped
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = (cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices()).find(v => v.lang.startsWith('en')) || null;
    if (voice) utterance.voice = voice;
    utterance.rate = 0.85;  // Slow, soothing pace
    utterance.pitch = 1.0;
    utterance.volume = currentGuidanceVoiceVolume;

    window.speechSynthesis.speak(utterance);
  }
}

// Backwards-compatible alias for speakAIVoice
export async function speakCalmMaleVoice(text: string): Promise<void> {
  return speakAIVoice(text);
}

// Play raw PCM audio buffer returned by Gemini TTS
function playPCMBase64Audio(base64Audio: string, sampleRate = 24000) {
  try {
    const ctx = getAudioContext();
    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Convert 16-bit PCM to Float32
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    const voiceGain = ctx.createGain();
    voiceGain.gain.setValueAtTime(currentGuidanceVoiceVolume, ctx.currentTime);

    source.connect(voiceGain);
    voiceGain.connect(ctx.destination);
    
    // Store source reference so it can be stopped if a new speech instruction triggers
    currentAudioSource = source;
    source.onended = () => {
      if (currentAudioSource === source) {
        currentAudioSource = null;
      }
    };

    source.start(0);
  } catch (err) {
    console.error('Error playing Gemini PCM audio:', err);
  }
}
