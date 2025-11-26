/**
 * AudioPlayer
 *
 * Lightweight helper around an HTMLAudioElement for widget use.
 * Responsibilities:
 *  - Load an audio source URL
 *  - Play / pause / stop (reset) controls
 *  - Optional looping
 *  - Volume clamped to the [0,1] range
 *  - Invoke a registered callback when playback ends
 *
 * Usage example:
 *  const player = new AudioPlayer('https://example.com/sound.mp3', 0.5)
 *  await player.play()
 *  player.setVolume(0.75)
 *  player.stop()
 */
export class AudioPlayer {
    public id: string = ''
    public playing: boolean = false
    private audio: HTMLAudioElement
    private onEndCallback?: () => void

    /**
     * Create a new AudioPlayer.
     *
     * The instance owns the underlying HTMLAudioElement and should be disposed
     * via {@link destroy} when no longer needed.
     *
     * @param url Direct URL to the audio resource (must be supported by the browser).
     * @param volume Initial volume (0–1). Values outside the range are clamped. Defaults to 1.0.
     */
    constructor(url: string, volume: number = 1.0) {
        this.audio = new Audio(url)
        this.audio.volume = this.clampVolume(volume)

        // Bind the ended event
        this.audio.addEventListener('ended', () => {
            if (!this.playing) return
            this.playing = false
            if (!this.onEndCallback) return
            try {
                this.onEndCallback()
            } catch (error) {
                // Ensure widget does not crash if callback throws.
                console.error('Audio onEnd callback failed:', error)
            }
        })
    }

    /**
     * Start playing the audio.
     *
     * If playback is blocked by the browser (for example, missing user
     * interaction), the method retries a few times before giving up.
     *
     * @param loop When true, audio loops continuously.
     * @returns Promise that resolves once a play attempt has completed.
     */
    public async play(loop: boolean = false): Promise<void> {
        this.audio.loop = loop
        this.playing = true

        const attemptPlay = async (): Promise<void> => {
            try {
                await this.audio.play()
            } catch (err) {
                if (err.name === 'NotAllowedError') {
                    console.warn('Playback blocked, retrying...')
                    await new Promise((resolve) => setTimeout(resolve, 250))
                    if (!this.playing) return
                    await attemptPlay()
                } else {
                    console.error('Audio playback failed:', err)
                    this.playing = false
                }
            }
        }

        await attemptPlay()
    }

    /**
     * Rewind playback position to the beginning without changing play state.
     */
    public rewind(): void {
        this.audio.currentTime = 0
    }

    /**
     * Stop playback and reset position to the beginning.
     *
     * After calling this, {@link playing} will be false.
     */
    public stop(): void {
        this.audio.pause()
        this.audio.currentTime = 0 // reset position

        this.playing = false
    }

    /**
     * Pause playback without resetting position.
     *
     * Note that {@link playing} is not modified; callers should update
     * external state if they rely on that flag.
     */
    public pause(): void {
        this.audio.pause()
    }

    /**
     * Set the playback volume.
     *
     * @param volume Desired volume in range 0–1. Values are clamped.
     */
    public setVolume(volume: number): void {
        this.audio.volume = this.clampVolume(volume)
    }

    /**
     * Register a callback that fires when the audio finishes naturally.
     *
     * The callback is not invoked on manual {@link stop} or {@link pause}.
     * Passing a new callback replaces any previously registered one.
     *
     * @param callback Function to invoke on natural end of playback.
     */
    public registerOnEndCallback(callback: () => void): void {
        this.onEndCallback = callback
    }

    /**
     * Release resources associated with this player.
     *
     * After calling this method the instance should not be used again.
     * All further operations on this player are effectively no-ops.
     */
    public destroy(): void {
        this.playing = false
        this.onEndCallback = undefined
        try {
            this.audio.volume = 0
        } catch {}
        this.audio?.pause?.()
        try {
            this.audio.src = ''
            this.audio.load()
        } catch {}
    }

    /**
     * Clamp a volume value to the [0,1] interval.
     *
     * @param volume Arbitrary numeric volume.
     * @returns Volume restricted to valid range.
     * @private
     */
    private clampVolume(volume: number): number {
        return Math.min(1, Math.max(0, volume))
    }
}
