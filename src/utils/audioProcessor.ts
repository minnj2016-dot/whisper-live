/**
 * Audio Recording and Playback utility for Gemini Live Translate API
 * 
 * Requirements:
 * - Input: 16kHz raw 16-bit PCM (mono, little-endian), sent in 100ms chunks (1600 samples / 3200 bytes)
 * - Output: 24kHz raw 16-bit PCM (mono, little-endian)
 */

export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private onAudioChunk: (base64Data: string) => void;
  private bufferSize = 4096;
  
  // Audio accumulation buffer for downsampling to 16kHz
  private inputBuffer: number[] = [];
  private targetSampleRate = 16000;
  
  constructor(onAudioChunk: (base64Data: string) => void) {
    this.onAudioChunk = onAudioChunk;
  }

  async start() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sourceSampleRate = this.audioContext.sampleRate;
      
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Use ScriptProcessorNode for wide browser compatibility (Safari, Mobile Chrome, etc.)
      this.processorNode = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);
      
      this.processorNode.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // 1. Resample from sourceSampleRate to targetSampleRate (16kHz)
        const resampledData = this.resample(inputData, sourceSampleRate, this.targetSampleRate);
        
        // 2. Accumulate in our local buffer
        for (let i = 0; i < resampledData.length; i++) {
          this.inputBuffer.push(resampledData[i]);
        }
        
        // 3. Extract 100ms chunks (16000Hz * 0.1s = 1600 samples)
        const samplesPerChunk = 1600; // 100ms at 16kHz
        while (this.inputBuffer.length >= samplesPerChunk) {
          const chunkSamples = this.inputBuffer.slice(0, samplesPerChunk);
          this.inputBuffer = this.inputBuffer.slice(samplesPerChunk);
          
          // Convert float32 samples to 16-bit PCM (Little Endian)
          const pcmBuffer = this.convertToPCM16(chunkSamples);
          
          // Convert to Base64 to send over WebSocket
          const base64Data = this.arrayBufferToBase64(pcmBuffer);
          this.onAudioChunk(base64Data);
        }
      };

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      throw error;
    }
  }

  stop() {
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.inputBuffer = [];
  }

  // Linear interpolation resampling
  private resample(data: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate === toRate) {
      return data;
    }
    
    const ratio = fromRate / toRate;
    const newLength = Math.round(data.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const nextIndex = i * ratio;
      const index = Math.floor(nextIndex);
      const interpolation = nextIndex - index;
      
      const sample1 = data[index];
      const sample2 = (index + 1 < data.length) ? data[index + 1] : sample1;
      
      result[i] = sample1 + (sample2 - sample1) * interpolation;
    }
    
    return result;
  }

  // Convert Float32Array [-1.0, 1.0] to ArrayBuffer containing 16-bit PCM (Int16) Little-Endian
  private convertToPCM16(samples: number[]): ArrayBuffer {
    const buffer = new ArrayBuffer(samples.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < samples.length; i++) {
      // Clamp values between -1.0 and 1.0
      let s = Math.max(-1, Math.min(1, samples[i]));
      // Convert to 16-bit signed integer
      const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(i * 2, val, true); // true = little endian
    }
    
    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private nextPlaybackTime = 0;
  private targetSampleRate = 24000; // Output audio format is 24kHz

  constructor() {
    // AudioContext will be lazy initialized on user interaction
  }

  private initContext() {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      // Create context at exactly 24000Hz if possible, or fallback to default rate
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: this.targetSampleRate
        });
      } catch (e) {
        // Fallback for browsers that don't support custom sample rate on context creation
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      this.nextPlaybackTime = this.audioContext.currentTime;
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Receives base64-encoded 24kHz 16-bit PCM mono data and plays it
  playPCMChunk(base64Data: string) {
    this.initContext();
    if (!this.audioContext) return;

    // 1. Decode base64 to binary ArrayBuffer
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const buffer = bytes.buffer;
    const view = new DataView(buffer);
    const sampleCount = len / 2; // Each 16-bit sample is 2 bytes
    const floatSamples = new Float32Array(sampleCount);

    // 2. Convert 16-bit signed PCM (Little-Endian) to Float32 [-1.0, 1.0]
    for (let i = 0; i < sampleCount; i++) {
      const pcm16 = view.getInt16(i * 2, true); // true = little endian
      floatSamples[i] = pcm16 / 32768.0;
    }

    // 3. Create AudioBuffer
    const sourceSampleRate = this.targetSampleRate;
    const audioBuffer = this.audioContext.createBuffer(1, sampleCount, sourceSampleRate);
    audioBuffer.getChannelData(0).set(floatSamples);

    // 4. Schedule playback to prevent clicking and gaps
    const sourceNode = this.audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(this.audioContext.destination);

    const currentTime = this.audioContext.currentTime;
    const duration = audioBuffer.duration;

    // Schedule slightly in the future to avoid gaps under high CPU load
    const schedulingTime = Math.max(this.nextPlaybackTime, currentTime + 0.02);
    sourceNode.start(schedulingTime);
    
    // Update next playback window
    this.nextPlaybackTime = schedulingTime + duration;
  }

  stop() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.nextPlaybackTime = 0;
  }
}
