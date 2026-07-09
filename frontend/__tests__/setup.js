import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.navigator = dom.window.navigator;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLButtonElement = dom.window.HTMLButtonElement;
globalThis.HTMLDivElement = dom.window.HTMLDivElement;
globalThis.HTMLSpanElement = dom.window.HTMLSpanElement;
globalThis.SVGElement = dom.window.SVGElement;
globalThis.Node = dom.window.Node;
globalThis.Element = dom.window.Element;
globalThis.Text = dom.window.Text;

// Required by React
globalThis.self = globalThis;
globalThis.window = dom.window;

// Cleanup
afterEach(() => {
  document.body.innerHTML = '';
});