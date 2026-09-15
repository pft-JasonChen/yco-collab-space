import { useEffect, useState } from 'react';

let subscribers = []; // 全部使用這個hook的元件都會訂閱這個陣列
let initialized = false;

function getSize() {
  return { width: window.innerWidth, height: window.innerHeight };
}
export default function useWindowWidth() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handler = () => {
      const newSize = getSize();
      subscribers.forEach((cb) => cb(newSize)); // 通知所有訂閱者 每一個使用這個hook的元件都會被通知
    };

    // 沒有initialized就要綁定 listener
    if (!initialized) {
      window.addEventListener('resize', handler);
      initialized = true;
    }

    subscribers.push(setSize);
    setSize(getSize()); // 初始化

    return () => {
      subscribers = subscribers.filter((cb) => cb !== setSize);
      // 最後一個使用這個hook的時候 並unmount listener的時候 要移除 listener
      if (subscribers.length === 0) {
        window.removeEventListener('resize', handler);
        initialized = false;
      }
    };
  }, []);

  return size;
}

