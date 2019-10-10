import { ethers } from 'ethers';
export { default as Web3Gateway } from './gateway';
export { OASIS_CHAIN_ID } from './transaction';

// TODO: Move this into @oasislabs/client/wallet once we address
//       https://github.com/oasislabs/oasis.js/issues/118.
export const EthereumWallet = ethers.Wallet;
