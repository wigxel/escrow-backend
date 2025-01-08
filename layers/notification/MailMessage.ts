import { Address } from "~/layers/mailing/mailables/Envelope";
import { SimpleMessage } from "~/layers/notification/SimpleMessage";

type ViewData = {
  html: string;
  text: string;
};

/**
 * Mail message structure for Notifiables
 * ```ts
 * const mailMessage = new MailMessage();
 * return mailMessage
 *   .from("info@gmail.com")
 *   .subject("Job opportunity")
 *   .line("Hi Robert,")
 *   .view("We have an opening for <i>you</i>")
 *   .footer("How are you doing")
 * ```
 */
export class MailMessage extends SimpleMessage {
  /**
   * The view to be rendered.
   *
   */
  public $view: ViewData | string = { html: undefined, text: undefined };

  /**
   * The view data for the message.
   *
   */
  public $viewData: Record<string, unknown> = {};

  /**
   * The Markdown template to render (if applicable).
   *
   */
  public $markdown: string | null = "notifications::email";

  /**
   * The current theme being used when generating emails.
   *
   */
  public $theme: string | null;

  /**
   * The "from" information for the message.
   *
   */
  public $from: Address | null;

  /**
   * The "reply to" information for the message.
   *
   */
  public $replyTo: unknown[] = [];

  /**
   * The "cc" information for the message.
   *
   */
  public $cc: unknown[] = [];

  /**
   * The "bcc" information for the message.
   *
   */
  public $bcc: unknown[] = [];

  /**
   * The attachments for the message.
   *
   */
  public $attachments: unknown[] = [];

  /**
   * The raw attachments for the message.
   *
   */
  public $rawAttachments: unknown[] = [];

  /**
   * The tags for the message.
   *
   */
  public $tags: unknown[] = [];

  /**
   * The metadata for the message.
   *
   */
  public $metadata: Record<string, unknown> = {};

  /**
   * Priority level of the message.
   *
   */
  public $priority: number;

  /**
   * The callbacks for the message.
   *
   */
  public $callbacks: unknown[] = [];

  /**
   * Set the view for the mail message.
   *
   * @param {string | ViewData} view
   * @param {object} data
   * @returns {MailMessage}
   */
  public view(
    view: string | ViewData,
    data: Record<string, unknown> = {},
  ): this {
    this.$view = view;
    this.$viewData = data;

    this.$markdown = null;

    return this;
  }

  /**
   * Set the HTML String for the mail message.
   */
  public html(htmlString: string, data: Record<string, unknown> = {}): this {
    return this.view(
      {
        text: typeof this.$view === "object" ? this.$view.text : this.$view,
        html: htmlString,
      },
      data,
    );
  }

  /**
   * Set the plain text view for the mail message.
   *
   * @param {string} textView
   * @param {object} data
   * @returns {MailMessage}
   */
  public text(textView: string, data: Record<string, unknown> = {}): this {
    return this.view(
      {
        html: typeof this.$view === "object" ? this.$view.html : this.$view,
        text: textView,
      },
      data,
    );
  }

  /**
   * Set the Markdown template for the notification.
   *
   * @param {string} view
   * @param {object} data
   * @returns {MailMessage}
   */
  public markdown(view: string, data: Record<string, unknown> = {}): this {
    this.$markdown = view;
    this.$viewData = data;

    this.view = null;

    return this;
  }

  /**
   * Set the default markdown template.
   *
   * @param {string} template
   * @returns {MailMessage}
   */
  public template(template: string): this {
    this.$markdown = template;
    return this;
  }

  /**
   * Set the theme to use with the Markdown template.
   *
   * @param {string} theme
   * @returns {MailMessage}
   */
  public theme(theme: string): this {
    this.$theme = theme;
    return this;
  }

  /**
   * Set the from address for the mail message.
   *
   * @param {string} address
   * @param {string|null} name
   * @returns {MailMessage}
   */
  public from(address: string, name?: string): this {
    this.$from = new Address(address, name);
    return this;
  }

  /**
   * Set the "reply to" address of the message.
   *
   * @param {string|string[]} address
   * @param {string|null} name
   * @returns {MailMessage}
   */
  public replyTo(address: string | string[], name?: string): this {
    if (Array.isArray(address)) {
      this.$replyTo.push(...this.parseAddresses([address]));
    } else {
      this.$replyTo.push({ address, name });
    }
    return this;
  }

  /**
   * Set the cc address for the mail message.
   *
   * @param {string|string[]} address
   * @param {string|null} name
   * @returns {MailMessage}
   */
  public cc(address: string | string[], name?: string): this {
    if (Array.isArray(address)) {
      this.$cc.push(...this.parseAddresses(address));
    } else {
      this.$cc.push({ address, name });
    }
    return this;
  }

  /**
   * Set the bcc address for the mail message.
   *
   * @param {string|string[]} address
   * @param {string|null} name
   * @returns {MailMessage}
   */
  public bcc(address: string | string[], name?: string): this {
    if (Array.isArray(address)) {
      this.$bcc.push(...this.parseAddresses(address));
    } else {
      this.$bcc.push({ address, name });
    }
    return this;
  }

  /**
   * Add a tag header to the message when supported by the underlying transport.
   *
   * @param {string} value
   * @returns {MailMessage}
   */
  public tag(value: string): this {
    this.$tags.push(value);
    return this;
  }

  /**
   * Add a metadata header to the message when supported by the underlying transport.
   *
   * @param {string} key
   * @param {string} value
   * @returns {MailMessage}
   */
  public metadata(key: string, value: string): this {
    this.metadata[key] = value;
    return this;
  }

  /**
   * Set the priority of this message.
   *
   * The value is an integer where 1 is the highest priority and 5 is the lowest.
   *
   * @param {number} level
   * @returns {MailMessage}
   */
  public priority(level: number): this {
    this.$priority = level;
    return this;
  }

  /**
   * Get the data object for the mail message.
   *
   * @returns {object}
   */
  public get data(): { [key: string]: unknown } {
    return this.$viewData;
  }

  /**
   * Parse the multi-address array into the necessary format.
   *
   */
  protected parseAddresses(
    value: Array<string | string[]>,
  ): Array<[string, string | null]> {
    return value.map(([address, name]) => [
      address,
      typeof name !== "string" ? null : name,
    ]);
  }

  /**
   * Determine if the given "address" is actually an array of addresses.
   *
   * @param {unknown} address
   * @returns {boolean}
   */
  protected isArrayOfAddress(address: unknown): boolean {
    return Array.isArray(address);
  }

  renderHTML() {
    if (typeof this.$view === "string") return undefined;

    return this.$view.html;
  }

  renderText() {
    if (typeof this.$view === "string") return this.$view;
    if (this.$view.text) return this.$view.text;

    return this.render();
  }
}
