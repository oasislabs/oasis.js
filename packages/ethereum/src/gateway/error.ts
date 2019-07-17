export class TransactionReverted extends Error {
  constructor(readonly receipt: Object, ...params) {
    super(...params);
  }
}

export class RpcFailure extends Error {}
