import { useState } from 'react';
import styles from './index.module.scss';
import Icon from './icon';
import { useDispatch, useSelector } from 'react-redux';
import { toggleVideoHistoryReaction } from '@/store/actions/taskAction';

const IconActionButtons = (props) => {
  const { videoId, actions, handlers, centered } = props;

  const dispatch = useDispatch();
  const reactionType = useSelector(
    (state) => state.task.videoHistoryDetailedData.reactions[videoId]
  );

  const handleClick = (id) => () => {
    if (id === 'like' || id === 'dislike') {
      dispatch(toggleVideoHistoryReaction(videoId, id));
    }

    if (handlers?.[id]) handlers[id]();
  };

  return (
    <div
      className={`${styles.actionButtons} ${centered ? styles.centered : ''}`}
    >
      {(actions || []).map(({ id, title }) => (
        <button
          key={id}
          className={styles.iconButton}
          onClick={handleClick(id)}
          aria-label={title}
        >
          <Icon
            name={id}
            active={(id === 'like' || id === 'dislike') && reactionType === id}
          />
          <span className={styles.tooltip}>{title}</span>
        </button>
      ))}
    </div>
  );
};

export default IconActionButtons;
