===========
Examples
===========

.. include:: links.rst

Here we walk through a workflow demonstrating the core apis provided by the client.
These examples assume an `oasis-rs <https://github.com/oasislabs/oasis-rs>`_
service is being used.

Set the gateway
===============
First, one must select a gateway, for example, the `Oasis Gateway <https://github.com/oasislabs/developer-gateway>`_.

.. code-block:: javascript

   const oasis = require('@oasislabs/client');

   // Create a gateway at the given url.
   const gateway = new oasis.gateways.Gateway('https://gateway.devnet.oasiscloud.io')

   // Connect the library to the gateway.
   oasis.setGateway(gateway);

Deploy
==========

After connecting, one can deploy a new service.

.. code-block:: javascript

   // Service bytecode read directly from a .wasm file compiled with `oasis build`.
   const bytecode = require('fs').readFileSync('/path/to/target/service/my-service.wasm');

   // Service constructor args.
   const arg = "this is an argument";

   // Deploy it through the connected gateway.
   const service = await oasis.deploy(arg, {
      bytecode,
   });

Service
===================

Alternatively, one can connect to a previously deployed Service.

.. code-block:: javascript

   // On-chain address of the service (dummy address used here);.
   const address = new oasis.Address('0x288e7e1cc60962f40d4d782950470e3705c5acf4');

   // Connect to the service.
   const service = await oasis.Service.at(address);

RPC
==========

Once you've connected to a service, either by deploying or by connecting to an
existing service, one can execute function calls on that service.

To make an rpc to a service

.. code-block:: javascript

   const returnValue = await service.myMethod();

Event Listeners
===============

In addition to rpcs, one can register event listeners.

.. code-block:: javascript

   service.addEventListener('MyEvent', (event) => {
     // do something...
   });

Wallets and Web3 Gateways
=============================

In the examples above, we've used a Gateway to pay for and sign transactions.
This is useful when you want the client to operate without a wallet, but sometimes you
want more control. In such cases, it's suggested to use a wallet and web3 gateway which
will allow the client to sign and send raw transactions.

.. code-block:: javascript

	const oasis = require('@oasislabs/client');

	// Wallet private key.
	const privateKey = '0x1ad288d73cd2fff6ecf0a5bf167f59e9944559cd70f66cb70170702a0b4f3bd5';

	// Wallet for signing and paying for transactions.
	const wallet = new oasis.Wallet(privateKey);

	// Etheruem gateway responsible for signing transactions.
	const gateway = new oasis.gateways.Web3Gateway('wss://web3.devnet.oasiscloud.io/ws', wallet);

	// Configure the gateway to use.
	oasis.setGateway(gateway);

Web3 Options
===============

When using a wallet and web3 gateway, one can also specify the options for the transaction.
This is especially useful when working with confidential services, because the gasLimit *must*
be explicitly supplied (estimate gas isn't provided for confidential services).

Note that the web3 options must always be the *last* argument given to
an rpc method, after all rpc specific arguments.

.. code-block:: javascript

   service.myMethod({
     gasLimit: '0xf00000',
   });
