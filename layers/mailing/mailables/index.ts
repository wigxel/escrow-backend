import { Equivalence } from "effect";
import type { MailerInterface } from "../../../layers/mailing";
import { Content } from "../../../layers/mailing/mailables/Content";
import { Address, Envelope } from "../../../layers/mailing/mailables/Envelope";
import type { AddressUnion, MailAddress } from "../../../layers/mailing/types";
import type { MailMessage } from "../../../layers/notification/MailMessage";

type AddressInput = AddressUnion | Address;

/** construct an Email **/
export class Mailable {
  /**
   * The locale of the message.
   */
  public $locale: string;

  /**
   * The person the message is from.
   */
  public $from: MailAddress | null;

  /**
   * The "to" recipients of the message.
   */
  public $to: MailAddress[] = [];

  /**
   * The "cc" recipients of the message.
   */
  public $cc = [];

  /**
   * The "bcc" recipients of the message.
   */
  public $bcc = [];

  /**
   * The "reply to" recipients of the message.
   */
  public $replyTo = [];

  /**
   * The subject of the message.
   */
  private $subject: string;

  /**
   * The Markdown template for the message (if applicable).
   */
  public $markdown: string;

  /**
   * The HTML to use for the message.
   */
  protected $html: string;

  /**
   * The plain text view to use for the message.
   */
  public $textView: string;

  /**
   * The view data for the message.
   */
  public $viewData: Record<string, unknown> = {};

  /**
   * The attachments for the message.
   *
   * @var array
   */
  public $attachments = [];

  /**
   * The raw attachments for the message.
   *
   * @var array
   */
  public $rawAttachments = [];

  /**
   * The attachments from a storage disk.
   *
   * @var array
   */
  public $diskAttachments = [];

  /**
   * The tags for the message.
   *
   * @var array
   */
  protected $tags = [];

  /**
   * The metadata for the message.
   */
  protected $metadata: Record<string, unknown> = {};

  /**
   * The callbacks for the message.
   *
   * @var array
   */
  public $callbacks = [];

  public subject(value: string) {
    this.$subject = value;
  }

  envelope(): Envelope {
    return new Envelope({});
  }

  content(): Content {
    return new Content({
      html: this.$html,
      text: this.$textView,
      markdown: this.$markdown,
      withData: this.$viewData,
    });
  }

  static fromMessage(message: MailMessage): Mailable {
    const mailable = new Mailable();

    mailable.$viewData = message.$viewData;
    mailable.$cc = message.$cc;
    mailable.$bcc = message.$bcc;
    mailable.$replyTo = message.$replyTo;
    mailable.$tags = message.$tags;
    mailable.$metadata = message.$metadata;
    mailable.subject(message.getSubject());
    mailable.from(message.$from);
    mailable.$textView = message.renderText();
    mailable.$html = message.renderHTML();

    return mailable;
  }

  /** sets the `From` address */
  from(address: AddressInput) {
    this.$from = this.normalizeAddress(address);
  }

  /** add `To` address */
  to(address: AddressInput) {
    this.setAddress("$to", address);
  }

  /** add `Cc` address */
  cc(address: AddressInput) {
    this.setAddress("$cc", address);
  }

  /** add `Bcc` address */
  bcc(address: AddressInput) {
    this.setAddress("$bcc", address);
  }

  protected _compareAddress(left: Address, right: Address) {
    const emailAddressMatch = Equivalence.mapInput(
      Equivalence.string,
      (address: Address) => address.address,
    );

    return emailAddressMatch(left, right);
  }

  setAddress(property: "$to" | "$cc" | "$bcc", address: AddressInput) {
    const norm_address = this.normalizeAddress(address);
    const addresses = this[property];

    if (addresses.some((e) => this._compareAddress(e, norm_address))) {
      return;
    }

    addresses.push(norm_address);
  }

  protected normalizeAddress(address: AddressInput): MailAddress {
    return Address.parse(address)?.[0];
  }

  public hasFrom() {
    return Boolean(this.$from);
  }

  send(mailer: MailerInterface) {
    const content = this.content();
    const envelope = this.envelope();

    const fresh_envelope = envelope.reduce(
      new Envelope({
        from: this.$from,
        to: this.$to,
        cc: this.$cc,
        bcc: this.$bcc,
        replyTo: this.$replyTo,
        subject: this.$subject,
        tags: this.$tags,
        metadata: this.$metadata,
      }),
    );

    return mailer.send({
      from: fresh_envelope._from,
      to: fresh_envelope._to,
      bcc: fresh_envelope._bcc,
      cc: fresh_envelope._cc,
      replyTo: fresh_envelope._replyTo,
      subject: fresh_envelope._subject,
      html: content.getHtml(),
      text: content.getText(),
    });
  }

  /** Show the HTML content **/
  render(): string {
    const content = this.content();
    return content.getHtml();
  }
}
