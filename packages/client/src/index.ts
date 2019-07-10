import { keccak256 } from 'js-sha3';
import Gateway from '@oasislabs/gateway';
import { cbor, bytes } from '@oasislabs/common';
import {
  Service,
  deploy,
  OasisCoder,
  header,
  setGateway
} from '@oasislabs/service';
import { Deoxysii, encrypt, decrypt } from '@oasislabs/confidential';
import {
  Web3Gateway,
  EthereumCoder,
  EthereumWallet as Wallet
} from '@oasislabs/ethereum';

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
  }
};

export default oasis;
