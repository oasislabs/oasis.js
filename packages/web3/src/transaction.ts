import { JsonRpc } from './websocket';

export const OASIS_CHAIN_ID = 42261;

export class TransactionFactory {
  constructor(private address: string, private rpc: JsonRpc) {}

  async create(tx: UnpreparedTransaction): Promise<Transaction> {
    // Clone the options so that we don't mutate the array given,
    // which might be re-used by the front-end client.
    tx = JSON.parse(JSON.stringify(tx));

    if (!tx.value) {
      tx.value = '0x00';
    }
    if (!tx.gasPrice) {
      tx.gasPrice = '0x3b9aca00';
    }

    const promises: Promise<any>[] = [];
    if (!tx.gasLimit) {
      promises.push(this.estimateGas(tx));
    }
    if (!tx.nonce) {
      promises.push(this.nonce());
    }
    (await Promise.all(promises)).forEach(r => {
      (tx as any)[r.key] = r.value;
    });

    return tx as Transaction;
  }

  async estimateGas(tx: Record<string, any>): Promise<any> {
    return {
      key: 'gasLimit',
      value: (
        await this.rpc.request({
          method: 'eth_estimateGas',
          params: [tx],
        })
      ).result,
    };
  }

  async nonce(): Promise<any> {
    return {
      key: 'nonce',
      value: (
        await this.rpc.request({
          method: 'eth_getTransactionCount',
          params: [this.address, 'latest'],
        })
      ).result,
    };
  }
}

/**
 * Transaction that might need fields to be filled in, e.g., via estimateGas.
 */
export type UnpreparedTransaction = {
  to?: string;
  value?: string;
  data?: string;
  nonce?: string;
  gasLimit?: string;
  gasPrice?: string;
  chainId?: number;
};

export type Transaction = {
  to?: string;
  value: string;
  data: string;
  nonce: string;
  gasLimit: string;
  gasPrice: string;
  chainId: number;
};
