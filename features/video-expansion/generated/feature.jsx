import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Ratio, { ratioTitleTypes, ratioTypes } from '../../../platform/ui/ratio/index.js';
import ResultPageShell from '../../../platform/ui/result-page-shell/index.js';
import ToolPageLayout from '../../../platform/ui/tool-page-layout/index.js';
import { GenerateActionBar } from '../../../platform/ui/credit-controls/index.js';
import UploadMediaBlock from '../../../platform/ui/upload-media-block/index.js';
import VideoHistory from '../../../platform/ui/video-history/index.js';
import VideoInfoDialog from '../../../platform/ui/video-info-dialog/index.js';
import VideoResultsSurface from '../../../platform/ui/video-results-surface/index.js';
import VideoTimeline from '../../../platform/ui/video-timeline/index.js';
import VideoTrimModal from '../../../platform/ui/video-trim-modal/index.js';
import mockData from '../product/mocks/video-expansion.json';
import sampleVideo from '../product/mock-assets/sample-video.mp4';
import sampleThumbnail from '../product/mock-assets/sample image.jpg';
import { extractVideoFrames } from './extract-video-frames.js';
import styles from './feature.module.scss';

export const featureMeta = { slug: 'video-expansion', title: 'Video Expansion', stage: 'pm-draft', readiness: 'working' };

const ratioValues = { '16:9': 16 / 9, '9:16': 9 / 16, '4:3': 4 / 3, '3:4': 3 / 4, '1:1': 1 };
const ratioPadding = { '1:1': '7px', '3:4': '7px 9.5px', '4:3': '9.5px 7px', '9:16': '7px 11.375px', '16:9': '11.375px 7px' };
const ratioOptions = mockData.ratios.map((option) => {
  const [w, h] = option.label.split(':').map(Number);
  return { ...option, w, h, padding: ratioPadding[option.label] };
});

function ratioTestId(option) {
  if (option.id === '16-9') return 'ratio-16-9';
  if (option.id === '9-16') return 'ratio-9-16';
  if (option.id === '3-4') return 'ratio-3-4';
  return undefined;
}

function Icon({ name, size = 16 }) {
  const paths = {
    play: <path d="M5 3.5v9l7-4.5-7-4.5Z" fill="currentColor" />,
    pause: <><path d="M4 3h3v10H4z" fill="currentColor" /><path d="M9 3h3v10H9z" fill="currentColor" /></>,
    upload: <><path d="M8 11V3m0 0L5 6m3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><path d="M3 10v3h10v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></>,
    trim: <><path d="m4 3 8 8M12 3 4 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="3.5" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2" /><circle cx="12.5" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.2" /></>,
    video: <><rect x="2.5" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="m10.5 7 3-1.5v5l-3-1.5" stroke="currentColor" strokeWidth="1.4" /></>,
    warning: <><path d="M8 2.5 14 13H2L8 2.5Z" stroke="currentColor" strokeWidth="1.4" /><path d="M8 6v3.2M8 11.2v.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
  };
  return <svg className={styles.icon} width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">{paths[name] ?? paths.video}</svg>;
}

function UploadSection({ loaded, sourceSrc, thumbnailUrl, selectedDuration, onPick, onRemove, onTrim, inputRef, onFileChange }) {
  return (
    <section className={styles.settingsSection}>
      <h2 className={styles.sectionTitle}>Video</h2>
      <div data-testid="video-upload-entry" data-component-role="uploaded-media media-upload" data-surface-zone="video-input">
        <UploadMediaBlock
          imageUrl={loaded ? thumbnailUrl : undefined}
          videoUrl={loaded ? sourceSrc : undefined}
          videoDuration={loaded ? selectedDuration : undefined}
          onUpload={onPick}
          onRemove={loaded ? onRemove : undefined}
          onReplace={loaded ? onPick : undefined}
          actionSlot={loaded ? <button className={styles.trimMediaAction} data-testid="open-trim-dialog" type="button" onClick={onTrim} aria-label="Trim video"><Icon name="trim" /></button> : null}
        />
      </div>
      <input ref={inputRef} className={styles.fileInput} data-testid="video-file-input" type="file" accept="video/mp4,video/quicktime,video/webm" onChange={onFileChange} />
    </section>
  );
}

function RatioSelector({ value, onChange, disabled }) {
  const [w, h] = value.split(':').map(Number);
  return <section className={styles.settingsSection} data-component-role="aspect-ratio-selector"><Ratio ratioList={ratioOptions} ratio={{ w, h }} setRatio={(next) => onChange(`${next.w}:${next.h}`)} title="Aspect ratio" variant={ratioTypes.IMAGE_EXTENDER} titleVariant={ratioTitleTypes.GERY} disabled={disabled} getOptionTestId={ratioTestId} optionLabelTestId="ratio-option" /></section>;
}

function EmptyResult({ error, onPick, onSample, onRecover }) {
  return (
    <div className={styles.emptyResult} data-component-role="error-recovery">
      <div className={error ? styles.emptyVideoIconError : styles.emptyVideoIcon}><Icon name={error ? 'warning' : 'video'} size={42} /></div>
      <h1>{error ? 'This video can’t be opened' : 'Expand your video canvas'}</h1>
      <p>{error ? mockData.errors.upload : 'Upload a video, select up to 30 seconds, then choose a new aspect ratio.'}</p>
      <button className={styles.emptyUploadButton} data-testid={error ? 'choose-another-video' : undefined} type="button" onClick={error ? onRecover : onPick}><Icon name="upload" size={20} />{error ? 'Choose another video' : 'Upload video'}</button>
      {!error ? <div className={styles.sampleArea}><span>Or try the sample video</span><button data-testid="load-sample-video" data-component-role="trim-control" type="button" onClick={onSample}><img src={sampleThumbnail} alt="Load sample video" /></button></div> : null}
    </div>
  );
}

export default function VideoExpansionFeature() {
  const [activeTab, setActiveTab] = useState('edit');
  const [sourceState, setSourceState] = useState('empty');
  const [sourceSrc, setSourceSrc] = useState(sampleVideo);
  const [sourceFile, setSourceFile] = useState(null);
  const [sourceRatio, setSourceRatio] = useState(3 / 4);
  const [entrySource, setEntrySource] = useState('local-upload');
  const [duration, setDuration] = useState(mockData.sourceVideo.mockDurationSeconds);
  const [trimStart, setTrimStart] = useState(mockData.sourceVideo.trimStartSeconds);
  const [trimEnd, setTrimEnd] = useState(mockData.sourceVideo.trimEndSeconds);
  const [ratio, setRatio] = useState('16:9');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [positionBounds, setPositionBounds] = useState({ x: 0, y: 0 });
  const [canvasViewportSize, setCanvasViewportSize] = useState({ width: 0, height: 0 });
  const [isContained, setIsContained] = useState(true);
  const [currentTime, setCurrentTime] = useState(mockData.sourceVideo.trimStartSeconds);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineFrames, setTimelineFrames] = useState([]);
  const [trimOpen, setTrimOpen] = useState(false);
  const [trimIsInitial, setTrimIsInitial] = useState(false);
  const [generationState, setGenerationState] = useState('idle');
  const [detailOpen, setDetailOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasViewportRef = useRef(null);
  const targetCanvasRef = useRef(null);
  const objectUrlRef = useRef(null);
  const timerRef = useRef(null);
  const dragRef = useRef(null);

  const loaded = sourceState === 'loaded';
  const targetRatio = ratioValues[ratio];
  const selectedDuration = Math.max(0, trimEnd - trimStart);
  const movement = useMemo(() => {
    if (Math.abs(sourceRatio - targetRatio) < 0.015) return 'free';
    return sourceRatio < targetRatio ? 'horizontal' : 'vertical';
  }, [sourceRatio, targetRatio]);
  const targetFrameSize = useMemo(() => {
    const availableWidth = Math.max(0, canvasViewportSize.width - 32);
    const availableHeight = Math.max(0, canvasViewportSize.height - 32);
    if (!availableWidth || !availableHeight) return { width: 0, height: 0 };
    if (availableWidth / availableHeight > targetRatio) {
      return { width: Math.floor(availableHeight * targetRatio), height: Math.floor(availableHeight) };
    }
    return { width: Math.floor(availableWidth), height: Math.floor(availableWidth / targetRatio) };
  }, [canvasViewportSize, targetRatio]);

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
    setRatio('16:9');
    setPosition({ x: 0, y: 0 });
    setIsPlaying(false);
  };

  const loadSample = (source = 'local-upload') => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    const fromHistory = source === 'history-result';
    setSourceState('loaded');
    setSourceSrc(sampleVideo);
    setSourceFile(null);
    setSourceRatio(3 / 4);
    setDuration(fromHistory ? 30 : mockData.sourceVideo.mockDurationSeconds);
    setTrimStart(fromHistory ? 0 : mockData.sourceVideo.trimStartSeconds);
    setTrimEnd(fromHistory ? 30 : mockData.sourceVideo.trimEndSeconds);
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
      const nextDuration = Number.isFinite(probe.duration) ? Math.max(1, Math.floor(probe.duration)) : 30;
      setDuration(nextDuration);
      setTrimStart(0);
      setTrimEnd(Math.min(30, nextDuration));
      setCurrentTime(0);
      if (probe.videoWidth && probe.videoHeight) setSourceRatio(probe.videoWidth / probe.videoHeight);
      if (nextDuration > 30) {
        setTrimIsInitial(true);
        setTrimOpen(true);
      }
      probe.removeAttribute('src');
      probe.load();
    };
    probe.src = objectUrl;
    setSourceState('loaded');
    setSourceSrc(objectUrl);
    setSourceFile(file);
    setEntrySource('local-upload');
    resetEditor();
    setActiveTab('edit');
  };

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setSourceState('error');
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
    setSourceState('empty');
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

  const beginProcessing = () => {
    window.clearTimeout(timerRef.current);
    videoRef.current?.pause();
    setIsPlaying(false);
    setGenerationState('processing');
    setActiveTab('history');
    timerRef.current = window.setTimeout(() => setGenerationState('success'), mockData.generation.processingDelayMs);
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
      const frameWidth = canvas.clientWidth;
      const frameHeight = canvas.clientHeight;
      const nextBounds = sourceRatio < targetRatio
        ? { x: Math.max(0, (frameWidth - frameHeight * sourceRatio) / 2), y: 0 }
        : sourceRatio > targetRatio
          ? { x: 0, y: Math.max(0, (frameHeight - frameWidth / sourceRatio) / 2) }
          : { x: 0, y: 0 };
      setPositionBounds((current) => current.x === nextBounds.x && current.y === nextBounds.y ? current : nextBounds);
      setPosition((current) => {
        const nextPosition = { x: Math.max(-nextBounds.x, Math.min(nextBounds.x, current.x)), y: Math.max(-nextBounds.y, Math.min(nextBounds.y, current.y)) };
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
    const frameRect = frame.getBoundingClientRect();
    const mediaRect = media.getBoundingClientRect();
    const tolerance = 1;
    setIsContained(mediaRect.left >= frameRect.left - tolerance && mediaRect.top >= frameRect.top - tolerance && mediaRect.right <= frameRect.right + tolerance && mediaRect.bottom <= frameRect.bottom + tolerance);
  }, [loaded, position.x, position.y, ratio, sourceRatio]);

  const setClampedPosition = (nextX, nextY) => setPosition({
    x: movement === 'vertical' ? 0 : Math.max(-positionBounds.x, Math.min(positionBounds.x, nextX)),
    y: movement === 'horizontal' ? 0 : Math.max(-positionBounds.y, Math.min(positionBounds.y, nextY)),
  });

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

  const playVideo = async () => {
    const video = videoRef.current;
    if (!video) return;
    const usesMockTimeline = Number.isFinite(video.duration) && video.duration > 0 && video.duration < trimEnd;
    if (usesMockTimeline) {
      if (video.ended || video.currentTime >= video.duration) video.currentTime = 0;
    } else if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
      video.currentTime = trimStart;
    }
    setIsPlaying(true);
    await video.play().catch(() => setIsPlaying(false));
  };
  const pauseVideo = () => videoRef.current?.pause();
  const seekPlayback = (nextTime) => {
    if (videoRef.current) {
      const video = videoRef.current;
      const selectedRange = Math.max(0, trimEnd - trimStart);
      const usesMockTimeline = Number.isFinite(video.duration) && video.duration > 0 && video.duration < trimEnd;
      video.currentTime = usesMockTimeline && selectedRange > 0
        ? ((nextTime - trimStart) / selectedRange) * video.duration
        : nextTime;
    }
    setCurrentTime(nextTime);
  };

  const mediaSizing = sourceRatio < targetRatio
    ? { height: '100%', width: 'auto', maxWidth: '100%' }
    : sourceRatio > targetRatio
      ? { width: '100%', height: 'auto', maxHeight: '100%' }
      : { width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' };

  const historyItems = [
    ...(generationState === 'processing' ? [{ id: 'generated-processing', status: 'processing', testId: 'generation-processing-card', tags: ['Video Expansion'], processingDescription: 'Expanding the selected frame…' }] : []),
    ...(generationState === 'success' ? [{ id: 'generated-success', status: 'success', testId: 'generated-history-thumbnail', title: 'Video Expansion', tags: ['Video Expansion'], date: 'Just now', videoUrl: sampleVideo, posterUrl: sampleThumbnail, primaryActionLabel: 'Video Enhancer' }] : []),
    { id: 'existing-success', status: 'success', cardTestId: 'history-success-card', featureTagTestId: 'history-success-feature-tag', testId: 'history-success-thumbnail', title: 'Video Expansion', tags: ['Video Expansion'], date: '09-01 19:33', videoUrl: sampleVideo, posterUrl: sampleThumbnail, primaryActionLabel: 'Video Enhancer' },
    { id: 'existing-failed', status: 'failed', title: 'Video Expansion', tags: ['Video Expansion'], date: '09-01 17:07', failureLabel: 'Video expansion failed', failureDescription: mockData.errors.generation, retryTestId: 'retry-failed-generation' },
  ];
  const nextActions = mockData.videoDetail.nextActions.map((action) => ({ id: action.id, label: action.label, testId: action.interactive ? 'next-action-video-expansion' : undefined, onSelect: action.interactive ? () => { setDetailOpen(false); loadSample('history-result'); } : undefined }));

  return (
    <>
      <ResultPageShell title="Video Expansion" showInfo={false} activeToolId="ai-video" creditBalance={mockData.credits.headerBalance} showCredits>
        <div className={styles.page} data-testid="video-expansion-page" data-tab={activeTab}>
          <ToolPageLayout
            panelContentClassName={styles.panelContent}
            panel={(
              <>
                <UploadSection loaded={loaded} sourceSrc={sourceSrc} thumbnailUrl={timelineFrames[0]} selectedDuration={selectedDuration} onPick={() => inputRef.current?.click()} onRemove={removeSource} onTrim={() => { setTrimIsInitial(false); setTrimOpen(true); }} inputRef={inputRef} onFileChange={onFileChange} />
                {sourceState === 'error' ? <div className={styles.inlineError} data-testid="upload-error" data-component-role="error-recovery" role="alert"><Icon name="warning" /><span>{mockData.errors.upload}</span></div> : null}
                {entrySource === 'history-result' && loaded ? <div className={styles.historySourceBadge} data-testid="history-source-badge">Loaded from History</div> : null}
                <RatioSelector value={ratio} onChange={(next) => { setRatio(next); setPosition({ x: 0, y: 0 }); }} disabled={!loaded} />
              </>
            )}
            footer={<GenerateActionBar label="Generate" cost={mockData.credits.generateCost} disabled={!loaded} onClick={beginProcessing} />}
            result={(
              <VideoResultsSurface
                activeTab={activeTab}
                onTabChange={setActiveTab}
                processing={generationState === 'processing'}
                filterValue={historyFilter}
                filterOptions={[{ value: 'all', label: 'All' }, { value: 'video-expansion', label: 'Video Expansion' }]}
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
                              const selectedRange = Math.max(0, trimEnd - trimStart);
                              const usesMockTimeline = Number.isFinite(video.duration) && video.duration > 0 && video.duration < trimEnd;
                              if (usesMockTimeline) {
                                setCurrentTime(trimStart + (video.currentTime / video.duration) * selectedRange);
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
                    ) : <EmptyResult error={sourceState === 'error'} onPick={() => inputRef.current?.click()} onSample={() => loadSample()} onRecover={() => setSourceState('empty')} />}
                  </div>
                  </div>
                )}
                historyContent={<VideoHistory items={historyItems} onOpen={() => setDetailOpen(true)} onRetry={beginProcessing} />}
              />
            )}
          />
        </div>
      </ResultPageShell>
      <VideoInfoDialog opened={detailOpen} title="Video Expansion" date="Just now" videoUrl={sampleVideo} posterUrl={sampleThumbnail} sources={[{ id: 'source', url: sampleThumbnail, alt: 'Original source' }]} metadata={[{ label: 'Resolution', value: '1920 × 1080' }, { label: 'Video Length', value: '30s' }]} nextActions={nextActions} onClose={() => setDetailOpen(false)} onRetry={() => { setDetailOpen(false); beginProcessing(); }} onLike={() => {}} onDislike={() => {}} onDownload={() => {}} />
      <VideoTrimModal opened={trimOpen} videoFile={sourceFile} videoUrl={sourceSrc} fallbackThumbnailUrl={sampleThumbnail} maximumSeconds={30} minimumSeconds={1} durationOverride={duration} labels={{ title: 'Trim video', maxLength: 'Select up to 30 seconds', cancel: 'Cancel', confirm: 'Use Video' }} onCancel={closeTrim} onConfirm={confirmTrim} />
    </>
  );
}
