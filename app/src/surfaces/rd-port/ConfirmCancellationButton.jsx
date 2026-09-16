import styles from './ConfirmCancellationButton.module.scss';
import { useMemo } from 'react';
import { getTranslationFunction } from './adapters.jsx';
import ButtonWrapper from './ButtonWrapper.jsx';
import { hoverClassMap, touchClassMap } from './adapters.jsx';

export default function ConfirmCancellationButton(props) {
  const { type, handleConfirmClick, handleCancelClick, modalType } = props;
  const { t } = getTranslationFunction();

  const isDeleteAccount = useMemo(() => type === 'delete.account', [type]);

  const isDeleteApiKey = useMemo(() => type === 'delete.apikey', [type]);

  if (isDeleteAccount) {
    return (
      <div className={styles.flex}>
        <ButtonWrapper
          className={styles.cancelButton4DeleteAccount}
          hoverClass="hover-with-border-46e4fa"
          touchClass="touch-with-border-46e4fa"
          onClick={handleCancelClick}
        >
          {t(`message.dialog.button.cancel.delete.history`)}
        </ButtonWrapper>
        <ButtonWrapper
          className={styles.confirmButton4DeleteAccount}
          hoverClass="hover-with-border-46e4fa"
          touchClass="touch-with-border-46e4fa"
          onClick={handleConfirmClick}
        >
          {t(`message.dialog.button.confirm.delete.history`)}
        </ButtonWrapper>
      </div>
    );
  } else if (isDeleteApiKey) {
    return (
      <div className={styles.twoButtonRowContainer}>
        <ButtonWrapper
          className={styles.leftButton}
          hoverClass="hover-with-border-46e4fa"
          touchClass="touch-with-border-46e4fa"
          onClick={handleConfirmClick}
        >
          {t(`general.confirm`)}
        </ButtonWrapper>
        <ButtonWrapper
          className={styles.rightButton}
          hoverClass="hover-with-border-46e4fa"
          touchClass="touch-with-border-46e4fa"
          onClick={handleCancelClick}
        >
          {t(`message.dialog.button.cancel.delete.history`)}
        </ButtonWrapper>
      </div>
    );
  } else {
    return (
      <>
        <ButtonWrapper
          className={styles.confirmButton}
          hoverClass={hoverClassMap.hover46e4fa}
          touchClass={touchClassMap.hover46e4fa}
          onClick={handleConfirmClick}
        >
          {t(`message.dialog.button.confirm.${modalType}`)}
        </ButtonWrapper>
        <div className={styles.cancelButton} onClick={handleCancelClick}>
          {t(`message.dialog.button.cancel.${modalType}`)}
        </div>
      </>
    );
  }
}

