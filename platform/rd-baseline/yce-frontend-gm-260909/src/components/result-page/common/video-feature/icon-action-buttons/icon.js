const ICON_FOLDER = '/assets/images/img2Vid/next-action/';

const Icon = ({ name, active } = {}) => {
  if (!name) return null;

  const isReaction = name === 'like' || name === 'dislike';
  const suffix = isReaction ? (active ? '-active' : '-default') : '';

  return (
    <img
      src={`${ICON_FOLDER}${name}${suffix}.svg`}
      alt=""
      width={16}
      height={16}
    />
  );
};

export default Icon;
