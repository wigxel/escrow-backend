import type { AddressUnion, MailAddress } from "~/layers/mailing/types";

/**
 * Class representing an email address with optional display name
 */
export class Address implements MailAddress {
  constructor(
    public address: string,
    public name?: string,
  ) {}

  toString() {
    if (this.name) return `${this.name} <${this.address}>`;
    return this.address;
  }

  static parse(address: unknown): Address[] {
    const EMAIL_REGEX = /.+@\w+\.\w+/;

    if (address instanceof Address) return [address];
    if (typeof address === "string") return [new Address(address)];

    if (Array.isArray(address) && address.length === 2) {
      const [email, name] = address as [string, string?];
      if (!name) return [new Address(email)];
      if (!EMAIL_REGEX.test(name)) return [new Address(email, name)];
    }

    if (Array.isArray(address)) {
      return address.flatMap((e) => Address.parse(e));
    }

    return [];
  }
}

// Type aliases for common input types
type AddressInput = Address | AddressUnion;
type Using = (() => void) | Array<() => void>;

type EnvelopParams = Partial<{
  from: AddressInput;
  to: AddressInput[];
  cc: AddressInput[];
  bcc: AddressInput[];
  replyTo: AddressInput[];
  subject: string;
  tags: string[];
  metadata: Record<string, unknown>;
}>;

/**
 * Class representing an email envelope containing all necessary metadata
 * for sending an email, including addresses, subject, tags, and customization options
 */
export class Envelope {
  /** The sender's address */
  public _from: Address | null;
  /** Array of primary recipients */
  public _to: Address[];
  /** Array of carbon copy recipients */
  public _cc: Address[];
  /** Array of blind carbon copy recipients */
  public _bcc: Address[];
  /** Array of reply-to addresses */
  public _replyTo: Address[];
  /** Email subject line */
  public _subject: string | null;
  /** Array of tags for categorizing the email */
  public _tags: string[];
  /** Key-value store for additional email metadata */
  public _metadata: Record<string, unknown>;
  /** Array of callback functions for message customization */
  public _using: Array<() => void>;

  /**
   * Creates a new Envelope instance
   */
  constructor(params: EnvelopParams) {
    this._from = this.normalizeAddress(params.from ?? null);
    this._to = this.normalizeAddresses(params.to ?? []);
    this._cc = this.normalizeAddresses(params.cc ?? []);
    this._bcc = this.normalizeAddresses(params.bcc ?? []);
    this._replyTo = this.normalizeAddresses(params.replyTo ?? []);
    this._subject = params.subject ?? null;
    this._tags = params.tags ?? [];
    this._metadata = params.metadata ?? {};
  }

  /**
   * Converts an array of address inputs (strings or Address objects) to Address objects
   * @param addresses - Array of address inputs to normalize
   * @returns Array of Address objects
   */
  protected normalizeAddresses(addresses: AddressInput[]): Address[] {
    return addresses.map((address) => this.normalizeAddress(address));
  }

  protected normalizeAddress(address: AddressInput): Address {
    if (Array.isArray(address)) {
      const [email, name] = address;
      return new Address(email, name);
    }

    if (typeof address === "string") return new Address(address);

    return address;
  }

  /**
   * Sets the sender's address
   * @param address - Sender's address (string or Address object)
   * @param name - Optional display name for the sender
   * @returns this for method chaining
   */
  from(address: string, name?: string): this {
    this._from = this.normalizeAddress([address, name]);
    return this;
  }

  /**
   * Adds primary recipients to the envelope
   * @param address - Single address or array of addresses
   * @param name - Optional display name (only used when address is a string)
   * @returns this for method chaining
   */
  to(address: AddressInput | AddressInput[], name?: string): this {
    this._to = [
      ...this._to,
      ...this.normalizeAddresses(
        name
          ? [new Address(address as string, name)]
          : Array.isArray(address)
            ? address
            : [address],
      ),
    ];
    return this;
  }

  /**
   * Adds CC recipients to the envelope
   * @param address - Single address or array of addresses
   * @param name - Optional display name (only used when address is a string)
   * @returns this for method chaining
   */
  cc(address: AddressInput | AddressInput[], name?: string): this {
    this._cc = [
      ...this._cc,
      ...this.normalizeAddresses(
        name
          ? [new Address(address as string, name)]
          : Array.isArray(address)
            ? address
            : [address],
      ),
    ];
    return this;
  }

  /**
   * Adds BCC recipients to the envelope
   * @param address - Single address or array of addresses
   * @param name - Optional display name (only used when address is a string)
   * @returns this for method chaining
   */
  bcc(address: AddressInput | AddressInput[], name?: string): this {
    this._bcc = [
      ...this._bcc,
      ...this.normalizeAddresses(
        name
          ? [new Address(address as string, name)]
          : Array.isArray(address)
            ? address
            : [address],
      ),
    ];
    return this;
  }

  /**
   * Adds reply-to addresses to the envelope
   * @param address - Single address or array of addresses
   * @param name - Optional display name (only used when address is a string)
   * @returns this for method chaining
   */
  replyTo(address: AddressInput | AddressInput[], name?: string): this {
    this._replyTo = [
      ...this._replyTo,
      ...this.normalizeAddresses(
        name
          ? [new Address(address as string, name)]
          : Array.isArray(address)
            ? address
            : [address],
      ),
    ];
    return this;
  }

  /**
   * Sets the email subject
   * @param subject - Email subject line
   * @returns this for method chaining
   */
  subject(subject: string): this {
    this._subject = subject;
    return this;
  }

  /**
   * Adds multiple tags to the envelope
   * @param tags - Array of tags to add
   * @returns this for method chaining
   */
  tags(tags: string[]): this {
    this._tags = [...this._tags, ...tags];
    return this;
  }

  /**
   * Adds a single tag to the envelope
   * @param tag - Tag to add
   * @returns this for method chaining
   */
  tag(tag: string): this {
    this._tags.push(tag);
    return this;
  }

  /**
   * Adds a metadata key-value pair to the envelope
   * @param key - Metadata key
   * @param value - Metadata value (string or number)
   * @returns this for method chaining
   */
  metadata(key: string, value: string | number): this {
    this._metadata[key] = value;
    return this;
  }

  /**
   * Checks if the envelope is from a specific address
   * @param address - Email address to check
   * @param name - Optional name to check
   * @returns boolean indicating if the address matches
   */
  isFrom(address: string, name?: string | null): boolean {
    if (!this._from) return false;

    if (name === null || name === undefined) {
      return this._from.address === address;
    }

    return this._from.address === address && this._from.name === name;
  }

  /**
   * Checks if a specific address is in the to list
   * @param address - Email address to check
   * @param name - Optional name to check
   * @returns boolean indicating if the address is found
   */
  hasTo(address: string, name?: string | null): boolean {
    return this.hasRecipient(this._to, address, name);
  }

  /**
   * Checks if a specific address is in the CC list
   * @param address - Email address to check
   * @param name - Optional name to check
   * @returns boolean indicating if the address is found
   */
  hasCc(address: string, name?: string | null): boolean {
    return this.hasRecipient(this._cc, address, name);
  }

  /**
   * Checks if a specific address is in the BCC list
   * @param address - Email address to check
   * @param name - Optional name to check
   * @returns boolean indicating if the address is found
   */
  hasBcc(address: string, name?: string | null): boolean {
    return this.hasRecipient(this._bcc, address, name);
  }

  /**
   * Checks if a specific address is in the reply-to list
   * @param address - Email address to check
   * @param name - Optional name to check
   * @returns boolean indicating if the address is found
   */
  hasReplyTo(address: string, name?: string | null): boolean {
    return this.hasRecipient(this._replyTo, address, name);
  }

  /**
   * Helper method to check if a recipient exists in a list of addresses
   * @param recipients - Array of addresses to search
   * @param address - Email address to check
   * @param name - Optional name to check
   * @returns boolean indicating if the recipient is found
   */
  protected hasRecipient(
    recipients: Address[],
    address: string,
    name?: string | null,
  ): boolean {
    return recipients.some((recipient) => {
      if (name === null || name === undefined) {
        return recipient.address === address;
      }
      return recipient.address === address && recipient.name === name;
    });
  }

  /**
   * Checks if the envelope has a specific subject
   * @param subject - Subject to check
   * @returns boolean indicating if the subject matches
   */
  hasSubject(subject: string): boolean {
    return this._subject === subject;
  }

  /**
   * Checks if the envelope has a specific metadata key-value pair
   * @param key - Metadata key to check
   * @param value - Metadata value to check
   * @returns boolean indicating if the metadata matches
   */
  hasMetadata(key: string, value: string): boolean {
    return (
      this._metadata[key] !== undefined && String(this._metadata[key]) === value
    );
  }

  reduce(envelope: Envelope): Envelope {
    return new Envelope({
      from: envelope._from ?? this._from,
      subject: envelope._subject ?? this._subject,
      to: envelope._to.concat(this._to),
      bcc: envelope._bcc.concat(this._bcc),
      cc: envelope._cc.concat(this._cc),
      replyTo: envelope._replyTo.concat(this._replyTo),
    });
  }
}
