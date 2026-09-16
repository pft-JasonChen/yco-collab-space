import styles from './NewLabel.module.scss';
import { headerProducts, moduleTypes } from './adapters.jsx';

const SHOW_LIST = [
  // product
  headerProducts[moduleTypes.faceRetouch],
  headerProducts[moduleTypes.objRemoval],
  headerProducts[moduleTypes.hairColorChanger],
  headerProducts[moduleTypes.beardFilter],
  // use case
];

const API_SHOW_LIST = [
  headerProducts[moduleTypes.hairWavy],
  headerProducts[moduleTypes.skinAnalysis],
];

const NewLabel = ({ item, show = false, icon = null, isAPI = false }) => {
  const checkList = isAPI ? API_SHOW_LIST : SHOW_LIST;
  if (!show && !checkList.includes(item)) return;
  if (icon) {
    return (
      <img src={icon} className={styles.newLabelImg} loading="lazy" alt="" />
    );
  }
  return <div className={styles.newLabel}>NEW</div>;
};

export default NewLabel;

