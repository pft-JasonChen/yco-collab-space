import PropTypes from 'prop-types';
import assetMap from './rd-assets.js';
import styles from './DeleteConfirmModal.module.scss';
import Modal from './Modal.jsx';
import ConfirmCancellationButton from './ConfirmCancellationButton.jsx';
import { getTranslationFunction } from './adapters.jsx';

/**
 * Single-item delete confirmation for a gallery item. Reuses the shared
 * delete-history copy + confirm/cancel buttons, but routes confirm straight to
 * the caller (single delete) instead of the multi-select redux flow — so it
 * never touches selection or edit mode.
 *
 * @param {object} props
 * @param {boolean} props.opened
 * @param {string} [props.descKey] i18n key for the body copy (video vs photo)
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 */
export default function DeleteConfirmModal({
  opened,
  descKey = 'message.dialog.desc.delete.history.video.singular',
  onConfirm,
  onCancel,
}) {
  const { t } = getTranslationFunction();

  return (
    <Modal
      opened={opened}
      handleClose={onCancel}
      showModalScaleTransition={true}
      modalClassName={styles.modal}
    >
      <div className={styles.title}>
        {t('message.dialog.title.delete.history')}
      </div>
      <div className={styles.desc}>{t(descKey)}</div>
      <ConfirmCancellationButton
        type="delete.history"
        modalType="delete.history"
        handleConfirmClick={onConfirm}
        handleCancelClick={onCancel}
      />
      <div
        className={styles.close}
        style={{ backgroundImage: `url("${assetMap['/assets/images/icon_close.svg']}")` }}
        onClick={onCancel}
      />
    </Modal>
  );
}

DeleteConfirmModal.propTypes = {
  opened: PropTypes.bool,
  descKey: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
