export interface HorizonTransactionResponse {
  _links: {
    self: { href: string };
    account: { href: string };
    ledger: { href: string };
    operations: { href: string };
    effects: { href: string };
    precedes: { href: string };
    succeeds: { href: string };
    transaction: { href: string };
  };
  id: string;
  paging_token: string;
  successful: boolean;
  hash: string;
  ledger: number;
  created_at: string;
  source_account: string;
  source_account_sequence: string;
  fee_account: string;
  fee_charged: string;
  max_fee: string;
  operation_count: number;
  envelope_xdr: string;
  result_xdr: string;
  result_meta_xdr: string;
  fee_meta_xdr: string;
  memo_type: string;
  memo?: string;
  signatures: string[];
  valid_after?: string;
  valid_before?: string;
}

export interface HorizonOperationResponse {
  _links: {
    self: { href: string };
    transaction: { href: string };
    effects: { href: string };
    succeeds: { href: string };
    precedes: { href: string };
  };
  id: string;
  paging_token: string;
  transaction_successful: boolean;
  source_account: string;
  type: string;
  type_i: number;
  created_at: string;
  transaction_hash: string;
  // Payment operation fields
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  from?: string;
  to?: string;
  // Path payment fields
  source_amount?: string;
  source_asset_type?: string;
  source_asset_code?: string;
  source_asset_issuer?: string;
  // Create account fields
  starting_balance?: string;
  funder?: string;
  account?: string;
  // Soroban contract fields
  contract_id?: string;
  function?: string;
  parameters?: any[];
}

export interface HorizonLedgerResponse {
  _links: {
    self: { href: string };
    transactions: { href: string };
    operations: { href: string };
    payments: { href: string };
    effects: { href: string };
  };
  id: string;
  paging_token: string;
  hash: string;
  prev_hash: string;
  sequence: number;
  successful_transaction_count: number;
  failed_transaction_count: number;
  operation_count: number;
  tx_set_operation_count: number;
  closed_at: string;
  total_coins: string;
  fee_pool: string;
  base_fee_in_stroops: number;
  base_reserve_in_stroops: number;
  max_tx_set_size: number;
  protocol_version: number;
}

export interface HorizonCollectionResponse<T> {
  _links: {
    self: { href: string };
    next: { href: string };
    prev: { href: string };
  };
  _embedded: {
    records: T[];
  };
}
