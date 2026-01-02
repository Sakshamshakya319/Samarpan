"use client"

// Audio feedback utility for QR code scanning
export class BeepSound {
  private static audioContext: AudioContext | null = null
  private static audioBuffer: AudioBuffer | null = null
  private static isInitialized = false

  // Initialize audio context and load beep sound
  static async initialize() {
    if (this.isInitialized) return

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Load beep.mp3 from public folder
      const response = await fetch('/beep.mp3')
      const arrayBuffer = await response.arrayBuffer()
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      
      this.isInitialized = true
      console.log('Beep sound initialized successfully')
    } catch (error) {
      console.warn('Failed to initialize beep sound:', error)
      // Fallback to programmatic beep
      this.isInitialized = false
    }
  }

  // Play beep sound
  static async playBeep() {
    try {
      // Initialize if not already done
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Try to play loaded audio file first
      if (this.audioContext && this.audioBuffer && this.isInitialized) {
        // Check if audio context is suspended (common in browsers)
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume()
        }
        
        const source = this.audioContext.createBufferSource()
        const gainNode = this.audioContext.createGain()
        
        source.buffer = this.audioBuffer
        source.connect(gainNode)
        gainNode.connect(this.audioContext.destination)
        
        // Set volume
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
        
        source.start(0)
        return
      }

      // Fallback to programmatic beep
      this.playProgrammaticBeep()
    } catch (error) {
      console.warn('Failed to play beep sound:', error)
      // Final fallback
      this.playProgrammaticBeep()
    }
  }

  // Programmatic beep as fallback
  private static playProgrammaticBeep() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800 // Frequency in Hz
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      console.warn('Programmatic beep also failed:', error)
    }
  }

  // Play success beep (higher pitch)
  static async playSuccessBeep() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 1000 // Higher frequency for success
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('Success beep failed:', error)
    }
  }

  // Play error beep (lower pitch)
  static async playErrorBeep() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Create two oscillators for error sound
      const osc1 = audioContext.createOscillator()
      const osc2 = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      osc1.connect(gainNode)
      osc2.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      osc1.frequency.value = 400 // Lower frequency
      osc2.frequency.value = 300 // Even lower
      osc1.type = 'sawtooth'
      osc2.type = 'sawtooth'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      osc1.start(audioContext.currentTime)
      osc2.start(audioContext.currentTime + 0.1)
      osc1.stop(audioContext.currentTime + 0.5)
      osc2.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.warn('Error beep failed:', error)
    }
  }
}

// Convenience functions for easy import
export const playBeep = () => BeepSound.playBeep()
export const playSuccessBeep = () => BeepSound.playSuccessBeep()
export const playErrorBeep = () => BeepSound.playErrorBeep()
export const initializeBeepSound = () => BeepSound.initialize()