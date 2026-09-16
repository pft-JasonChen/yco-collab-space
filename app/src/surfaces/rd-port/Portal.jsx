import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Portal({ elementId = 'portal-root', children }) {
  const [mounted, setMounted] = useState(false);
  const [portalRoot, setPortalRoot] = useState(null);

  useEffect(() => {
    setPortalRoot(document.getElementById(elementId));
    setMounted(true);
  }, []);

  if (!mounted || !portalRoot) return null;

  return createPortal(children, portalRoot);
}

