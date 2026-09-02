/**
 * L3 — Video Expansion module orchestration.
 *
 * State, effects, DOM measurement and surface composition. In RD this layer is
 * rewritten against production hooks (redux, task orchestration, credits, login
 * gating, countly); it exists here as the executable behaviour spec that
 * `product/prototype.contract.yaml` describes in prose.
 *
 * The two layers below it are portable as-is:
 *   settings/  L1 composition of shared components
 *   data/      L2 pure product data and geometry
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ResultPageShell from '../../../platform/ui/result-page-shell/index.js';
import ToolPageLayout from '../../../platform/ui/tool-page-layout/index.js';
import { GenerateActionBar } from '../../../platform/ui/credit-controls/index.js';
import VideoHistory from '../../../platform/ui/video-history/index.js';
import VideoInfoDialog from '../../../platform/ui/video-info-dialog/index.js';
import VideoResultsSurface from '../../../platform/ui/video-results-surface/index.js';
import VideoTimeline from '../../../platform/ui/video-timeline/index.js';
import VideoTrimModal from '../../../platform/ui/video-trim-modal/index.js';
import { createTranslator } from '../../../platform/runtime/i18n.js';
import dictionary from '../product/i18n.json';
import mockData from '../product/mocks/video-expansion.json';
import sampleVideo from '../product/mock-assets/sample-video.mp4';
import sampleThumbnail from '../product/mock-assets/sample image.jpg';
import SettingsPanel from './settings/index.jsx';
import Icon from './icons.jsx';
import { extractVideoFrames } from './extract-video-frames.js';
import {
  DEFAULT_RATIO,
  ENTRY_SOURCES,
  GENERATION_STATES,
  MAX_SELECTED_SECONDS,
  MIN_SELECTED_SECONDS,
  SOURCE_STATES,
} from './data/defaults.js';
import {
  clampPosition,
  isContained as fitsInsideFrame,
  mediaSizing as sizingFor,
  movementAxis,
  positionBounds as boundsFor,
  ratioValue,
  targetFrameSize as frameSizeFor,
} from './data/canvas-geometry.js';
import { canGenerate, initialTrimRange, requiresInitialTrim, selectedDuration as durationOf } from './data/requirements.js';
import styles from './index.module.scss';

const t = createTranslator(dictionary);

export const featureMeta = { slug: 'video-expansion', title: 'Video Expansion', stage: 'pm-draft', readiness: 'working' };

function EmptyResult({ error, onPick, onSample, onRecover }) {
  return (
    <div className={styles.emptyResult} data-component-role="error-recovery">
      <div className={error ? styles.emptyVideoIconError : styles.emptyVideoIcon}>
        <Icon name={error ? 'warning' : 'video'} size={42} />
      </div>
      <h1>{error ? t('video.expansion.error.upload.title') : t('video.expansion.empty.title')}</h1>
      <p>{error ? mockData.errors.upload : t('video.expansion.empty.desc', { seconds: MAX_SELECTED_SECONDS })}</p>
      <button className={styles.emptyUploadButton} data-testid={error ? 'choose-another-video' : undefined} type="button" onClick={error ? onRecover : onPick}>
        <Icon name="upload" size={20} />{error ? t('video.expansion.error.upload.button') : t('ai.agent.dialog.upload.video')}
      </button>
      {!error ? (
        <div className={styles.sampleArea}>
          <span>{t('video.expansion.empty.sample')}</span>
          <button data-testid="load-sample-video" data-component-role="trim-control" type="button" onClick={onSample}>
            <img src={sampleThumbnail} alt={t('video.expansion.empty.sample')} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function VideoExpansionFeature() {
  const [activeTab, setActiveTab] = useState('edit');
  const [sourceState, setSourceState] = useState(SOURCE_STATES.EMPTY);
  const [sourceSrc, setSourceSrc] = useState(sampleVideo);
  const [sourceFile, setSourceFile] = useState(null);
  const [sourceRatio, setSourceRatio] = useState(3 / 4);
  const [entrySource, setEntrySource] = useState(ENTRY_SOURCES.LOCAL_UPLOAD);
  const [duration, setDuration] = useState(mockData.sourceVideo.mockDurationSeconds);
  const [trimStart, setTrimStart] = useState(mockData.sourceVideo.trimStartSeconds);
  const [trimEnd, setTrimEnd] = useState(mockData.sourceVideo.trimEndSeconds);
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [positionBounds, setPositionBounds] = useState({ x: 0, y: 0 });
  const [canvasViewportSize, setCanvasViewportSize] = useState({ width: 0, height: 0 });
  const [isContained, setIsContained] = useState(true);
  const [currentTime, setCurrentTime] = useState(mockData.sourceVideo.trimStartSeconds);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineFrames, setTimelineFrames] = useState([]);
  const [trimOpen, setTrimOpen] = useState(false);
  const [trimIsInitial, setTrimIsInitial] = useState(false);
  const [generationState, setGenerationState] = useState(GENERATION_STATES.IDLE);
  const [detailOpen, setDetailOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasViewportRef = useRef(null);
  const targetCanvasRef = useRef(null);
  const objectUrlRef = useRef(null);
  const timerRef = useRef(null);
  const dragRef = useRef(null);

  const loaded = sourceState === SOURCE_STATES.LOADED;
  const targetRatio = ratioValue(ratio);
  const selectedDuration = durationOf(trimStart, trimEnd);
  const movement = useMemo(() => movementAxis(sourceRatio, targetRatio), [sourceRatio, targetRatio]);
  const targetFrameSize = useMemo(
    () => frameSizeFor(canvasViewportSize, targetRatio),
    [canvasViewportSize, targetRatio],
  );

  useEffect(() => () => {
    window.clearTimeout(timerRef.current);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  useEffect(() => {
    let active = true;
    if (!loaded) {
      setTimelineFrames([]);
      return () => { active = false; };
    }

    setTimelineFrames([]);
    extractVideoFrames(sourceSrc, {
      count: mockData.timeline.thumbnailCount,
      startTime: trimStart,
      endTime: trimEnd,
    }).then((frames) => {
      if (active) setTimelineFrames(frames);
    }).catch(() => {
      if (active) setTimelineFrames([]);
    });

    return () => { active = false; };
  }, [loaded, sourceSrc, trimStart, trimEnd]);

  const resetEditor = () => {
    setRatio(DEFAULT_RATIO);
    setPosition({ x: 0, y: 0 });
    setIsPlaying(false);
  };

  const loadSample = (source = ENTRY_SOURCES.LOCAL_UPLOAD) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    const fromHistory = source === ENTRY_SOURCES.HISTORY_RESULT;
    setSourceState(SOURCE_STATES.LOADED);
    setSourceSrc(sampleVideo);
    setSourceFile(null);
    setSourceRatio(3 / 4);
    setDuration(fromHistory ? MAX_SELECTED_SECONDS : mockData.sourceVideo.mockDurationSeconds);
    setTrimStart(fromHistory ? 0 : mockData.sourceVideo.trimStartSeconds);
    setTrimEnd(fromHistory ? MAX_SELECTED_SECONDS : mockData.sourceVideo.trimEndSeconds);
    setCurrentTime(fromHistory ? 0 : mockData.sourceVideo.trimStartSeconds);
    setEntrySource(source);
    resetEditor();
    setActiveTab('edit');
    setTrimIsInitial(!fromHistory);
    setTrimOpen(!fromHistory);
  };

  const loadLocalFile = (file) => {
    const objectUrl = URL.createObjectURL(file);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = objectUrl;
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      const nextDuration = Number.isFinite(probe.duration) ? Math.max(1, Math.floor(probe.duration)) : MAX_SELECTED_SECONDS;
      const range = initialTrimRange(nextDuration);
      setDuration(nextDuration);
      setTrimStart(range.start);
      setTrimEnd(range.end);
      setCurrentTime(range.start);
      if (probe.videoWidth && probe.videoHeight) setSourceRatio(probe.videoWidth / probe.videoHeight);
      if (requiresInitialTrim(nextDuration)) {
        setTrimIsInitial(true);
        setTrimOpen(true);
      }
      probe.removeAttribute('src');
      probe.load();
    };
    probe.src = objectUrl;
    setSourceState(SOURCE_STATES.LOADED);
    setSourceSrc(objectUrl);
    setSourceFile(file);
    setEntrySource(ENTRY_SOURCES.LOCAL_UPLOAD);
    resetEditor();
    setActiveTab('edit');
  };

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setSourceState(SOURCE_STATES.ERROR);
      return;
    }
    loadLocalFile(file);
  };

  const removeSource = () => {
    videoRef.current?.pause();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSourceFile(null);
    setSourceState(SOURCE_STATES.EMPTY);
    setTrimOpen(false);
    setTrimIsInitial(false);
    setIsPlaying(false);
  };

  const closeTrim = () => {
    setTrimOpen(false);
    if (trimIsInitial) removeSource();
  };

  const confirmTrim = (range) => {
    setTrimStart(range.start);
    setTrimEnd(range.end);
    setCurrentTime(range.start);
    setTrimOpen(false);
    setTrimIsInitial(false);
    if (videoRef.current) videoRef.current.currentTime = range.start;
  };

  // RD replaces this with useProcess/runTask; the prototype only advances the
  // synthetic lifecycle so History can show every state.
  const beginProcessing = () => {
    window.clearTimeout(timerRef.current);
    videoRef.current?.pause();
    setIsPlaying(false);
    setGenerationState(GENERATION_STATES.PROCESSING);
    setActiveTab('history');
    timerRef.current = window.setTimeout(
      () => setGenerationState(GENERATION_STATES.SUCCESS),
      mockData.generation.processingDelayMs,
    );
  };

  useLayoutEffect(() => {
    const viewport = canvasViewportRef.current;
    if (!loaded || !viewport) {
      setCanvasViewportSize({ width: 0, height: 0 });
      return undefined;
    }
    const measure = () => {
      const nextSize = { width: viewport.clientWidth, height: viewport.clientHeight };
      setCanvasViewportSize((current) => current.width === nextSize.width && current.height === nextSize.height ? current : nextSize);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [loaded]);

  useLayoutEffect(() => {
    const canvas = targetCanvasRef.current;
    if (!loaded || !canvas) {
      setPositionBounds({ x: 0, y: 0 });
      return undefined;
    }
    const measure = () => {
      const nextBounds = boundsFor(canvas.clientWidth, canvas.clientHeight, sourceRatio, targetRatio);
      setPositionBounds((current) => current.x === nextBounds.x && current.y === nextBounds.y ? current : nextBounds);
      setPosition((current) => {
        const nextPosition = clampPosition(current, nextBounds, 'free');
        return current.x === nextPosition.x && current.y === nextPosition.y ? current : nextPosition;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [loaded, sourceRatio, targetRatio]);

  useLayoutEffect(() => {
    const frame = targetCanvasRef.current;
    const media = videoRef.current;
    if (!loaded || !frame || !media) {
      setIsContained(true);
      return;
    }
    setIsContained(fitsInsideFrame(frame.getBoundingClientRect(), media.getBoundingClientRect()));
  }, [loaded, position.x, position.y, ratio, sourceRatio]);

  const setClampedPosition = (nextX, nextY) =>
    setPosition(clampPosition({ x: nextX, y: nextY }, positionBounds, movement));

  const beginDrag = (event) => {
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: position };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    setClampedPosition(drag.origin.x + event.clientX - drag.x, drag.origin.y + event.clientY - drag.y);
  };
  const endDrag = () => { dragRef.current = null; };

  // The bundled sample is shorter than the selected segment, so playback maps the
  // sample's own duration onto the selected range instead of seeking past its end.
  const usesMockTimeline = (video) =>
    Number.isFinite(video.duration) && video.duration > 0 && video.duration < trimEnd;

  const playVideo = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (usesMockTimeline(video)) {
      if (video.ended || video.currentTime >= video.duration) video.currentTime = 0;
    } else if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
      video.currentTime = trimStart;
    }
    setIsPlaying(true);
    await video.play().catch(() => setIsPlaying(false));
  };
  const pauseVideo = () => videoRef.current?.pause();
  const seekPlayback = (nextTime) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = usesMockTimeline(video) && selectedDuration > 0
        ? ((nextTime - trimStart) / selectedDuration) * video.duration
        : nextTime;
    }
    setCurrentTime(nextTime);
  };

  const mediaSizing = sizingFor(sourceRatio, targetRatio);
  const featureName = t('header.items.product.video.expansion');

  const historyItems = [
    ...(generationState === GENERATION_STATES.PROCESSING ? [{ id: 'generated-processing', status: 'processing', testId: 'generation-processing-card', tags: [featureName], processingLabel: t('video.expansion.processing.label'), processingDescription: t('video.expansion.processing.desc') }] : []),
    ...(generationState === GENERATION_STATES.SUCCESS ? [{ id: 'generated-success', status: 'success', testId: 'generated-history-thumbnail', title: featureName, tags: [featureName], date: t('video.expansion.history.just.now'), videoUrl: sampleVideo, posterUrl: sampleThumbnail, primaryActionLabel: t('header.items.product.video.enhancer') }] : []),
    { id: 'existing-success', status: 'success', cardTestId: 'history-success-card', featureTagTestId: 'history-success-feature-tag', testId: 'history-success-thumbnail', title: featureName, tags: [featureName], date: '09-01 19:33', videoUrl: sampleVideo, posterUrl: sampleThumbnail, primaryActionLabel: t('header.items.product.video.enhancer') },
    { id: 'existing-failed', status: 'failed', title: featureName, tags: [featureName], date: '09-01 17:07', failureLabel: t('video.expansion.failure.title'), failureDescription: mockData.errors.generation, retryTestId: 'retry-failed-generation' },
  ];
  const nextActions = mockData.videoDetail.nextActions.map((action) => ({
    id: action.id,
    label: t(action.labelKey),
    testId: action.interactive ? 'next-action-video-expansion' : undefined,
    onSelect: action.interactive ? () => { setDetailOpen(false); loadSample(ENTRY_SOURCES.HISTORY_RESULT); } : undefined,
  }));

  return (
    <>
      <ResultPageShell title={featureName} showInfo={false} activeToolId="ai-video" creditBalance={mockData.credits.headerBalance} showCredits>
        <div className={styles.page} data-testid="video-expansion-page" data-tab={activeTab}>
          <ToolPageLayout
            panelContentClassName={styles.panelContent}
            panel={(
              <SettingsPanel
                t={t}
                ratios={mockData.ratios}
                loaded={loaded}
                sourceState={sourceState}
                sourceUrl={sourceSrc}
                thumbnailUrl={timelineFrames[0]}
                selectedDuration={selectedDuration}
                uploadErrorMessage={mockData.errors.upload}
                showHistoryBadge={entrySource === ENTRY_SOURCES.HISTORY_RESULT && loaded}
                ratio={ratio}
                fileInputRef={inputRef}
                onPick={() => inputRef.current?.click()}
                onRemove={removeSource}
                onTrim={() => { setTrimIsInitial(false); setTrimOpen(true); }}
                onFileChange={onFileChange}
                onRatioChange={(next) => { setRatio(next); setPosition({ x: 0, y: 0 }); }}
              />
            )}
            footer={(
              <GenerateActionBar
                label={t('video.object.remover.generate.button')}
                cost={mockData.credits.generateCost}
                disabled={!canGenerate({ sourceState, trimStart, trimEnd })}
                onClick={beginProcessing}
              />
            )}
            result={(
              <VideoResultsSurface
                activeTab={activeTab}
                onTabChange={setActiveTab}
                processing={generationState === GENERATION_STATES.PROCESSING}
                filterValue={historyFilter}
                filterOptions={[{ value: 'all', label: t('text.to.image.settings.styles.all') }, { value: 'video-expansion', label: featureName }]}
                onFilterChange={setHistoryFilter}
                editContent={(
                  <div className={styles.editResult} data-surface-zone="canvas-playback-timeline" data-component-role="video-playback-timeline">
                  <div className={loaded ? styles.canvasAreaLoaded : styles.canvasArea} data-testid={loaded ? 'video-canvas' : undefined} data-ratio={ratio} data-component-role="video-player canvas-drag-positioning" data-surface-zone="video-result">
                    {loaded ? (
                      <div className={styles.canvasWorkspace}>
                        <div ref={canvasViewportRef} className={styles.canvasViewport} data-testid="canvas-viewport" data-fixed-height="true">
                          <div ref={targetCanvasRef} className={styles.targetCanvas} data-testid="target-ratio-frame" data-frame-contained={targetFrameSize.width > 0 ? 'true' : 'false'} style={{ width: `${targetFrameSize.width}px`, height: `${targetFrameSize.height}px`, aspectRatio: ratio.replace(':', ' / '), visibility: targetFrameSize.width > 0 ? 'visible' : 'hidden' }} onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
                            <video ref={videoRef} className={styles.canvasVideo} data-testid="canvas-video" data-fit="contain" data-contained={isContained ? 'true' : 'false'} data-draggable="true" data-movement={movement} data-playing={isPlaying ? 'true' : 'false'} src={sourceSrc} muted playsInline preload="auto" loop={!sourceFile} style={{ ...mediaSizing, transform: `translate(${position.x}px, ${position.y}px)` }} onLoadedMetadata={(event) => { event.currentTarget.currentTime = event.currentTarget.duration < trimEnd ? 0 : trimStart; }} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onTimeUpdate={(event) => {
                              const video = event.currentTarget;
                              if (usesMockTimeline(video)) {
                                setCurrentTime(trimStart + (video.currentTime / video.duration) * selectedDuration);
                              } else if (video.currentTime >= trimEnd) {
                                video.currentTime = trimStart;
                                if (!video.paused) video.play().catch(() => {});
                                setCurrentTime(trimStart);
                              } else {
                                setCurrentTime(video.currentTime);
                              }
                            }} />
                          </div>
                        </div>
                        <VideoTimeline frameUrls={timelineFrames} frameStrategy="browser-capture-10" thumbnailCount={mockData.timeline.thumbnailCount} duration={duration} startTime={trimStart} endTime={trimEnd} currentTime={currentTime} isPlaying={isPlaying} onPlay={playVideo} onPause={pauseVideo} onSeek={seekPlayback} synchronized className={styles.derivedTimeline} />
                      </div>
                    ) : <EmptyResult error={sourceState === SOURCE_STATES.ERROR} onPick={() => inputRef.current?.click()} onSample={() => loadSample()} onRecover={() => setSourceState(SOURCE_STATES.EMPTY)} />}
                  </div>
                  </div>
                )}
                historyContent={<VideoHistory items={historyItems} onOpen={() => setDetailOpen(true)} onRetry={beginProcessing} />}
              />
            )}
          />
        </div>
      </ResultPageShell>
      <VideoInfoDialog opened={detailOpen} title={featureName} date={t('video.expansion.history.just.now')} videoUrl={sampleVideo} posterUrl={sampleThumbnail} sources={[{ id: 'source', url: sampleThumbnail, alt: t('video.detail.modal.original.source') }]} metadata={[{ label: t('image.to.video.settings.image.resolution'), value: '1920 × 1080' }, { label: t('video.detail.modal.video.length'), value: `${MAX_SELECTED_SECONDS}s` }]} nextActions={nextActions} onClose={() => setDetailOpen(false)} onRetry={() => { setDetailOpen(false); beginProcessing(); }} onLike={() => {}} onDislike={() => {}} onDownload={() => {}} />
      <VideoTrimModal opened={trimOpen} videoFile={sourceFile} videoUrl={sourceSrc} fallbackThumbnailUrl={sampleThumbnail} maximumSeconds={MAX_SELECTED_SECONDS} minimumSeconds={MIN_SELECTED_SECONDS} durationOverride={duration} labels={{ title: t('video.expansion.trim.title'), maxLength: t('video.expansion.trim.max.length', { seconds: MAX_SELECTED_SECONDS }), cancel: t('general.cancel'), confirm: t('ai.agent.trim.use.video') }} onCancel={closeTrim} onConfirm={confirmTrim} />
    </>
  );
}
