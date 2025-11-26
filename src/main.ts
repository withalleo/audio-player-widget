import 'alleo/service'
import { AlleoWidget, AnalyticsHelper, FileSystemNodeClassifier, SettingsDialogHelper, SharedVariable } from '@withalleo/alleo-widget'
// import { ExtendedFormlyFieldConfig } from 'SettingsDialogHelper'
import { AudioPlayer } from './AudioPlayer'

/**
 * Supported audio source types for the widget.
 */
enum AudioSourceType {
    /** A file uploaded to the board and referenced by fileId. */
    FileAsset = 'file-asset',
    /** A direct URL to an audio file or stream. */
    Url = 'url',
}

/**
 * Configuration for a single audio source in the widget.
 */
type AudioSource = {
    /** Type of source (file asset or URL). */
    type: AudioSourceType
    /** Unique identifier used to address this source from actions. */
    id: string
    /** File asset identifier when {@link type} is {@link AudioSourceType.FileAsset}. */
    fileId?: string
    /** Direct URL when {@link type} is {@link AudioSourceType.Url}. */
    url?: string
    /**
     * Volume level from 0 to 1.
     * If omitted, defaults to 1 (full volume).
     */
    volume?: number
}

/**
 * Settings dialog configuration type.
 * (Note: missing export in AlleoWidget SDK, mostly equivalent to FormlyFieldConfig from Angular Formly)
 */
type ExtendedFormlyFieldConfig = any

/**
 * AudioPlayerWidget
 *
 * Alleo widget that manages one or more {@link AudioPlayer} instances and
 * exposes actions to play or stop individual sources or a playlist.
 */
class AudioPlayerWidget extends AlleoWidget<typeof AudioPlayerWidget.defaultSharedVariables> {
    private static defaultSharedVariables = {
        sources: <AudioSource[]>[],
        autoStart: <boolean>false,
    }

    private players: AudioPlayer[] = []

    constructor() {
        super(AudioPlayerWidget.defaultSharedVariables)

        const settingsDialog = new SettingsDialogHelper({
            fields: this.dialogFields,
        })

        if (haptic.creation) settingsDialog.openSettingsDialog()

        this.initialize()

        new SharedVariable.observer('sources', () => this.initialize())

        settingsDialog.addSettingsToWidgetObjectSettings()
    }

    /**
     * Formly configuration for the widget settings dialog.
     */
    private get dialogFields(): ExtendedFormlyFieldConfig[] {
        return [
            {
                key: 'sources',
                type: 'array',
                defaultValue: this.shared.sources,
                props: {
                    addText: 'Add audio source',
                    label: 'Audio sources',
                    minItems: 0,
                    maxItems: 25,
                    allowReordering: false,
                },
                fieldArray: {
                    fieldGroup: [
                        {
                            key: 'id',
                            type: 'hidden',
                            defaultValue: haptic.utils.uuidv4(),
                            className: 'hidden',
                            props: {
                                label: 'ID',
                                readonly: true,
                            },
                        },
                        {
                            key: 'type',
                            type: 'select',
                            defaultValue: AudioSourceType.FileAsset,
                            props: {
                                label: 'Source',
                                options: [
                                    { label: 'File Asset', value: AudioSourceType.FileAsset },
                                    { label: 'URL', value: AudioSourceType.Url },
                                ],
                            },
                        },
                        {
                            key: 'fileId',
                            type: 'file',
                            props: {
                                label: 'Audio file',
                                showThumbnail: false,
                                icon: 'audio_file',
                                fileTypes: [FileSystemNodeClassifier.Audio],
                            },
                            expressions: {
                                hide: (model) => model.parent?.model?.['type'] !== AudioSourceType.FileAsset,
                            },
                        },
                        {
                            key: 'url',
                            type: 'input',
                            props: {
                                label: 'Audio file or stream URL',
                                description: 'Playing audio might be restricted due to security (CORS) policies.',
                            },
                            expressions: {
                                hide: (model) => model.parent?.model?.['type'] !== AudioSourceType.Url,
                            },
                        },

                        {
                            template: '<br /><h5>Volume</h5>',
                        },
                        {
                            key: 'volume',
                            type: 'slider',
                            defaultValue: 1,
                            props: {
                                label: 'Volume',
                                min: 0,
                                max: 1,
                                step: 0.05,
                                discrete: true,
                            },
                        },
                    ],
                },
            },
            {
                key: 'autoStart',
                type: 'checkbox',
                defaultValue: this.shared.autoStart,
                props: {
                    label: 'Start playlist automatically',
                },
            },
        ]
    }

    /**
     * Play a configured audio source by its id.
     *
     * If the source is already playing it is rewound before playing again.
     *
     * @param id Identifier of the audio source to play.
     * @param loop When true, the audio will loop continuously.
     */
    public play(id: string, loop: boolean = false): void {
        AnalyticsHelper.debug('play', { id, loop })
        const player = this.players.find((p) => p.id === id)
        if (!player) {
            AnalyticsHelper.error('No audio player found with ID', { id })
            return
        }
        if (player.playing) player.rewind()
        player.play(loop)
    }

    /**
     * Stop a configured audio source by its id.
     *
     * @param id Identifier of the audio source to stop.
     */
    public stop(id: string): void {
        AnalyticsHelper.debug('stop', { id })
        const player = this.players.find((p) => p.id === id)
        if (!player) {
            AnalyticsHelper.error('No audio player found with ID', { id })
            return
        }
        player.stop()
    }

    /**
     * Clean up when the widget is destroyed.
     */
    public override destroy(): void | Promise<void> {
        this.destroyPlayers()
        return super.destroy()
    }

    /**
     * Destroy all audio players and free resources.
     * @private
     */
    private destroyPlayers(): void {
        for (const player of this.players) player.destroy()
        this.players = []
    }
    /**
     * (Re)initialize the widget after settings change.
     *
     * Disposes existing players, recreates them from shared sources and
     * wires up haptic action triggers and effects.
     */
    private async initialize(): Promise<void> {
        AnalyticsHelper.debug('initialize', { sources: this.shared.sources })
        for (const player of this.players) player.destroy()
        this.players = []

        const actionTriggers: typeof haptic.actionTriggers = []
        const actionEffects: typeof haptic.actionEffects = [
            {
                label: 'Stop all audio',
                id: 'widget-audio-player-stop-all-audio',
                callback: () => {
                    for (const player of this.players) player.stop()
                },
            },
            {
                label: 'Play all audio as playlist',
                id: 'widget-audio-player-play-all-audio-as-playlist',
                callback: () => this.playAsPlaylist(),
            },
        ]
        for (const source of this.shared.sources) {
            // initialize the audio players
            let player: AudioPlayer
            try {
                if (source.type === AudioSourceType.FileAsset && source.fileId) {
                    const url = await haptic.board.assets.getFileUrl(source.fileId)
                    if (!url) {
                        AnalyticsHelper.error('Failed to get URL for file asset with ID', { fileId: source.fileId })
                        continue
                    }
                    player = new AudioPlayer(url, source.volume ?? 1)
                    player.id = source.id
                    this.players.push(player)
                } else if (source.type === AudioSourceType.Url && source.url) {
                    player = new AudioPlayer(source.url, source.volume ?? 1)
                    player.id = source.id
                    this.players.push(player)
                } else {
                    AnalyticsHelper.error('Invalid audio source configuration:', source)
                    continue
                }
            } catch (error) {
                AnalyticsHelper.error('Error initializing audio player for source:', { source, error })
                continue
            }
            if (!player) continue

            // set up action triggers and effects
            let name =
                source.type === AudioSourceType.Url ? source.url : (await haptic.board.assets.getFileNode(source.fileId))?.name || 'unknown'
            if (name?.length > 30) name = name.slice(0, 27) + '...'

            actionTriggers.push({
                id: 'widget-audio-player-audio-ended-' + source.id,
                label: `Audio ends: ${name}`,
            })
            actionTriggers.push({
                id: 'widget-audio-player-audio-started-' + source.id,
                label: `Audio starts: ${name}`,
            })

            actionEffects.push({
                id: 'widget-audio-player-play-audio-' + source.id,
                label: `Play audio: ${name}`,
                callback: () => this.play(source.id),
            })
            actionEffects.push({
                id: 'widget-audio-player-stop-audio-' + source.id,
                label: `Stop audio: ${name}`,
                callback: () => this.stop(source.id),
            })
            actionEffects.push({
                id: 'widget-audio-player-play-audio-loop-' + source.id,
                label: `Loop audio: ${name}`,
                callback: () => this.play(source.id, true),
            })

            player.registerOnEndCallback(() => haptic.triggerAction('widget-audio-player-audio-ended-' + source.id))
        }
        haptic.actionTriggers = actionTriggers
        haptic.actionEffects = actionEffects

        if (this.shared.autoStart) this.playAsPlaylist()
    }

    /**
     * Start playing all configured sources one after another from the beginning as a looping playlist.
     */
    private playAsPlaylist(): void {
        AnalyticsHelper.debug('playAsPlaylist')
        if (!this.shared.sources?.length) return
        let currentIndex = 0
        const playNext = () => {
            if (currentIndex >= this.players.length) currentIndex = 0
            const player = this.players[currentIndex]
            player.registerOnEndCallback(() => {
                haptic.triggerAction('widget-audio-player-audio-ended-' + player.id)
                currentIndex++
                playNext()
            })
            haptic.triggerAction('widget-audio-player-audio-started-' + player.id)
            player.play()
        }
        playNext()
    }
}

new AudioPlayerWidget()
