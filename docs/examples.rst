===========
Examples
===========

Here we walk through a workflow demonstrating the core apis provided by the client.

Set the gateway
===============
First, one must select an Oasis gateway, for example, a `Developer Gateway <https://todo>`_.

.. code-block:: javascript

   const oasis = require('@oasislabs/client');

   // Create a gateway at the given url.
   const gateway = new oasis.gateways.Gateway('[TODO: URL]')

   // Connect the library to the gateway.
   oasis.setGateway(gateway);

Deploy
==========

After connecting, one can deploy a new service.

.. code-block:: javascript

   // Interface definition.
   const idl = ...;

   // Service bytecode.
   const bytecode = ...;

   // Service constructor args.
   const arguments = [];

   // Deploy it through the connected gateway.
   oasis.deploy(
      idl,
      bytecode,
      arguments,
   ).then((service) => {
     // do something with the service.
   });

Service
===================

Alternatively, one can connect to a previously deployed Service.

.. code-block:: javascript

   // On-chain address of the service
   const address = '...';

   // Interface definition of the service.
   const idl = ...;

   // Connect to the service.
   const service = new oasis.Service(idl, address);

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

   service.addEventListener('myEvent', (event) => {
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
	const privateKey = '...';

	// Wallet for signing and paying for transactions.
	const wallet = new oasis.Wallet(privateKey);

	// Etheruem gateway responsible for signing transactions.
	const gateway = new oasis.gateways.Web3Gateway('https://web3.oasiscloud.io', wallet);

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
