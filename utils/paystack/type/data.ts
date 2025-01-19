export type TInitializeTransactionData = {
  email:string,
  amount:string, //Amount should be in the subunit of the,
  callback_url?:string,
  currency?:string,
  reference?:string // Unique transaction reference
  metadata?: Record<string, unknown>
}