import { ethers } from 'ethers';
import { JsonRpcRequest, JsonRpcResponse } from '../src/websocket';
import { OASIS_CHAIN_ID } from '../src/transaction';
import { Web3, Web3Provider } from '../src/web3';

describe('Web3', () => {
  // Mock out the websocket json rpc requester for all testing.
  // @ts-ignore
  Web3Provider.makeWs = (_url, _sub) => {
    return new MockJsonRpc();
  };

  it('Issues eth_getBlockByNumber Web3 JSON RPC', async () => {
    const wallet = ethers.Wallet.createRandom();
    const web3 = new Web3(new Web3Provider('', wallet));

    const response = await web3.eth.getBlockByNumber('latest', true);

    expect(response).toEqual({
      request: { method: 'eth_getBlockByNumber', params: ['latest', true] },
      success: true,
    });
  });

  it('Issues eth_sendTransaction Web3 JSON RPC', async () => {
    const wallet = new ethers.Wallet(
      '0x0d0b8fb7d60f37b370731f4de70dc1837997ea5e16023792c3573e8b3238bc0e'
    );
    const web3 = new Web3(new Web3Provider('', wallet));

    const response = await web3.eth.sendTransaction({
      to: '0xf31a68b6a781e265f40c111abf24dc59d12928ef',
      value: '0x100',
      nonce: '0x20',
      chainId: OASIS_CHAIN_ID,
    });

    // Expect our provider to transform all `eth_sendTransaction` rpcs into
    // `eth_sendRawTransaction` rpcs.
    expect(response.request.method).toEqual('eth_sendRawTransaction');
    expect(response).toEqual({
      request: {
        method: 'eth_sendRawTransaction',
        params: [
          '0xf86820843b9aca0082ffff94f31a68b6a781e265f40c111abf24dc59d12928ef8201008083014a4da09731f8d733ebb5ff5810ef9d662ae7082dc07dc05def2d2a2d3a61147a49cf9ea058b5e9350751733722492740b1e797054ec014e8e3f15b0e4d432695b8d6fc7b',
        ],
      },
      success: true,
    });

    // Deconstructing the raw transaction above gives:
    //
    //       { nonce: 32,
    //         gasPrice: BigNumber { _hex: '0x3b9aca00' },
    //         gasLimit: BigNumber { _hex: '0xffff' },
    //         to: '0xf31a68B6A781E265F40c111aBf24Dc59D12928Ef',
    //         value: BigNumber { _hex: '0x0100' },
    //         data: '0x',
    //         chainId: 42261,
    //         v: 84557,
    //         r:
    //          '0x9731f8d733ebb5ff5810ef9d662ae7082dc07dc05def2d2a2d3a61147a49cf9e',
    //         s:
    //          '0x58b5e9350751733722492740b1e797054ec014e8e3f15b0e4d432695b8d6fc7b',
    //         from: '0x439cBd90Fd42eD48fe57400486d270b03FfFd47D',
    //         hash:
    //          '0x5f6e7171db133c22a3d0efeb07c8d77676f63c78480adb48082ee3bf415de5c1' }
  });
});

class MockJsonRpc {
  async request(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (request.method === 'eth_estimateGas') {
      return {
        result: '0xffff',
      };
    } else {
      return {
        result: {
          request,
          success: true,
        },
      };
    }
  }
}
