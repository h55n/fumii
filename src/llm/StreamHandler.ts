/**
 * StreamHandler — accumulates tokens from IPC stream into a final string.
 * Used in renderer when you need the full assembled response before acting on it.
 */
export class StreamHandler {
  private buffer = ''
  private onToken: (token: string, accumulated: string) => void
  private onComplete: (fullText: string) => void
  private onError: (err: Error) => void

  constructor(options: {
    onToken: (token: string, accumulated: string) => void
    onComplete: (fullText: string) => void
    onError: (err: Error) => void
  }) {
    this.onToken = options.onToken
    this.onComplete = options.onComplete
    this.onError = options.onError
  }

  /** Feed a token chunk (null signals end-of-stream) */
  push(chunk: string | null): void {
    if (chunk === null) {
      this.onComplete(this.buffer)
      return
    }
    this.buffer += chunk
    this.onToken(chunk, this.buffer)
  }

  error(err: Error): void {
    this.onError(err)
  }

  reset(): void {
    this.buffer = ''
  }

  get accumulated(): string {
    return this.buffer
  }
}
