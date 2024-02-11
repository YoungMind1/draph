import React, { HTMLProps } from 'react';
import {
  cacheLocalPackage,
  sanitizePackageKeys,
} from '../../lib/ModuleCache.js';
import URLPlus from '../../lib/URLPlus.js';
import {
  PARAM_PACKAGES,
  PARAM_QUERY,
  UNNAMED_PACKAGE,
} from '../../lib/constants.js';
import { flash } from '../../lib/flash.js';
import useLocation from '../../lib/useLocation.js';
import './FileUploadControl.scss';

/**
 * @param {HTMLProps<HTMLLabelElement>} props 
 */
export default function FileUploadControl(props) {
  const [location, setLocation] = useLocation();

  /**
   * Handle file selection via input
   * @param {React.ChangeEvent<HTMLInputElement>} ev 
   */
  function onSelect(ev) {
    const file = ev.target.files?.item(0);
    if (file) {
      readFile(file);
    }

    // Reset field
    ev.target.value = '';
  }

  /**
   * Handle file drops
   * @param {React.DragEvent} ev 
   */
  function onDrop(ev) {
    /** @type {HTMLElement} */
    const target = ev.target;
    target.classList.remove('drag');
    ev.preventDefault();

    // If dropped items aren't files, reject them
    const dt = ev.dataTransfer;
    if (!dt.items)
      return alert('Sorry, file dropping is not supported by this browser');
    if (dt.items.length != 1) return alert('You must drop exactly one file');

    const item = dt.items[0];
    if (item.type && item.type != 'application/json')
      return alert('File must have a ".json" extension');

    const file = item.getAsFile();
    if (!file)
      return alert(
        'Please drop a file, not... well... whatever else it was you dropped',
      );

    readFile(file);
  }

  /**
   * @param {File} file
   */
  async function readFile(file) {
    const reader = new FileReader();

    /** @type {string} */
    const content = await new Promise(resolve => {
      reader.onload = () => resolve(reader.result);
      reader.readAsText(file);
    });

    /**
     * Parse module and insert into cache
     * @type {import('@npm/types').PackageJson}
     */
    let pkg;
    try {
      pkg = JSON.parse(content);
    } catch (err) {
      flash(`${file.name} is not a valid JSON file`);
      return;
    }

    // Sanitize package contents *immediately*, so we don't risk propagating
    // possibly-sensitive fields user may have in their package.json
    pkg = sanitizePackageKeys(pkg);

    pkg.name ??= UNNAMED_PACKAGE;

    const module = cacheLocalPackage(pkg);

    // Set query, and attach package contents in hash
    const url = new URLPlus(location);
    url.hash = '';
    url.setHashParam(PARAM_PACKAGES, JSON.stringify([pkg]));
    url.setSearchParam(PARAM_QUERY, module.key);
    setLocation(url, false);
  }

  /**
   * @param {React.DragEvent<HTMLElement>} ev 
   */
  function onDragOver(ev) {
    /** @type {HTMLElement}*/
    const target = ev.target;
    target.classList.add('drag');
    ev.preventDefault();
  }

  /**
   * @param {React.DragEvent<HTMLElement>} ev
   */
  function onDragLeave(ev) {
    /** @type {HTMLElement} */
    const currentTarget = ev.currentTarget;
    currentTarget.classList.remove('drag');
    ev.preventDefault();
  }

  return (
    <>
      <input
        id="package-input"
        type="file"
        hidden
        onChange={onSelect}
        accept=".json"
      />

      <label
        htmlFor="package-input"
        id="drop_target"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        {...props}
      >
        Alternatively, <button type="button">select</button> or drop a{' '}
        <code>package.json</code> file here
      </label>
    </>
  );
}
