import styles from './index.module.scss';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import useCustomStyles from './hooks/use-custom-styles';
import useWindowDevice from '@/hooks/use-window-device';
import browserUtils from '@/utils/browserUtils';

export default forwardRef(function VideoPlayer(props, ref) {
  const {
    playing,
    setPlaying,
    handleVideoEnded,
    handleLeaveFullscreen,
    handleFallbackFullscreen = () => {},
    handleLoadedMetadataCallback = () => {},
    handleOpenDetailModal = () => {},
    showSoundIcon,
    muted,
    setMuted = () => {},
    thumbnail,
  } = props;
  const [loading, setLoading] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [showControls, setShowControls] = useState(false); // 讓android/ios最先看到wrapper, 點play後才顯示native control panel.

  // Use ref so the IntersectionObserver callback (created once with [] deps) can read current value
  const hasLoadedRef = useRef(false);
  const videoContainerRef = useRef(null);
  const videoRef = useRef(null);
  const hoverTimerRef = useRef(null); // Debounce timer for hover
  const controlsInteractionRef = useRef(false); // Track if controls were just interacted with
  const isFirstClickRef = useRef(true); // Track if this is the first click on mobile
  const clickTimeoutRef = useRef(null); // Timeout for delayed modal opening

  const { isDesktop, isMobileDevice, isMd } = useWindowDevice();
  const isIOS = browserUtils.isIOs();
  const isAndroid = browserUtils.isAndroid();

  const {
    setFullscreenHovered,
    setVideoHovered,
    setMutedHovered,
    playIconStyle,
    fullscreenIconStyle,
    mutedIconStyle,
  } = useCustomStyles();

  useImperativeHandle(ref, () => ({
    setVideoSrc: (objectUrl) => {
      if (!videoRef?.current) return;
      // Only load video if it's in view or close to viewport
      if (!isInView) {
        // Store the URL to be loaded when video enters viewport
        videoRef.current.dataset.pendingSrc = objectUrl;
        return;
      }
      // Stop playing before update new src
      hasLoadedRef.current = true;
      setPlaying(false);
      setLoading(true);
      const source = videoRef.current.querySelector('source');
      source.src = objectUrl;
      videoRef.current.load();
      // Store URL in dataset for potential reload when leaving/entering viewport
      videoRef.current.dataset.pendingSrc = objectUrl;
    },
    removeVideoSrc: () => {
      if (!videoRef?.current) return;
      const source = videoRef.current.querySelector('source');
      source.removeAttribute('src');
      videoRef.current.load();
    },
    resetCurrentTime: (time) => {
      if (!videoRef?.current) return;
      videoRef.current.currentTime = time;
    },
    getCurrentTime: () => {
      if (!videoRef?.current) {
        return 0;
      }
      return videoRef.current.currentTime;
    },
    updatePlaybackRate: (playbackRate) => {
      videoRef.current.playbackRate = playbackRate;
    },
    getPlaybackRate: () => {
      return videoRef.current.playbackRate;
    },
    getVideoDuration: () => {
      return videoRef.current.duration;
    },
    pauseVideo: () => {},
    getVideoCurrent: () => {
      return videoRef.current;
    },
  }));

  // Lazy loading with Intersection Observer
  // Once a video source is loaded, it is preserved so users can instantly replay
  // when scrolling back — the loaded frame also serves as a visual reminder.
  useEffect(() => {
    if (!videoContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            const pendingSrc = videoRef.current?.dataset?.pendingSrc;
            const source = videoRef.current?.querySelector('source');
            const alreadyLoaded =
              source?.src &&
              source.src !== '' &&
              source.src !== window.location.href;

            // Skip reload if the video source is already loaded (user scrolled back)
            if (alreadyLoaded) return;

            // Load pending video source if exists (first load)
            if (pendingSrc) {
              hasLoadedRef.current = true;
              setPlaying(false);
              if (!thumbnail) {
                setLoading(true);
              }
              // Remove and re-add controls to reset their state on mobile
              if (isMobileDevice || isIOS) {
                videoRef.current.removeAttribute('controls');
              }
              source.src = pendingSrc;
              videoRef.current.load();
              if (isMobileDevice || isIOS) {
                videoRef.current.setAttribute('controls', 'controls');
              }
            }
          } else {
            // Video left viewport — pause but keep source loaded
            setIsInView(false);
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
              setPlaying(false);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: isDesktop ? '400px' : '200px', // Start loading before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(videoContainerRef.current);

    const currentContainer = videoContainerRef.current;
    return () => {
      if (currentContainer) {
        observer.unobserve(currentContainer);
      }
    };
  }, []);

  // Cleanup hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  // align timeline of original/preview video when user leave fullscreen
  useEffect(() => {
    const _handleFullscreenChange = () => {
      const isFullscreen = browserUtils.isFullscreen();
      if (isFullscreen) return;
      handleLeaveFullscreen();
    };
    const video = videoRef.current;
    video.addEventListener('fullscreenchange', _handleFullscreenChange);
    return () => {
      video.removeEventListener('fullscreenchange', _handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    playOrPauseVideo();
  }, [playing]);

  const playOrPauseVideo = () => {
    if (playing && videoRef.current?.paused) {
      videoRef.current?.play?.();
    } else if (!playing && !videoRef.current?.paused) {
      videoRef.current?.pause?.();
    }
  };

  const onLoadedMetadata = (e) => {
    handleLoadedMetadataCallback();
  };

  const handleEnded = () => {
    setPlaying(false);
    handleVideoEnded();
  };

  useEffect(() => {
    if (!videoRef?.current) return;
    videoRef.current.muted = muted;
  }, [muted]);

  const handleWrapperClick = (e) => {
    // Only open modal if click is directly on wrapper, not on video or its controls
    if (e.target === videoContainerRef.current) {
      handleOpenDetailModal();
    }
  };

  const handleVideoClick = (e) => {
    // Prevent default to avoid triggering play/pause
    e.preventDefault();
    // Prevent clicks on video from bubbling to wrapper
    e.stopPropagation();

    const videoRect = videoRef.current.getBoundingClientRect();
    const clickY = e.clientY - videoRect.top;
    const clickX = e.clientX - videoRect.left;
    const videoHeight = videoRect.height;
    const videoWidth = videoRect.width;

    // Check if click is on the native video controls area (bottom portion)
    const controlsHeight = isMd ? 50 : 40;

    // If clicking on controls area (bottom), let native controls handle it
    if (clickY > videoHeight - controlsHeight) {
      return;
    }

    // If clicking on top-left controls area (iOS fullscreen button), let native controls handle it
    if (isIOS && clickY < controlsHeight && clickX < controlsHeight * 2) {
      return;
    }

    // On mobile/tablet, first click should always open modal (except centered play icon)
    if (isMobileDevice || isIOS) {
      // Check if clicking on centered play icon (approximate center area)
      const centerX = videoWidth / 2;
      const centerY = videoHeight / 2;
      const playIconRadius = 40; // Approximate clickable area around center
      const distanceFromCenter = Math.sqrt(
        Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2)
      );
      const isPlayIconClick = distanceFromCenter <= playIconRadius;
      isFirstClickRef.current = false;

      if (!isPlayIconClick) {
        handleOpenDetailModal();
        return;
      }
      // If play icon clicked, let it play and return
      return;
    }

    // On mobile/tablet/iOS, use delayed approach to check if controls interaction happened
    if (isMobileDevice || isIOS) {
      // Clear any existing timeout
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }

      // Store initial control interaction state
      const hadControlInteractionBefore = controlsInteractionRef.current;

      // Wait a short moment to see if control events fire
      clickTimeoutRef.current = setTimeout(() => {
        // If controls were interacted with (either before or during the wait), don't open modal
        if (controlsInteractionRef.current) {
          // Don't reset here - let the control interaction handler manage it
          return;
        }

        // Otherwise, open the modal
        handleOpenDetailModal();
      }, 150); // Increased to 150ms for better reliability

      return;
    }

    // Open the modal (desktop)
    handleOpenDetailModal();
  };

  const handleControlsInteraction = () => {
    // Mark that controls were just interacted with (for mobile/tablet/iOS)
    if (isMobileDevice || isIOS) {
      controlsInteractionRef.current = true;

      // Keep the flag true for a longer duration to ensure click handler sees it
      setTimeout(() => {
        controlsInteractionRef.current = false;
      }, 500); // Increased to 500ms for better reliability
    }
  };

  const handleMouseEnter = () => {
    if (isMobileDevice) return;

    // Clear any existing timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    // Set a 300ms debounce before playing
    hoverTimerRef.current = setTimeout(() => {
      setPlaying(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    // Clear the debounce timer if user leaves quickly
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    if (isMobileDevice) return;

    setPlaying(false);
  };

  const handleModalWrapperClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const wrapperRect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - wrapperRect.top;
    const clickX = e.clientX - wrapperRect.left;
    const wrapperHeight = wrapperRect.height;
    const wrapperWidth = wrapperRect.width;

    // Check if clicking on centered play icon area
    const centerX = wrapperWidth / 2;
    const centerY = wrapperHeight / 2;
    const playIconRadius = 40; // Approximate clickable area around center
    const distanceFromCenter = Math.sqrt(
      Math.pow(clickX - centerX, 2) + Math.pow(clickY - centerY, 2)
    );

    // If clicking on center play icon, toggle play/pause
    if (distanceFromCenter <= playIconRadius) {
      setPlaying(!playing);
      isFirstClickRef.current = false;
      return;
    }

    // Open modal for all other areas
    handleOpenDetailModal();
  };

  const handlePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setShowControls(true);
    isFirstClickRef.current = false;

    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div
      ref={videoContainerRef}
      className={`${styles.videoWrapper} ${
        loading && !thumbnail ? 'shimmer-skeleton-black' : ''
      }`}
      onClick={handleWrapperClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        className={styles.video}
        playsInline={true}
        muted={true}
        controls={isIOS && isFirstClickRef.current ? showControls : true}
        preload="none"
        poster={thumbnail || undefined}
        onClick={handleVideoClick}
        onPointerEnter={() => setVideoHovered(true)}
        onPointerLeave={() => setVideoHovered(false)}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => {
          handleControlsInteraction();
          setPlaying(true);
        }}
        onPause={() => {
          handleControlsInteraction();
          setPlaying(false);
        }}
        onVolumeChange={handleControlsInteraction}
        onSeeking={handleControlsInteraction}
        onRateChange={handleControlsInteraction}
        onCanPlay={() => {
          setLoading(false);
        }}
        loop={isDesktop ? true : false}
      >
        <source src="" type="video/mp4" />
      </video>
      {(isAndroid || (isIOS && isFirstClickRef.current)) && (
        <div
          className={`${styles.modalWrapper}`}
          onClick={handleModalWrapperClick}
          data-ios={isIOS && isFirstClickRef.current}
        />
      )}
    </div>
  );
});
