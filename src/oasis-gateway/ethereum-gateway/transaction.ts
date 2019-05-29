import { JsonRpcWebSocket } from './websocket';

const OASIS_CHAIN_ID = 42261;

export class TransactionFactory {
  constructor(private address: string, private ws: JsonRpcWebSocket) {}

  async create(tx: UnpreparedTransaction): Promise<Transaction> {
    let promises: Promise<any>[] = [];
    if (!tx.gasLimit) {
      promises.push(this.estimateGas(tx));
    }
    if (!tx.nonce) {
      promises.push(this.nonce());
    }
    (await Promise.all(promises)).forEach(r => {
      tx[r.key] = r.value;
    });

    if (!tx.gasPrice) {
      tx.gasPrice = '0x3b9aca00';
    }

    tx.chainId = OASIS_CHAIN_ID;

    return tx as Transaction;
  }

  async estimateGas(tx: Object): Promise<any> {
    return {
      key: 'gasLimit',
      value: (await this.ws.request({
        method: 'eth_estimateGas',
        params: [tx]
      })).result
    };
  }

  async nonce(): Promise<any> {
    return {
      key: 'nonce',
      value: (await this.ws.request({
        method: 'eth_getTransactionCount',
        params: [this.address, 'latest']
      })).result
    };
  }
}

/**
 * Transaction that might need fields to be filled in, e.g., via estimateGas.
 */
type UnpreparedTransaction = {
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
