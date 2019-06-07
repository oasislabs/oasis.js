.. include:: links.rst

.. _gateways:

=========================
gateways
=========================

The ``oasis.gateways`` namespace provides objects implementing the ``OasisGateway`` interface, defining the client's backend used to send transactions to the Oasis network. It should be rare to need to interact with this interface; however, the definition is provided for those who'd like to implement it.

interface OasisGateway
=======================

The interface is defined with the following TypeScript:

.. code-block:: typescript

   interface OasisGateway {
     deploy(request: DeployRequest): Promise<DeployResponse>;
     rpc(request: RpcRequest): Promise<RpcResponse>;
     subscribe(request: SubscribeRequest): EventEmitter;
     unsubscribe(request: UnsubscribeRequest);
     publicKey(request: PublicKeyRequest): Promise<PublicKeyResponse>;
   }

   type DeployRequest = {
     data: Bytes;
   };

   type DeployResponse = {
     address: Address;
   };

   type PublicKeyRequest = {
     address: Address;
   };

   type RpcRequest = {
     data: Bytes;
     address?: Address;
     options?: RpcOptions;
   };

   type RpcOptions = {
     gasLimit?: string;
     gasPrice?: string;
     aad?: string;
   };

   type RpcResponse = {
     output: any;
   };

   type SubscribeRequest = {
     event: string;
     filter?: SubscribeFilter;
   };

   type SubscribeFilter = {
     address: Address;
     topics: Bytes[];
   };

   type UnsubscribeRequest = {
     event: string;
   };

   type PublicKeyResponse = {
     publicKey?: PublicKey;
   };

The following two implementations are provided.

---------------------------------------------------------------------------

DeveloperGateway.http
===============================================

``oasis.gateways.DeveloperGateway`` provides an implementation of ``OasisGateway`` that communicates with a developer-gateway.
It can be instantiated via an ``http`` factory method as follows.

.. code-block:: javascript

   oasis.gateways.DeveloperGateway.http('http://localhost:8545');

Parameters
----------
1. ``url`` - ``String``: The url of the gateway.

---------------------------------------------------------------------------

.. _ethereum-gateway:

Web3Gateway
===============================================

``oasis.gateways.Web3Gateway`` provides an implementation of ``OasisGateway`` that communicates wiith a web3 gateway.
It's suggested to use this package if you want full control over web3 semantics, i.e., you want the client to sign
transactions with its own wallet and specify transaction options like gas price and gas limit.

It's gateway can be instantiated as follows:

.. code-block:: javascript

   let url = 'http://web3.oasiscloud.io';
   let wallet = new oasis.Wallet(SECRET_KEY);

   new oasis.gateways.Web3Gateway(url, wallet);

Parameters
----------
1. ``url`` - ``String``: The url of the gateway.
2. ``wallet`` - ``EthereumWallet``: The wallet to sign transactions. For convenience, we package and suggest using the ethers.js `wallet`_.
