export type AddressUnion = string | [string, string?];

export interface MailAddress {
  name?: string;
  address: string;
}

export interface MailOptions {
  /** The e-mail address of the sender. All e-mail addresses can be plain 'sender@server.com' or formatted 'Sender Name <sender@server.com>' */
  from?: MailAddress;
  /** An e-mail address that will appear on the Sender: field */
  sender?: MailAddress;
  /** Comma separated list or an array of recipients e-mail addresses that will appear on the To: field */
  to?: MailAddress | Array<MailAddress>;
  /** Comma separated list or an array of recipients e-mail addresses that will appear on the Cc: field */
  cc?: MailAddress | Array<MailAddress>;
  /** Comma separated list or an array of recipients e-mail addresses that will appear on the Bcc: field */
  bcc?: MailAddress | Array<MailAddress>;
  /** Comma separated list or an array of e-mail addresses that will appear on the Reply-To: field */
  replyTo?: MailAddress | Array<MailAddress> | undefined;
  /** The message-id this message is replying */
  inReplyTo?: MailAddress | undefined;
  /** The subject of the email */
  subject?: string | undefined;
}

export interface MailContent {
  text?: string | Buffer | undefined;
  /** The HTML version of the message */
  html?: string | Buffer | undefined;
  /** Apple Watch specific HTML version of the message, same usage as with text and html */
  watchHtml?: string | Buffer | undefined;
}

export type SendMailParams = MailContent & MailOptions;
