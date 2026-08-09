export interface CreateElementOptions {
    className?: string;
    text?: string;
    title?: string;
}

/**
 * Creates a DOM element without parsing HTML. `text` is always set via
 * `textContent`, so values are never interpreted as markup.
 */
export function createElement(
    tag: string,
    options: CreateElementOptions = {},
): HTMLElement {
    const el = document.createElement(tag);
    if (options.className) el.className = options.className;
    if (options.text !== undefined) el.textContent = options.text;
    if (options.title) el.setAttribute('title', options.title);
    return el;
}

export function createTextSpan(text: string): Text {
    return document.createTextNode(text);
}
