'use client';

/**
 * VOICE RECOGNITION ENGINE
 * Web Speech API integration for Sovryn Companion
 * Privacy-first design with wake word detection and auto-sleep
 */

export interface VoiceCommand {
  command: string;
  action: () => void;
  aliases?: string[];
}

export interface VoiceRecognitionConfig {
  wakeWord: string;
  autoSleepMs: number;
  language: string;
  continuous: boolean;
  interimResults: boolean;
}

export type VoiceRecognitionCallback = (transcript: string, isFinal: boolean) => void;
export type VoiceCommandCallback = (command: string) => void;

const DEFAULT_CONFIG: VoiceRecognitionConfig = {
  wakeWord: 'sovereign',
  autoSleepMs: 10000, // 10 seconds
  language: 'en-US',
  continuous: true,
  interimResults: true,
};

export class VoiceRecognitionEngine {
  private recognition: any = null;
  private isListening = false;
  private silenceTimer: NodeJS.Timeout | null = null;
  private config: VoiceRecognitionConfig;
  private commands: Map<string, VoiceCommand> = new Map();
  private onTranscriptCallback: VoiceRecognitionCallback | null = null;
  private onCommandCallback: VoiceCommandCallback | null = null;
  private onStateChangeCallback: ((isListening: boolean) => void) | null = null;

  constructor(config: Partial<VoiceRecognitionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeRecognition();
  }

  private initializeRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Web Speech API not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.language;

    this.recognition.onresult = (event: any) => {
      this.handleResult(event);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') {
        this.stopListening();
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Restart if still supposed to be listening
        this.recognition.start();
      }
    };
  }

  private handleResult(event: any) {
    const results = event.results;
    const lastResult = results[results.length - 1];
    const transcript = lastResult[0].transcript.toLowerCase().trim();
    const isFinal = lastResult.isFinal;

    // Notify transcript callback
    if (this.onTranscriptCallback) {
      this.onTranscriptCallback(transcript, isFinal);
    }

    // Reset silence timer on speech
    this.resetSilenceTimer();

    // Only process final results for command matching
    if (isFinal) {
      this.matchCommand(transcript);
    }
  }

  private matchCommand(transcript: string) {
    // Check for exact matches and aliases
    for (const [key, command] of this.commands.entries()) {
      const patterns = [command.command, ...(command.aliases || [])];
      
      for (const pattern of patterns) {
        if (transcript.includes(pattern.toLowerCase())) {
          console.log(`✓ Voice command matched: "${pattern}"`);
          command.action();
          
          if (this.onCommandCallback) {
            this.onCommandCallback(pattern);
          }
          
          return;
        }
      }
    }
  }

  private resetSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }

    this.silenceTimer = setTimeout(() => {
      console.log('⏰ Auto-sleep triggered after 10 seconds of silence');
      this.stopListening();
    }, this.config.autoSleepMs);
  }

  public registerCommand(command: VoiceCommand) {
    this.commands.set(command.command, command);
  }

  public registerCommands(commands: VoiceCommand[]) {
    commands.forEach(cmd => this.registerCommand(cmd));
  }

  public startListening() {
    if (!this.recognition) {
      console.error('Speech recognition not initialized');
      return;
    }

    if (this.isListening) return;

    this.isListening = true;
    this.recognition.start();
    this.resetSilenceTimer();

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(true);
    }

    console.log('🎤 Voice recognition started');
  }

  public stopListening() {
    if (!this.recognition) return;

    this.isListening = false;
    this.recognition.stop();

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(false);
    }

    console.log('🔇 Voice recognition stopped');
  }

  public onTranscript(callback: VoiceRecognitionCallback) {
    this.onTranscriptCallback = callback;
  }

  public onCommand(callback: VoiceCommandCallback) {
    this.onCommandCallback = callback;
  }

  public onStateChange(callback: (isListening: boolean) => void) {
    this.onStateChangeCallback = callback;
  }

  public isActive(): boolean {
    return this.isListening;
  }

  public destroy() {
    this.stopListening();
    this.commands.clear();
    this.onTranscriptCallback = null;
    this.onCommandCallback = null;
    this.onStateChangeCallback = null;
  }
}

