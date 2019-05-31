import Service from './service';
import deploy from './deploy';
import * as utils from './utils';
import Wallet from './wallet/ethereum';

const oasis = {
  Service,
  deploy,
  utils,
  Wallet
};

export default oasis;
