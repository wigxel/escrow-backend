/**
 * Class representing the content of a mailable message
 */
export class Content {
  /**
   * The view that should be rendered for the mailable
   */
  private _html: string | null;

  /**
   * The view that represents the text version of the message
   */
  private _text: string | null;

  /**
   * The view that represents the Markdown version of the message
   */
  public _markdown: string | null;

  /**
   * The message's view data
   */
  public _with: Record<string, unknown>;

  /**
   * Create a new content definition
   */
  constructor(
    params: Partial<{
      html: string | null;
      text: string | null;
      markdown: string | null;
      withData: Record<string, unknown>;
    }>,
  ) {
    this._html = params.html ?? null;
    this._text = params.text ?? null;
    this._markdown = params.markdown ?? null;
    this._with = params.withData ?? {};
  }

  /**
   * Set the view for the message
   * @param view - The view name
   */
  public html(view: string): this {
    this._html = view;

    return this;
  }

  /**
   * Set the plain text view for the message
   * @param view - The view name
   */
  public text(view: string): this {
    this._text = view;
    return this;
  }

  /**
   * Set the Markdown view for the message
   * @param view - The view name
   */
  public markdown(view: string): this {
    this._markdown = view;
    return this;
  }

  /**
   * Add a piece of view data to the message
   * @param key - The key or an object containing multiple key-value pairs
   * @param value - The value (optional when key is an object)
   */
  public with(key: string | Record<string, unknown>, value?: unknown): this {
    if (typeof key === "object") {
      this._with = { ...this._with, ...key };
    } else {
      this._with[key] = value;
    }
    return this;
  }

  /**
   * Get the HTML view
   */
  public getHtml(): string | null {
    return this._html;
  }

  /**
   * Get the text view
   */
  public getText(): string | null {
    return this._text;
  }

  /**
   * Get the markdown view
   */
  public getMarkdown(): string | null {
    return this._markdown;
  }

  /**
   * Get the view data
   */
  public getWith(): Record<string, unknown> {
    return { ...this._with };
  }
}
