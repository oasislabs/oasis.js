import { Transaction } from '../oasis-gateway/ethereum-gateway/transaction';

export default interface Wallet {
  sign(tx: Transaction): Promise<string>;
  address: string;
}
