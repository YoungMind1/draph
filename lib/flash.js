import './flash.scss';

/**
 * @param {unknown} wat
 */
export function flash(wat, bg = '#f80') {
  const SPACE = 10;

  /** @type {HTMLDivElement} */
  const graph = document.querySelector('#graph');
  /** @type {HTMLElement} */
  const prev = document.querySelector('.flash:last-of-type');
  const el = document.createElement('div');

  if (wat instanceof Error) {
    el.classList.add('error');
    el.innerText = wat.message;
  } else if (wat instanceof Document) {
    const body = wat.querySelector('body');
    if (body) {
      el.append(...body.children);
    }
  } else if (wat instanceof Element || wat instanceof DocumentFragment) {
    el.append(wat);
  } else if (typeof wat == 'string') {
    el.innerText = wat;
  } else {
    el.innerText = JSON.stringify(wat, null, 2);
  }

  document.body.appendChild(el);
  el.classList.add('flash');
  const prevBottom = prev ? prev.offsetTop + prev.offsetHeight : 0;

  const top =
    prevBottom < window.innerHeight - el.offsetHeight ? prevBottom : 0;
  el.style.top = `${top + SPACE / 2}px`;
  el.style.left = `${-el.offsetWidth - SPACE}px`;
  el.style.maxWidth = graph ? `${graph.offsetWidth - SPACE}px` : '100%';
  el.style.backgroundColor = bg;

  setTimeout(() => {
    el.style.left = `${SPACE}px`;

    setTimeout(() => {
      el.addEventListener('transitionend', () => el.remove());
      el.style.left = `${-el.offsetWidth - SPACE}px`;
    }, 5000);
  }, 0);
}
