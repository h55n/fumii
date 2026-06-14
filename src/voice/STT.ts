type OnResultFn = (text: string) => void
type OnErrorFn = (error: string) => void

let activeRecognition: any = null

export function startListening(onResult: OnResultFn, onError?: OnErrorFn): () => void {
  const SpeechRecognition =
    (window as any).webkitSpeechRecognition ||
    (window as any).SpeechRecognition

  if (!SpeechRecognition) {
    onError?.('Speech recognition not supported in this browser')
    return () => {}
  }

  const recognition = new SpeechRecognition()
  recognition.lang = 'en-US'
  recognition.interimResults = false
  recognition.maxAlternatives = 1
  recognition.continuous = false

  recognition.onresult = (e: any) => {
    const transcript = e.results[0]?.[0]?.transcript
    if (transcript) onResult(transcript)
  }

  recognition.onerror = (e: any) => {
    onError?.(`STT error: ${e.error}`)
  }

  recognition.onend = () => {
    activeRecognition = null
  }

  recognition.start()
  activeRecognition = recognition

  return () => {
    recognition.stop()
    activeRecognition = null
  }
}

export function stopListening(): void {
  activeRecognition?.stop()
  activeRecognition = null
}

export function isListening(): boolean {
  return activeRecognition !== null
}
