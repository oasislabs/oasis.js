import { ethers } from 'ethers';
import Web3Gateway from './gateway';

// TODO: Move this into @oasislabs/client/wallet once we address
//       https://github.com/oasislabs/oasis.js/issues/118.
const EthereumWallet = ethers.Wallet;

export { Web3Gateway, EthereumWallet };
