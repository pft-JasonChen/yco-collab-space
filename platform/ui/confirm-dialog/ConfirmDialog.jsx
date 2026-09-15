import { useId } from 'react';
import Modal from './Modal.jsx';
import Button from '../button/index.js';
import styles from './ConfirmDialog.module.scss';
import closeIcon from '../../../design-library/assets/icon/yco-home-gallery/images__icon_close.svg';

/**
 * Confirmation dialog, ported from RD's
 * my-gallery-page/tabs/gallery/components/delete-confirm-modal.
 *
 * RD's version hard-codes the delete-history copy and routes its buttons
 * through common/message-dialog's ConfirmCancellationButton, which branches over
 * four dialog types. Here the copy is props and the button pair is the already
 * catalogued `button` component, so a second confirmation does not need a fifth
 * branch in a shared file.
 *
 * The layout is RD's: a confirm pill, then a plain text cancel beneath it — not
 * two buttons side by side. Destructive confirmation deliberately gives the
 * cancel the lighter affordance.
 *
 * @param {object} props
 * @param {boolean} props.opened
 * @param {string} props.title
 * @param {React.ReactNode} props.description
 * @param {string} [props.confirmLabel]
 * @param {string} [props.cancelLabel]
 * @param {'destructive'|'brand'} [props.tone]  colour of the confirm action
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 * @param {string} [props.closeLabel]  accessible name for the corner close control
 */
export default function ConfirmDialog({
  opened,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'brand',
  onConfirm,
  onCancel,
  closeLabel = 'Close',
}) {
  const titleId = useId();

  return (
    <Modal
      opened={opened}
      handleClose={onCancel}
      showModalScaleTransition
      modalClassName={styles.modal}
      ariaLabelledBy={titleId}
    >
      <h2 className={styles.title} id={titleId}>
        {title}
      </h2>
      <div className={styles.desc}>{description}</div>
      <Button
        variant="primary"
        tone={tone}
        className={styles.confirmButton}
        onClick={onConfirm}
        data-testid="confirm-dialog-confirm"
      >
        {confirmLabel}
      </Button>
      <button
        type="button"
        className={styles.cancelButton}
        onClick={onCancel}
        data-testid="confirm-dialog-cancel"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        className={styles.close}
        onClick={onCancel}
        aria-label={closeLabel}
        data-testid="confirm-dialog-close"
      >
        <img src={closeIcon} alt="" />
      </button>
    </Modal>
  );
}

export { Modal };
