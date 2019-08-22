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
It's suggested to use this package if you want the client to sign transactions with its own
wallet and specify transaction options like gas price and gas limit.

It currently only supports WebSockets and can be instantiated as follows:

.. code-block:: javascript

   let url = 'wss://web3.devnet.oasiscloud.io/ws';
   let wallet = new oasis.Wallet(SECRET_KEY);

   new oasis.gateways.Web3Gateway(url, wallet);

Parameters
----------
1. ``url`` - ``String``: The url of the gateway.
2. ``wallet`` - ``Wallet``: The wallet to sign transactions. For convenience, we package and suggest using the ethers.js `wallet`_.

Web3 JSON RPC
-------------

In addition to implementing the ``OasisGateway`` interface, the ``Web3Gateway`` exposes a subset of the
Web3 JSON RPC `spec <https://github.com/ethereum/wiki/wiki/JSON-RPC>`_ along with Oasis extensions.

Examples
--------

To execute a web3 rpc method, simply access the namespace followed by the method.

For example, to retrieve the latest block using ``eth_getBlockByNumber``,

.. code-block:: javascript

   gateway.eth.getBlockByNumber('latest', true);

To get the expiration of a given service using ``oasis_getExpiry``,

.. code-block:: javascript

    gateway.oasis.getExpiry(address);

RPCs
----

For the full list of available rpc methods, see the `spec <https://github.com/ethereum/wiki/wiki/JSON-RPC>`_.

Supported namespaces are

* ``eth_``
* ``oasis_``
* ``net_``

Subscriptions
-------------

To make a web3 subscription use the ``eth_subscribe`` method. Unlike other RPCs,
instead of returning the server response, ``eth_subscribe`` will return an ``EventEmitter``
object, emitting events on the ``data`` topic.

For example, to subscribe to logs,

.. code-block:: javascript

   const subscription = gateway.eth.subscribe('logs', {
     address: '0x...'
     topics: ['0x...']
   });

   subscription.on('data', (event) => {
     // Do something with your event.
   });

To subscribe to new block headers,

.. code-block:: javascript

   const subscription = gateway.eth.subscribe('newBlockHeaders');

   subscription.on('data', (event) => {
     // Do something with your headers.
   });

To unsubscribe, give the subscription id to the ``eth_unsubscribe`` method. Continuing the
above example,

.. code-block:: javascript

   gateway.eth.unsubscribe(subscription.id);

Oasis Web3 extensions
---------------------
In addition to the ``eth_`` and ``net_`` namespaces, we provide an ``oasis_`` namespace extension with the following methods.

oasis_getExpiry
----------------

Returns the expiration timestamp for the service.

Parameters
----------
1. Address: 0x prefixed 20-byte hex string representing the address of the service.

oasis_getPublicKey
------------------

Returns the public key created by the Key Manager, used for encrypted communication with the service.

Parameters
----------
1. Address: 0x prefixed 20-byte hex string representing the address of the service for
   which to retrieve the public key.
