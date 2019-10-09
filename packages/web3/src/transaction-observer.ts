import { EventEmitter } from 'eventemitter3';
import { bytes } from '@oasislabs/common';
import { Web3Gateway } from './';

export default class TransactionObserver {
  /**
   * Maps transaction hash to transaction return data.
   */
  private static cache = new Map();

  /**
   * Maps ethereum address to the "completedTransaction" subscription.
   */
  private static subscriptions = new Map();

  /**
   * Emits an event whenever we receive the return value of
   * a completed transaction.
   */
  private static incoming = new EventEmitter();

  /**
   * Watches the given gateway for all completed transactions sent by `from`
   * and caches the transaction outcome locally.
   */
  public static observe(address: Uint8Array, gw: Web3Gateway) {
    let subscription = this.subscriptions.get(address);
    if (subscription) {
      return;
    }

    subscription = gw.web3Subscribe(bytes.toHex(address), [
      'completedTransaction',
      {
        fromBytes: address,
      },
    ]);

    this.subscriptions.set(address, subscription);

    subscription.addListener(address, (e: any) => {
      this.cache.set(e.transactionHash, e.returnData);
      TransactionObserver.incoming.emit(e.transactionHash, e.returnData);
    });
  }

  /**
   * @returns a promise resolving to the return value for the given `txHash`
   *          once the transaction completes.
   */
  public static async outcome(txHash: string): Promise<any> {
    const tx = TransactionObserver.cache.get(txHash);
    if (tx) {
      return tx;
    }
    return new Promise(resolve => {
      TransactionObserver.incoming.once(txHash, d => {
        resolve(d);
        TransactionObserver.cache.delete(txHash);
      });
    });
  }
}
