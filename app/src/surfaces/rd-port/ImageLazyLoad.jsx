import styles from './ImageLazyLoad.module.scss';
import { useEffect, useState } from 'react';
import _range from 'lodash/range';
import _isArray from 'lodash/isArray';
import _every from 'lodash/every';

export default function ImageLazyLoad(props) {
  const {
    src,
    skeletonClass = '',
    imageClass = '',
    imageStyle = {},
    alwaysShowLoading,
    showLoadingSkeleton = true,
    transitionDisabled,
    onlyOneImage = false,
    onLoad,
    onError,
    alt = '',
    crossOrigin = 'anonymous',
    loading = 'lazy',
    imgRef = null,
    ignoreSrcCheck = false,
  } = props;
  const [srcSet, setSrcSet] = useState([null, null]);
  const [loaded, setLoaded] = useState([false, false]);
  const [errored, setErrored] = useState([false, false]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!ignoreSrcCheck && !src) return;
    if (onlyOneImage) {
      setImageLoaded(0, false);
      setImageErrored(0, false);
      setSrcSet([src]);
      setActiveIndex(0);
      return;
    }
    const nextIndex = (activeIndex + 1) % 2;
    const nextSrcSet = [...srcSet];
    setImageErrored(nextIndex, false);
    if (srcSet[nextIndex] !== src) {
      setImageLoaded(nextIndex, false);
    } else {
      setImageLoaded(nextIndex, true);
    }
    nextSrcSet[nextIndex] = src;
    setSrcSet(nextSrcSet);
    setActiveIndex(nextIndex);
  }, [src]);

  const setImageLoaded = (idx, loaded = true) => {
    setLoaded((ps) => {
      const nextLoaded = [...ps];
      nextLoaded[idx] = loaded;
      return nextLoaded;
    });
  };

  const setImageErrored = (idx, value = true) => {
    setErrored((ps) => {
      const next = [...ps];
      next[idx] = value;
      return next;
    });
  };

  const getImageClass = (idx) => {
    if (_isArray(imageClass)) {
      return imageClass[idx];
    } else {
      return imageClass;
    }
  };

  const getImageTransitionClass = (idx) => {
    if (activeIndex === idx && !alwaysShowLoading) {
      if (transitionDisabled && _every(loaded)) {
        return styles.fadeInWithoutTransition;
      } else {
        return styles.fadeIn;
      }
    } else {
      if (transitionDisabled && _every(loaded)) {
        return styles.fadeOutWithoutTransition;
      } else {
        return styles.fadeOut;
      }
    }
  };

  return (
    <>
      {_range(onlyOneImage ? 1 : 2).map(
        (idx) =>
          srcSet[idx] && (
            <img
              loading={loading}
              key={idx}
              ref={idx === activeIndex ? imgRef : null}
              className={`${getImageClass(idx)} ${
                styles.image
              } ${getImageTransitionClass(idx)}`}
              style={imageStyle}
              crossOrigin={crossOrigin || undefined}
              src={srcSet[idx]}
              onLoad={() => {
                setImageLoaded(idx);
                onLoad && onLoad();
              }}
              onError={() => {
                setImageErrored(idx, true);
                onError && onError(idx);
              }}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              alt={alt}
            />
          )
      )}
      {showLoadingSkeleton && (
        <div
          className={`${styles.skeleton} ${skeletonClass} ${
            (loaded[activeIndex] || (onError && errored[activeIndex])) &&
            !alwaysShowLoading
              ? styles.skeletonHidden
              : ''
          } shimmer-skeleton`}
        />
      )}
    </>
  );
}

