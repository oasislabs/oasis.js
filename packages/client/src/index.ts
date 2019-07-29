import { keccak256 } from 'js-sha3';
import Gateway from '@oasislabs/gateway';
import { cbor, bytes } from '@oasislabs/common';
import {
  OasisCoder,
  Service,
  deploy,
  header,
  setGateway,
  defaultOasisGateway
} from '@oasislabs/service';
import { Deoxysii, encrypt, decrypt } from '@oasislabs/confidential';
import {
  Web3Gateway,
  EthereumCoder,
  EthereumWallet as Wallet
} from '@oasislabs/ethereum';
import workspace from './workspace';

const oasis = {
  Service,
  deploy,
  Wallet,
  setGateway,
  gateways: {
    Gateway,
    Web3Gateway
  },
  utils: {
    bytes,
    cbor,
    encrypt,
    decrypt,
    OasisCoder,
    EthereumCoder,
    header,
    keccak256
  },
  workspace,
  disconnect() {
    try {
      defaultOasisGateway().disconnect();
    } catch (_e) {
      // tslint:disable-line no-empty
      // `defaultOasisGateway` will throw if there's no default gateway.
      // Disconnecting from a nonexistent gateway is a no-op.
    }
  }
};

export default oasis;
