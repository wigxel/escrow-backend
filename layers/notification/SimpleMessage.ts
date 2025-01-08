import { flow, pipe } from "effect";
import { filter, join, map } from "effect/Array";

export class SimpleMessage {
  private _subject: string;
  private _greeting: string;
  private _body: string | string[];
  private _action?: {
    text: string;
    url: string;
    color?: string;
  };
  private _salutation?: string;
  private _footer?: {
    text: string;
    link?: {
      text: string;
      url: string;
    };
  };

  constructor() {
    this._subject = "";
    this._greeting = "";
    this._body = "";
  }

  subject(subject: string): this {
    this._subject = subject;
    return this;
  }

  greeting(greeting: string): this {
    this._greeting = greeting;
    return this;
  }

  line(line: string): this {
    if (Array.isArray(this._body)) {
      (this._body as string[]).push(line);
    } else {
      this._body = [line];
    }
    return this;
  }

  action(text: string, url: string, color?: string): this {
    this._action = { text, url, color };
    return this;
  }

  salutation(salutation: string): this {
    this._salutation = salutation;
    return this;
  }

  footer(text: string, link?: { text: string; url: string }): this {
    this._footer = { text, link };
    return this;
  }

  /**
   * Gets the subject of the message.
   */
  public getSubject(): string {
    return this._subject;
  }

  /**
   * Gets the greeting of the message.
   */
  public getGreeting(): string {
    return this._greeting;
  }

  /**
   * Gets the body of the message.
   */
  public getBody(): string | string[] {
    return this._body;
  }

  /**
   * Gets the action (button) of the message.
   */
  public getAction():
    | { text: string; url: string; color?: string }
    | undefined {
    return this._action;
  }

  /**
   * Gets the salutation of the message.
   */
  public getSalutation(): string | undefined {
    return this._salutation;
  }

  /**
   * Gets the footer of the message.
   */
  public getFooter():
    | { text: string; link?: { text: string; url: string } }
    | undefined {
    return this._footer;
  }

  render() {
    const clean = flow(
      (e: string[]) => e.flat(),
      filter((e) => typeof e === "string"),
      map((e) => e.trim()),
      filter((e) => e.length > 0),
    );

    return pipe(
      [
        this._greeting,
        pipe([this._body], clean, join("\n")),
        this._action,
        this._salutation ? `${this._salutation}\n` : "",
        // TODO: add footer format
        // this._footer,
      ],
      clean,
      join("\n\n"),
    );
  }
}
