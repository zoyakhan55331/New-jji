/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Helper to downsample a float buffer to target sample rate.
 */
function downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number): Float32Array {
  if (inputRate === outputRate) {
    return buffer;
  }
  const sampleRateRatio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

/**
 * Helper to convert Float32 float array (range -1 to 1) to signed Int16 binary pcm data.
 */
function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true); // Little-endian Int16
  }
  return buffer;
}

/**
 * Fast Base64 encoding of an ArrayBuffer.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Fast decode of Base64 to Float32Array (treating string as Int16 PCM at 24kHz).
 */
function base64ToFloat32(base64: string): Float32Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

export class AudioStreamer {
  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private volume: number = 1.0;
  
  // Track playback scheduling
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  
  private onAudioInputCallback: ((base64PCM: string) => void) | null = null;

  constructor() {}

  /**
   * Initializes the AudioContext and setup analysers/gains.
   */
  private ensureContext() {
    if (!this.audioCtx) {
      // Standard audio context
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  /**
   * Get the realtime speech input analyser for visual feedback
   */
  public getInputAnalyser(): AnalyserNode | null {
    return this.inputAnalyser;
  }

  /**
   * Get the realtime speech response analyser for Fiza's voice
   */
  public getOutputAnalyser(): AnalyserNode | null {
    return this.outputAnalyser;
  }

  /**
   * Start microphone capture downsampled to 16kHz.
   */
  public async startMicCapture(onAudioPCM: (base64PCM: string) => void) {
    this.ensureContext();
    const ctx = this.audioCtx!;
    this.onAudioInputCallback = onAudioPCM;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.micSource = ctx.createMediaStreamSource(this.micStream);
      
      // Create Input Analyser for visualizing user mic
      this.inputAnalyser = ctx.createAnalyser();
      this.inputAnalyser.fftSize = 256;
      this.micSource.connect(this.inputAnalyser);

      // Setup recording processor (block size 2048, 1 input channel, 1 output channel)
      this.processorNode = ctx.createScriptProcessor(2048, 1, 1);
      const nativeSampleRate = ctx.sampleRate;

      this.processorNode.onaudioprocess = (e) => {
        if (!this.onAudioInputCallback) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Downsample to 16kHz
        const downsampled = downsampleBuffer(inputData, nativeSampleRate, 16000);
        // Convert to Int16 Int16Array ArrayBuffer
        const pcmBuffer = floatTo16BitPCM(downsampled);
        // Convert to Base64
        const base64 = arrayBufferToBase64(pcmBuffer);

        this.onAudioInputCallback(base64);
      };

      // Connect recording nodes
      this.micSource.connect(this.processorNode);
      this.processorNode.connect(ctx.destination);

      console.log(`Microphone capture successfully started at native rate ${nativeSampleRate}Hz downsampled to 16000Hz`);
    } catch (err) {
      console.error("Failed to start mic capture:", err);
      throw err;
    }
  }

  /**
   * Stop microphone capture.
   */
  public stopMicCapture() {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    this.inputAnalyser = null;
    this.onAudioInputCallback = null;
    console.log("Mic capture stopped.");
  }

  /**
   * Feeds raw base64 PCM data (from Gemini Live 24kHz) to the gapless scheduling queue.
   */
  public playServerAudioChunk(base64PCM: string) {
    this.ensureContext();
    const ctx = this.audioCtx!;

    // Create outputs/analysers if they don't exist
    if (!this.outputAnalyser) {
      this.outputAnalyser = ctx.createAnalyser();
      this.outputAnalyser.fftSize = 256;
    }
    if (!this.gainNode) {
      this.gainNode = ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);
      
      // Connect: outputAnalyser -> gainNode -> destination
      this.outputAnalyser.connect(this.gainNode);
      this.gainNode.connect(ctx.destination);
    }

    const pcmData = base64ToFloat32(base64PCM);
    if (pcmData.length === 0) return;

    const sampleRate = 24000; // Gemini Live responses are strictly 24kHz
    const audioBuffer = ctx.createBuffer(1, pcmData.length, sampleRate);
    audioBuffer.getChannelData(0).set(pcmData);

    const sourceNode = ctx.createBufferSource();
    sourceNode.buffer = audioBuffer;

    // Connect source to the Analyser
    sourceNode.connect(this.outputAnalyser);

    const currentTime = ctx.currentTime;
    // Handle lag/jitter by scheduling ahead if we fell behind
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime + 0.04;
    }

    sourceNode.start(this.nextStartTime);
    
    // Increment starting points
    this.nextStartTime += audioBuffer.duration;
    
    // Store reference to check active sources/interruption stops
    this.activeSources.push(sourceNode);

    // Clean up references when done
    sourceNode.onended = () => {
      this.activeSources = this.activeSources.filter((src) => src !== sourceNode);
    };
  }

  /**
   * Set Fiza's response volume multiplier (0.0 to 2.0+)
   */
  public setVolume(val: number) {
    this.volume = val;
    if (this.gainNode && this.audioCtx) {
      try {
        this.gainNode.gain.setValueAtTime(val, this.audioCtx.currentTime);
      } catch (e) {
        console.warn("Failed to set gainNode volume:", e);
      }
    }
  }

  /**
   * Get current output volume multiplier
   */
  public getVolume(): number {
    return this.volume;
  }

  /**
   * Clear all active playing nodes and reset queue (Interruption signal).
   */
  public stopAndFlushOutput() {
    console.log(`Interrupt triggering: killing ${this.activeSources.length} playing audio nodes`);
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Source might have already finished or not started
      }
    });
    this.activeSources = [];
    this.nextStartTime = 0;
  }

  /**
   * Full cleanup
   */
  public dispose() {
    this.stopMicCapture();
    this.stopAndFlushOutput();
    if (this.audioCtx) {
      try {
        const p = this.audioCtx.close();
        if (p && typeof p.catch === "function") {
          p.catch(() => {});
        }
      } catch (e) {
        console.warn("Could not close audio context:", e);
      }
      this.audioCtx = null;
    }
    this.outputAnalyser = null;
    this.gainNode = null;
    console.log("AudioStreamer fully disposed.");
  }
}
