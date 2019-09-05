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

Methods
-------

In addition to implementing the ``OasisGateway`` interface, the ``Web3Gateway`` exposes a subset of the
Web3 JSON RPC `spec <https://github.com/ethereum/wiki/wiki/JSON-RPC>`_ along with Oasis extensions.

Supported namespaces are

* ``eth_``
* ``oasis_``
* ``net_``

Examples
+++++++++

To execute a web3 rpc method, simply access the namespace followed by the method.

For example, to retrieve the latest block using ``eth_getBlockByNumber``,

.. code-block:: javascript

   await gateway.eth.getBlockByNumber('latest', true);

To get the expiration of a given service using ``oasis_getExpiry``,

.. code-block:: javascript

    await gateway.oasis.getExpiry(address);

eth.protocolVersion
+++++++++++++++++++

**Parameters**

none

**Returns**

``String`` - The current ethereum protocol version.

eth.gasPrice
++++++++++++

**Parameters**

none

**Returns**

``String`` - hex string representing the current gas price in wei.

eth.blockNumber
+++++++++++++++

**Parameters**

none

**Returns**

``String`` - hex string repreenting the current block number the gateway is on.

eth.getBalance
++++++++++++++

**Parameters**

1. ``String`` - hex string 20 byte address to check for balance.
2. ``String`` - hex string block number, or the string "latest", "earliest" or "pending" (defaults to "latest").

**Returns**

``String`` - hex string the current balance in wei.

eth.getStorageAt
++++++++++++++++

**Parameters**

1. ``String`` - hex string 20 byte address of the storage.
2. ``String`` - hex string of the position in the storage.
3. ``String`` - hex string of the block number, or the string "latest", "earliest" or "pending" (defaults to "latest").

**Returns**

``String`` - hex string of the value at this storage position for the given address.

eth.getTransactionCount
+++++++++++++++++++++++

**Parameters**

1. ``String`` - hex string of the address to get the transaction count for.
2. ``String`` - hex string of the block number, or the string "latest", "earliest" or "pending" (defaults to "latest").

**Returns**

``String`` - hex string of the number of transactions send from this address.

eth.getBlockTransactionCountByHash
++++++++++++++++++++++++++++++++++

**Parameters**

1. ``String`` - hex string hash of a block.

**Returns**

``String`` - hex string of the number of transactions in this block.

eth.getBlockTransactionCountByNumber
++++++++++++++++++++++++++++++++++++

**Parameters**

1. ``String`` - hex string of a block number, or the string "earliest", "latest" or "pending" (defaults to "latest").

**Returns**

``String`` - hex string of the number of transactions in this block.

eth.getCode
+++++++++++

**Parameters**

1. ``String`` - hex string of the address.
2. ``String`` - hex string of the block number, or the string "latest", "earliest" or "pending" (defaults to "latest').

**Returns**

``String`` - hex string of the code of the given address.

eth.sendTransaction
+++++++++++++++++++

In order to use this method, the ``Web3Gateway`` must be created with a ``Wallet``.
Note that this is slightly different from the canonical web3 eth_sendTransaction in that
the client will sign the transaction and convert it into an eth_sendRawTransaction before
sending it to the remote gateway.

**Parameters**

1. Object - The transaction object

* to: ``String`` - (optional when creating new contract) The address the transaction is directed to.
* gas: ``String`` - (optional, default: 90000) Integer of the gas provided for the transaction execution. It will return unused gas.
* gasPrice: ``String`` - (optional) Integer of the gasPrice used for each paid gas
* value: ``String``  - (optional) Integer of the value sent with this transaction
* data: ``String`` - (optional) The data field of the transaction.
* nonce: ``String`` - (optional) Integer of a nonce. This allows to overwrite your own pending transactions that use the same nonce.

**Returns**
``String`` - the transaction hash, or the zero hash if the transaction is not yet available.

Use :ref:`eth.getTransactionReceipt <getTransactionReceipt>` to get the contract address, after the transaction was validated, when you created a contract.

eth.sendRawTransaction
++++++++++++++++++++++

**Parameters**

`. ``String`` - The signed transaction data.

**Returns**

``String`` - hex string of the 32 byte transaction hash, or the zero hash if the transaction is not yet available.

Use :ref:`eth.getTransactionReceipt <getTransactionReceipt>` to get the contract address, after the transaction was validated, when you created a contract.

eth.call
++++++++

Executes a transaction at the gateway without creating a transaction on the block chain.
Note that this feature is not available for confidential contracts, because Web3 gateways
don't have access to confidential state.

**Parameters**

1. Object - The transaction call object

* from: ``String`` - (optional) The address the transaction is sent from.
* to: ``String`` -  when creating new contract) The address the transaction is directed to.
* gas: ``String`` - (optional, default: 90000) Integer of the gas provided for the transaction execution. It will return unused gas.
* gasPrice: ``String`` - (optional) Integer of the gasPrice used for each paid gas
* value: ``String``  - (optional) Integer of the value sent with this transaction
* data: ``String`` - (optional) The data field of the transaction.
* nonce: ``String`` - (optional) Integer of a nonce. This allows to overwrite your own pending transactions that use the same nonce.

**Returns**

``String`` - hex string of the return value of the transaction

eth.estimateGas
+++++++++++++++

Estimates gas for a given transaction by executing a transaction at the gateway and recording the gas used.
The transaction is not added to the blockchain and so doesnt not affect state.
Note that this feature is not available for confidential contracts, because Web3 gateways
don't have access to confidential state.

**Parameters**

1. Object - The transaction call object

* from: ``String`` - (optional) The address the transaction is sent from.
* to: ``String`` -  (optional) when creating new contract) The address the transaction is directed to.
* gas: ``String`` - (optional) hex string of the gas provided for the transaction execution. It will return unused gas.
* gasPrice: ``String`` - (optional) hex string of the gasPrice used for each paid gas
* value: ``String``  - (optional) hex string of the value sent with this transaction
* data: ``String`` - (optional) the data field of the transaction.
* nonce: ``String`` - (optional) hex stirng of a nonce. This allows to overwrite your own pending transactions that use the same nonce.

**Returns**

``String`` - hex string of the amount of gas used for executing a transaction at the gateway.

.. _getBlockByHash:

eth.getBlockByHash
++++++++++++++++++

**Parameters**

1. ``String`` - hex string hash of a block.
2. ``Boolean`` - if true it returns the full transaction objects, if false only the hashes of the transactions.

**Returns**

``Object`` - A block object, or null when no block was found:

* number: ``String`` (hex) - the block number. null when its pending block.
* hash: ``String`` (hex), 32 Bytes - hash of the block. null when its pending block.
* parentHash: ``String`` (hex), 32 Bytes - hash of the parent block.
* nonce: ``String`` (hex), 8 Bytes - hash of the generated proof-of-work. null when its pending block.
* sha3Uncles: ``String`` (hex), 32 Bytes - SHA3 of the uncles data in the block.
* logsBloom: ``String`` (hex), 256 Bytes - the bloom filter for the logs of the block. null when its pending block.
* transactionsRoot: ``String`` (hex), 32 Bytes - the root of the transaction trie of the block.
* stateRoot: ``String`` (hex), 32 Bytes - the root of the final state trie of the block.
* receiptsRoot: ``String`` (hex), 32 Bytes - the root of the receipts trie of the block.
* miner: ``String`` (hex), 20 Bytes - the address of the beneficiary to whom the mining rewards were given.
* difficulty: ``String`` (hex) - integer of the difficulty for this block.
* totalDifficulty: ``String`` (hex) - integer of the total difficulty of the chain until this block.
* extraData: ``String`` (hex) - the "extra data" field of this block.
* size: ``String`` (hex) - integer the size of this block in bytes.
* gasLimit: ``String`` (hex) - the maximum gas allowed in this block.
* gasUsed: ``String`` (hex) - the total used gas by all transactions in this block.
* timestamp: ``String`` (hex) - the unix timestamp for when the block was collated.
* transactions: Array - Array of transaction objects, or 32 Bytes transaction hashes depending on the last given parameter.
* uncles: Array - Array of uncle hashes.


eth.getBlockByNumber
++++++++++++++++++++

**Parameters**

1. ``String`` - integer of a block number, or the string "earliest", "latest" or "pending", as in the default block parameter.
2. Boolean - If true it returns the full transaction objects, if false only the hashes of the transactions.

**Returns**

See :ref:`eth.getBlockByHash <getBlockByHash>`.

.. _getTransactionByHash:

eth.getTransactionByHash
++++++++++++++++++++++++

**Parameters**

1. ``String`` (hex), 32 Bytes - hash of a transaction

**Returns**

``Object`` - A transaction object, or null when no transaction was found:

* blockHash: ``String`` (hex), 32 Bytes - hash of the block where this transaction was in. null when its pending.
* blockNumber: ``String`` (hex) - block number where this transaction was in. null when its pending.
* from: ``String`` (hex), 20 Bytes - address of the sender.
* gas: ``String`` (hex) - gas provided by the sender.
* gasPrice: ``String`` (hex) - gas price provided by the sender in Wei.
* hash: ``String`` (hex), 32 Bytes - hash of the transaction.
* input: ``String`` (hex) - the data send along with the transaction.
* nonce: ``String`` (hex) - the number of transactions made by the sender prior to this one.
* to: ``String`` (hex), 20 Bytes - address of the receiver. null when its a contract creation transaction.
* transactionIndex: ``String`` (hex) - integer of the transaction's index position in the block. null when its pending.
* value: ``String`` (hex) - value transferred in Wei.
* v: ``String`` (hex) - ECDSA recovery id
* r: ``String`` (hex) - ECDSA signature r
* s: ``String`` (hex) - ECDSA signature s

eth.getTransactionByBlockHashAndIndex
+++++++++++++++++++++++++++++++++++++

Returns information about a transaction by block hash and transaction index position.

**Parameters**

1. ``String`` (hex), 32 Bytes - hash of a block.
2. ``String`` (hex) - integer of the transaction index position.

**Returns**

See :ref:`eth.getTransactionByHash <getTransactionByHash>`.

eth.getTransactionByBlockNumberAndIndex
+++++++++++++++++++++++++++++++++++++++

Returns information about a transaction by block number and transaction index position.

**Parameters**

1. ``String`` (hex) - a block number, or the string "earliest", "latest" or "pending" (defaults to "latest").
2. ``String`` (hex) - the transaction index position.

**Returns**

See :ref:`eth.getTransactionByHash <getTransactionByHash>`.

.. _getTransactionReceipt:

eth.getTransactionReceipt
+++++++++++++++++++++++++

Returns the receipt of a transaction by transaction hash.

**Parameters**

1. ``String`` (hex), 32 Bytes - hash of a transaction

**Returns**

``Object`` - A transaction receipt object, or null when no receipt was found:

* transactionHash : ``String`` (hex), 32 Bytes - hash of the transaction.
* transactionIndex: ``String`` (hex) - integer of the transaction's index position in the block.
* blockHash: ``String`` (hex), 32 Bytes - hash of the block where this transaction was in.
* blockNumber: ``String`` (hex) - block number where this transaction was in.
* from: ``String`` (hex), 20 Bytes - address of the sender.
* to: ``String`` (hex), 20 Bytes - address of the receiver. null when it's a contract creation transaction.
* cumulativeGasUsed : ``String`` (hex) - The total amount of gas used when this transaction was executed in the block.
* gasUsed : ``String`` (hex) - The amount of gas used by this specific transaction alone.
* contractAddress : ``String`` (hex), 20 Bytes - The contract address created, if the transaction was a contract creation, otherwise null.
* logs: Array - Array of log objects, which this transaction generated.
* logsBloom: ``String`` (hex), 256 Bytes - Bloom filter for light clients to quickly retrieve related logs.

eth.newFilter
+++++++++++++

Creates a filter object, based on filter options, to notify when the state changes (logs). To check if the state has changed, call :ref:`eth.getFilterChanges <getFilterChanges>`.

A note on specifying topic filters:
Topics are order-dependent. A transaction with a log with topics [A, B] will be matched by the following topic filters:

* [] "anything"
* [A] "A in first position (and anything after)"
* [null, B] "anything in first position AND B in second position (and anything after)"
* [A, B] "A in first position AND B in second position (and anything after)"
* [[A, B], [A, B]] "(A OR B) in first position AND (A OR B) in second position (and anything after)"

**Parameters**

Object - The filter options:

* fromBlock: ``String`` (hex) - (optional, default: "latest") Integer block number, or "latest" for the last mined block or "pending", "earliest" for not yet mined transactions.
* toBlock: ``String`` (hex) - (optional, default: "latest") Integer block number, or "latest" for the last mined block or "pending", "earliest" for not yet mined transactions.
* address: ``String`` (hex) | Array, 20 Bytes - (optional) Contract address or a list of addresses from which logs should originate.
* topics: Array of ``String`` (hex), - (optional) Array of 32 Bytes ``String`` (hex) topics. Topics are order-dependent. Each topic can also be an array of ``String`` (hex) with "or" options.

**Returns**

``String`` - A filter id.

**Example**

.. code-block:: javascript

   gateway.eth.newFilter({
     "fromBlock": "0x1",
     "toBlock": "0x2",
     "address": "0x8888f1f195afa192cfee860698584c030f4c9db1",
     "topics": ["0x000000000000000000000000a94f5374fce5edbc8e2a8697c15331677e6ebf0b", null, ["0x000000000000000000000000a94f5374fce5edbc8e2a8697c15331677e6ebf0b", "0x0000000000000000000000000aff3454fce5edbc8cca8697c15331677e6ebccc"]]
   })

eth.newBlockFilter
++++++++++++++++++

Creates a filter in the gateway, to notify when a new block arrives. To check if the state has changed, call :ref:`eth.getFilterChanges <getFilterChanges>`.

**Parameters**

None

**Returns**

``String`` - A filter id.

eth.newPendingTransactionFilter
+++++++++++++++++++++++++++++++

Creates a filter in the node, to notify when new pending transactions arrive. To check if the state has changed, call eth_getFilterChanges.

**Parameters**

None

**Returns**

``String`` - A filter id.

eth.uninstallFilter
++++++++++++++++++++

Uninstalls a filter with given id. Should always be called when watch is no longer needed. Additonally Filters timeout when they aren't requested with eth_getFilterChanges for a period of time.

**Parameters**

1. ``String`` (hex) - The filter id.

**Returns**

``Boolean`` - true if the filter was successfully uninstalled, otherwise false.

.. _getFilterChanges:

eth.getFilterChanges
++++++++++++++++++++

Polling method for a filter, which returns an array of logs which occurred since last poll.

**Parameters**

1. ``String`` (hex) - the filter id.

**Returns**

Array - Array of log objects, or an empty array if nothing has changed since last poll.

* For filters created with eth_newBlockFilter the return are block hashes (``String`` (hex), 32 Bytes), e.g. [``"0x3454645634534..."``].
* For filters created with eth_newPendingTransactionFilter the return are transaction hashes (``String`` (hex), 32 Bytes), e.g. [``"0x6345343454645..."``].
* For filters created with eth_newFilter logs are objects with following params:

  * removed: ``boolean`` - true when the log was removed, due to a chain reorganization. false if its a valid log.
  * logIndex: ``String`` (hex) - integer of the log index position in the block. null when its pending log.
  * transactionIndex: ``String`` (hex) - integer of the transactions index position log was created from. null when its pending log.
  * transactionHash: ``String`` (hex), 32 Bytes - hash of the transactions this log was created from. null when its pending log.
  * blockHash: ``String`` (hex), 32 Bytes - hash of the block where this log was in. null when its pending. null when its pending log.
  * blockNumber: ``String`` (hex) - the block number where this log was in. null when its pending. null when its pending log.
  * address: ``String`` (hex), 20 Bytes - address from which this log originated.
  * data: ``String`` (hex) - contains the non-indexed arguments of the log.
  * topics: Array of ``String`` (hex) - Array of 0 to 4 32 Bytes ``String`` (hex) of indexed log arguments. (In solidity: The first topic is the hash of the signature of the event (e.g. Deposit(address,bytes32,uint256)), except you declared the event with the anonymous specifier.)

eth.getFilterLogs
+++++++++++++++++

Returns an array of all logs matching filter with given id.

**Parameters**

1. ``String`` (hex) - The filter id.

**Returns**

See :ref:`eth_getFilterChanges <getFilterChanges>`.

eth.getLogs
+++++++++++

Returns an array of all logs matching a given filter object.

**Parameters**

``Object`` - The filter options:

* fromBlock: ``String`` - (optional, default: "latest") Integer block number, or "latest" for the last mined block or "pending", "earliest" for not yet mined transactions.
* toBlock: ``String`` - (optional, default: "latest") Integer block number, or "latest" for the last mined block or "pending", "earliest" for not yet mined transactions.
* address: ``String`` (hex) | Array, 20 Bytes - (optional) Contract address or a list of addresses from which logs should originate.
* topics: Array of ``String`` (hex), - (optional) Array of 32 Bytes ``String`` (hex) topics. Topics are order-dependent. Each topic can also be an array of ``String`` (hex) with "or" options.
* blockhash: ``String`` (hex), 32 Bytes - (optional) With the addition of EIP-234 (Geth >= v1.8.13 or Parity >= v2.1.0), blockHash is a new filter option which restricts the logs returned to the single block with the 32-byte hash blockHash. Using blockHash is equivalent to fromBlock = toBlock = the block number with hash blockHash. If blockHash is present in the filter criteria, then neither fromBlock nor toBlock are allowed.

**Returns**

See :ref:`eth_getFilterChanges <getFilterChanges>`.


net.version
+++++++++++

**Parameters**

none

**Returns**

``String`` - the current network id.

* "1": Ethereum Mainnet
* "2": Morden Testnet (deprecated)
* "3": Ropsten Testnet
* "4": Rinkeby Testnet
* "42": Kovan Testnet
* ...
* "42261": Oasis Devnet

net.listening
+++++++++++++

**Parameters**

none

**Returns**

``Boolean`` - true when the gateway is listening for network connections. Otherwise false.

oasi.getExpiry
++++++++++++++

**Parameters**

1. Address: 0x prefixed 20-byte hex string representing the address of the service.

**Returns**

the expiration timestamp for the service.

oasis.getPublicKey
++++++++++++++++++

**Parameters**

1. Address: 0x prefixed 20-byte hex string representing the address of the service for
   which to retrieve the public key.

**Returns**

the public key created by the Key Manager, used for encrypted communication with the service.

Subscriptions
-------------

To make a web3 subscription use the ``eth_subscribe`` method. Unlike other RPCs,
instead of returning the server response, ``eth_subscribe`` will resolve to an
``EventEmitter`` object, emitting events on the ``data`` topic.

For example, to subscribe to logs,

.. code-block:: javascript

   const subscription = await gateway.eth.subscribe('logs', {
     address: '0x...'
     topics: ['0x...']
   });

   subscription.on('data', (event) => {
     // Do something with your event.
   });

To subscribe to new block headers,

.. code-block:: javascript

   const subscription = await gateway.eth.subscribe('newHeads');

   subscription.on('data', (event) => {
     // Do something with your block headers.
   });

To unsubscribe, give the subscription id to the ``eth_unsubscribe`` method. Continuing the
above example,

.. code-block:: javascript

   await gateway.eth.unsubscribe(subscription.id);
