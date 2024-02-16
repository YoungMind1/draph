import { useEffect, useRef, useState } from 'react';

/**
 * @template {Element} T
 * @returns {const}
 */
export default function useMeasure() {
  /** @type {ReturnType<typeof useRef<T>} */
  const ref = useRef(null);

  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });
  const target = ref.current;

  useEffect(() => {
    setSize({
      width: ref.current?.clientWidth ?? 0,
      height: ref.current?.clientHeight ?? 0,
    });

    // if (!target) return;

    // const observer = new ResizeObserver(entries => {
    //   const entry = entries[0];
    //   if (!entry) return;
    //   const { inlineSize: width, blockSize: height } = entry.borderBoxSize[0];

    //   setSize({ width, height });
    // });

    // observer.observe(target);

    // return () => observer.unobserve(target);
  }, [target]);

  return [ref, size];
}
