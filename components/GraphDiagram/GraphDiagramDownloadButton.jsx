import React from 'react';
import $ from '../../lib/dom.js';
import { DownloadIcon } from '../Icons.jsx';
import { getDiagramElement } from './GraphDiagram.jsx';

import indexStyles from '../../index.scss';
import diagramStyles from './GraphDiagram.scss';

/**
 * @typedef {'svg' | 'png'} DownloadExtension
 */

export default function GraphDiagramDownloadButton() {
  return (
    <button
      onClick={() => download('svg')}
      title="download as SVG"
      style={{ marginLeft: '0.5em' }}
    >
      <DownloadIcon />
    </button>
  );
}

/**
 * @param {DownloadExtension} type
 */
function download(type) {
  switch (type) {
    case 'svg':
      downloadSvg();
      break;
    case 'png':
      downloadPng();
      break;
  }
}

function downloadPng() {
  const svg = getDiagramElement();

  if (!svg) return;

  const data = svg.outerHTML;
  const vb = svg.getAttribute('viewBox')?.split(' ');

  if (!vb) {
    console.error('No viewBox');
    return;
  }

  const canvas = $.create<HTMLCanvasElement>('canvas');
  canvas.width = parseInt(vb[2]);
  canvas.height = parseInt(vb[3]);
  /** @type {CanvasRenderingContext2D} */
  const ctx = canvas.getContext('2d');
  const DOMURL = window.URL || window.webkitURL;
  const img = new Image();
  const svgBlob = new Blob([data], { type: 'image/svg+xml' });
  const url = DOMURL.createObjectURL(svgBlob);

  img.onload = function () {
    ctx.drawImage(img, 0, 0);
    DOMURL.revokeObjectURL(url);
    const pngImg = canvas.toDataURL('image/png');
    generateLinkToDownload('png', pngImg);
  };
  img.src = url;
}

function downloadSvg() {
  /**
   * Get svg DOM (cloned, so we can tweak as needed for SVG export)
   * @type {SVGSVGElement | undefined}
   */
  const svg = getDiagramElement()?.cloneNode(true);
  if (!svg) return;

  // Add link(s) to font files
  document
    .querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    .forEach(link => {
      if (!link.href.includes('fonts.googleapis.com')) return;

      const fontEl = document.createElement('defs');
      fontEl.innerHTML = `<defs><style type="text/css">@import url('${link.href}');</style></defs>`;
      svg.insertBefore(fontEl, svg.firstChild);
    });

  // Inline app stylesheets (we can't just link to these since they change as the app changes)
  for (const styles of [indexStyles, diagramStyles]) {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    svg.appendChild(styleEl);
  }

  const svgData = svg.outerHTML;
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  generateLinkToDownload('svg', svgUrl);
}

/**
 * @param {DownloadExtension} extension
 * @param {string} link
 */
function generateLinkToDownload(extension, link) {
  const name = $('title').innerText.replace(/.*- /, '').replace(/\W+/g, '_');
  const downloadLink = $.create<HTMLAnchorElement>('a');
  downloadLink.href = link;
  downloadLink.download = `${name}_dependencies.${extension}`;
  downloadLink.click();
}
