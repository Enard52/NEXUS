export class VoiceEngine {
  constructor(private readonly apiKey?: string) {}

  public isEnabled(): boolean {
    return !!this.apiKey;
  }

  public async transcribe(_audio: Blob): Promise<string> {
    if (!this.isEnabled()) {
      throw new Error("VoiceEngine is not configured with an API key.");
    }
    // STT mock
    return "mock transcription";
  }

  public async synthesize(text: string): Promise<Blob> {
    if (!this.isEnabled()) {
      throw new Error("VoiceEngine is not configured with an API key.");
    }
    // TTS mock
    return new Blob([text]);
  }
}
