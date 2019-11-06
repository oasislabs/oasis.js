import { keccak256 } from 'js-sha3';
import Gateway from '@oasislabs/gateway';
import { cbor, bytes } from '@oasislabs/common';
import {
  OasisCoder,
  Service,
  Address,
  Balance,
  deploy,
  DeployHeader,
  setGateway,
  defaultOasisGateway,
  fromWasm,
  fromWasmSync,
} from '@oasislabs/service';
import {
  Nonce,
  PublicKey,
  PrivateKey,
  Deoxysii,
  encrypt,
  decrypt,
} from '@oasislabs/confidential';
import { Web3Gateway } from '@oasislabs/web3';
import workspace from './workspace';
import Wallet from './wallet';

export default {
  Service,
  Address,
  Balance,
  deploy,
  Wallet,
  setGateway,
  defaultOasisGateway,
  gateways: {
    Gateway,
    Web3Gateway,
  },
  utils: {
    DeployHeader,
    Deoxysii,
    OasisCoder,
    Nonce,
    PrivateKey,
    PublicKey,
    bytes,
    cbor,
    decrypt,
    encrypt,
    keccak256,
    idl: {
      fromWasm,
      fromWasmSync,
    },
  },
  workspace,
  disconnect() {
    try {
      defaultOasisGateway().disconnect();
    } catch (_e) {
      // `defaultOasisGateway` will throw if there's no default gateway.
      // Disconnecting from a nonexistent gateway is a no-op.
    }
  },
};
