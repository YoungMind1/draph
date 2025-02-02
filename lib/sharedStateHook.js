import { useEffect, useState } from 'react';

/**
 * Factory function for creating React shared-state hooks.
 *
 * If you want to share some state across components and `props` propagation
 * or "Context" isn't cutting it, then this is probably what you're after.  A
 * simple, easy, way to share common state across any number of components.
 *
 * # Example
 *
 *   // In "app.js" (or wherever) create the hook, passing an initial value
 *   export const useFoo = sharedStateHook('hello');
 *
 *   // Import hook
 *   import {useFoo} from 'app.js';
 *
 *   function SomeComponent(props) {
 *     // Use hook as you would `useState()` (sans the initial value)
 *     const [foo, setFoo] = usefoo();
 *
 *     // `foo` is shared by all components that use this hook
 *     // `setFoo` sets `foo` for all components that use this hook
 *     ...
 *   }
 *
 * # ... but why not React Context?
 *
 * 1. The Provider / Consumer model doesn't easily accomodate components that both
 *    provide and consume.
 * 2. Contexts require coercing state into the React DOM, which isn't always
 *    convenient.
 * 3. Contexts push developers toward a model where the context is a single "catchall"
 *    Object that holds many, largely unrelated, properties.  This leads to components
 *    that depend on just one of the properties in a context, but that rerender when
 *    *any* property is changed.
 *
 * @param {any} initialValue
 * @returns {Function} React hook function
 */

/**
 * @template T
 * @param {T} initialValue 
 * @param {string=} name 
 * @returns {const}
 */
export default function sharedStateHook(
  initialValue,
  name, // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  /** @type {Set<(v: T) => void>} */
  const setters = new Set();
  /** @type {T} */
  let sharedValue = initialValue;
  /**
   * @param {T} value 
   */
  const notifySetters = (value) => {
    sharedValue = value;
    for (const setter of setters) setter(value);
  };

  /**
   * @returns {const}
   */
  const hook = function useSharedState() {
    /** @type {ReturnType<typeof useState<T>>} */
    const [val, setVal] = useState(sharedValue);

    useEffect(() => {
      setters.add(setVal);
      return () => void setters.delete(setVal);
    }, [val]);

    return [val, notifySetters];
  };

  return [hook, notifySetters];
}
