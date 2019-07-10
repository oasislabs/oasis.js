import { keccak256 } from 'js-sha3';
import Gateway from '@oasis/gateway';
import { cbor, bytes } from '@oasis/common';
import {
  Service,
  deploy,
  OasisCoder,
  header,
  setGateway
} from '@oasis/service';
import { Deoxysii, encrypt, decrypt } from '@oasis/confidential';
import {
  Web3Gateway,
  EthereumCoder,
  EthereumWallet as Wallet
} from '@oasis/ethereum';

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
