import characterMotionSwapIcon from '../../../design-library/assets/icon/yco-video-actions/character-motion-swap.svg';
import dislikeActiveIcon from '../../../design-library/assets/icon/yco-video-actions/dislike-active.svg';
import dislikeDefaultIcon from '../../../design-library/assets/icon/yco-video-actions/dislike-default.svg';
import downloadIcon from '../../../design-library/assets/icon/yco-video-actions/download.svg';
import editIcon from '../../../design-library/assets/icon/yco-video-actions/edit.svg';
import faceSwapIcon from '../../../design-library/assets/icon/yco-video-actions/face-swap.svg';
import likeActiveIcon from '../../../design-library/assets/icon/yco-video-actions/like-active.svg';
import likeDefaultIcon from '../../../design-library/assets/icon/yco-video-actions/like-default.svg';
import objectRemovalIcon from '../../../design-library/assets/icon/yco-video-actions/object-removal.svg';
import styleTransferIcon from '../../../design-library/assets/icon/yco-video-actions/style-transfer.svg';
import videoEditorIcon from '../../../design-library/assets/icon/yco-video-actions/video-editor.svg';
import videoEnhancerIcon from '../../../design-library/assets/icon/yco-video-actions/video-enhancer.svg';
import videoExpansionIcon from '../../../design-library/assets/icon/yco-video-actions/video-expansion.svg';

/**
 * RD resolves these from a public folder by `${name}${suffix}.svg`; bundled prototypes
 * resolve the same allowlisted names through the Design Library collection instead.
 */
const icons = {
  like: likeDefaultIcon,
  'like-active': likeActiveIcon,
  dislike: dislikeDefaultIcon,
  'dislike-active': dislikeActiveIcon,
  edit: editIcon,
  download: downloadIcon,
  'video-enhancer': videoEnhancerIcon,
  enhancer: videoEnhancerIcon,
  'face-swap': faceSwapIcon,
  'style-transfer': styleTransferIcon,
  'object-removal': objectRemovalIcon,
  'video-editor': videoEditorIcon,
  'character-motion-swap': characterMotionSwapIcon,
  'video-expansion': videoExpansionIcon,
  expansion: videoExpansionIcon,
};

export const reactionIds = ['like', 'dislike'];

export function isReactionId(id) {
  return reactionIds.includes(id);
}

export default function ActionIcon({ name, active = false, className = '', size = 16 }) {
  if (!name) return null;
  const key = isReactionId(name) && active ? `${name}-active` : name;
  const source = icons[key] ?? icons[name];
  if (!source) return null;
  return <img className={className} src={source} alt="" aria-hidden="true" width={size} height={size} />;
}

export { icons as actionIcons };
