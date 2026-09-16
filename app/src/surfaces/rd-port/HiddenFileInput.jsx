import { useMemo } from 'react';
import { useRouter } from './adapters.jsx';
const validImageExtensions = ['.jpg','.jpeg','.png','.webp'];
const validVideoExtensions = ['.mp4','.webm'];
const videoModuleUrlFragments = ['video'];

export default function HiddenFileInput(props) {
  const {
    id = null,
    inputRef,
    handleInputFileChange = () => {},
    customAccept = null,
    multiple = false,
    onClick = () => {},
  } = props;
  const router = useRouter();

  const accept = useMemo(() => {
    if (customAccept) {
      return customAccept;
    }
    const isVideoUpload = videoModuleUrlFragments.some((frag) =>
      router.asPath.includes(frag)
    );
    return isVideoUpload
      ? validVideoExtensions.join(',')
      : validImageExtensions.join(',');
  }, [router.asPath, customAccept]);

  return (
    <input
      id={id}
      ref={inputRef}
      type="file"
      accept={accept}
      style={{ display: 'none' }}
      onChange={handleInputFileChange}
      multiple={multiple}
      onClick={onClick}
    />
  );
}

