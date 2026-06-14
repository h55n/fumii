let voicesLoaded = false
let preferredVoice: SpeechSynthesisVoice | null = null

function loadVoices(): void {
  if (voicesLoaded) return
  const voices = speechSynthesis.getVoices()
  if (voices.length === 0) {
    speechSynthesis.onvoiceschanged = () => {
      selectVoice()
      voicesLoaded = true
    }
  } else {
    selectVoice()
    voicesLoaded = true
  }
}

function selectVoice(): void {
  const voices = speechSynthesis.getVoices()
  // Priority: Zira (Windows default female), then any en-US female-sounding voice
  preferredVoice =
    voices.find(v => v.name.includes('Zira')) ||
    voices.find(v => v.name.includes('Samantha')) ||
    voices.find(v => v.lang === 'en-US' && !v.name.toLowerCase().includes('male')) ||
    voices.find(v => v.lang === 'en-US') ||
    null
}

export function speak(text: string, onEnd?: () => void): void {
  if (!window.speechSynthesis) return

  loadVoices()
  window.speechSynthesis.cancel()

  const utter = new SpeechSynthesisUtterance(text)
  utter.rate = 0.95
  utter.pitch = 1.05
  utter.volume = 1.0

  if (preferredVoice) utter.voice = preferredVoice

  if (onEnd) utter.onend = onEnd

  window.speechSynthesis.speak(utter)
}

export function stopSpeaking(): void {
  window.speechSynthesis?.cancel()
}

export function isSpeaking(): boolean {
  return window.speechSynthesis?.speaking ?? false
}
