.. include:: links.rst

.. _gateways:

=========================
gateways
=========================

The ``oasis.gateways`` namespace provides objects implementing the ``OasisGateway`` interface, defining the client's backend used to send transactions to the Oasis network. It should be rare to need to interact with this interface; however, the definition is provided for those who'd like to implement it.

interface OasisGateway
=======================

The interface is defined with the following TypeScript `source <https://github.com/oasislabs/oasis.js/blob/master/packages/service/src/oasis-gateway.ts>`_.

The following two implementations are provided.

---------------------------------------------------------------------------

Gateway
===============================================

``oasis.gateways.Gateway`` provides an implementation of ``OasisGateway`` that communicates with a developer-gateway.
It currently only supports HTTP.

.. code-block:: javascript

   new oasis.gateways.Gateway(url, httpHeaders);

Parameters
----------
1. ``url`` - ``String``: The url of the gateway.
2. ``httpHeaders`` - ``Object``: The http headers to use for authentiication with the gateway. For example, :code:`{ headers: new Map([['X-OASIS-INSECURE-AUTH', 'VALUE']]) }`.

---------------------------------------------------------------------------

.. _ethereum-gateway:

Web3Gateway
===============================================

``oasis.gateways.Web3Gateway`` provides an implementation of ``OasisGateway`` that communicates with a web3 gateway.
It's suggested to use this package if you want full control over web3 semantics, i.e., you want the client to sign
transactions with its own wallet and specify transaction options like gas price and gas limit.

It currently only supports WebSockets and can be instantiated as follows:

.. code-block:: javascript

   let url = 'wss://web3.oasiscloud.io/ws';
   let wallet = new oasis.Wallet(SECRET_KEY);

   new oasis.gateways.Web3Gateway(url, wallet);

Parameters
----------
1. ``url`` - ``String``: The url of the gateway.
2. ``wallet`` - ``EthereumWallet``: The wallet to sign transactions. For convenience, we package and suggest using the ethers.js `wallet`_.
