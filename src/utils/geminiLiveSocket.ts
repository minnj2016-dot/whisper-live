/**
 * Gemini Live Translate API WebSocket Wrapper
 */

export interface LiveTranslateConfig {
  apiKey: string;
  targetLanguageCode: string;
  echoTargetLanguage: boolean;
}

export interface LiveTranslateCallbacks {
  onStatusChange: (status: 'disconnected' | 'connecting' | 'connected' | 'error', message?: string) => void;
  onInputTranscription: (text: string, isFinal: boolean) => void;
  onOutputTranscription: (text: string, isFinal: boolean) => void;
  onAudioOutput: (base64Audio: string) => void;
}

export class GeminiLiveSocket {
  private ws: WebSocket | null = null;
  private config: LiveTranslateConfig;
  private callbacks: LiveTranslateCallbacks;
  
  constructor(config: LiveTranslateConfig, callbacks: LiveTranslateCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  connect() {
    if (this.ws) {
      this.disconnect();
    }

    this.callbacks.onStatusChange('connecting');

    // Build the Gemini Multimodal Live API WebSocket URL
    // Endpoint: wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidirectionalConnect
    const host = 'generativelanguage.googleapis.com';
    const path = '/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidirectionalConnect';
    const url = `wss://${host}${path}?key=${this.config.apiKey}`;

    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('Gemini Live WebSocket connection established.');
        this.callbacks.onStatusChange('connected');
        this.sendSetup();
      };

      this.ws.onclose = (event) => {
        console.log(`Gemini Live WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
        this.callbacks.onStatusChange('disconnected');
      };

      this.ws.onerror = (error) => {
        console.error('Gemini Live WebSocket error:', error);
        this.callbacks.onStatusChange('error', '웹소켓 오류 발생. API 키와 네트워크 연결을 확인해주세요.');
      };

      this.ws.onmessage = (messageEvent) => {
        this.handleMessage(messageEvent.data);
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      this.callbacks.onStatusChange('error', '웹소켓 연결 생성 실패');
    }
  }

  disconnect() {
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  // Sends the setup configuration message
  private sendSetup() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const setupMessage = {
      setup: {
        model: 'models/gemini-3.5-live-translate-preview',
        generationConfig: {
          responseModalities: ['AUDIO'],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          translationConfig: {
            targetLanguageCode: this.config.targetLanguageCode,
            echoTargetLanguage: this.config.echoTargetLanguage
          }
        }
      }
    };

    console.log('Sending Setup Config:', JSON.stringify(setupMessage, null, 2));
    this.ws.send(JSON.stringify(setupMessage));
  }

  // Streams PCM audio chunk (Base64) to the Live API
  sendAudioChunk(base64Audio: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const audioMessage = {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Audio
          }
        ]
      }
    };

    this.ws.send(JSON.stringify(audioMessage));
  }

  // Dynamic configuration update: updates configuration options (like changing target language) during active session.
  // Note: Standard Gemini Live API might require establishing a new session for configuration changes, 
  // so we will re-establish the connection when settings are applied.
  updateConfig(newConfig: Partial<LiveTranslateConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('Config updated, reconnecting to apply changes...');
      this.connect();
    }
  }

  private handleMessage(data: string) {
    try {
      const response = JSON.parse(data);
      
      // Parse serverContent response
      if (response.serverContent) {
        const content = response.serverContent;
        
        // 1. Check for input transcription (the speech recognized from the source language)
        if (content.inputTranscription) {
          const text = content.inputTranscription.text || '';
          // We treat the stream transcription as dynamic updates
          this.callbacks.onInputTranscription(text, content.inputTranscription.isFinal || false);
        }
        
        // 2. Check for output transcription (the translated text)
        if (content.outputTranscription) {
          const text = content.outputTranscription.text || '';
          this.callbacks.onOutputTranscription(text, content.outputTranscription.isFinal || false);
        }
        
        // 3. Check for model turn containing translated audio chunks
        if (content.modelTurn && content.modelTurn.parts) {
          for (const part of content.modelTurn.parts) {
            if (part.inlineData && part.inlineData.data) {
              const audioData = part.inlineData.data;
              this.callbacks.onAudioOutput(audioData);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message:', e);
    }
  }
}
