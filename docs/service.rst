.. _service:

===================
Service
===================

``oasis.Service`` represents a service deployed on the Oasis network.
Services deployed to the local chain can only interact with other locally-deployed services; integration tests will want to mock third-party services.

To construct a service:

Service
==================

.. code-block:: javascript

	new oasis.Service(idl, address [, options])

-------------
Parameters
-------------
1. ``idl`` - ``Idl``: The json idl defining the service interface
2. ``address`` - ``string | Uint8Array``: The address of the service.
3. ``options`` - ``Object`` (optional):

----------
options
----------
* ``gateway`` - :ref:`OasisGateway <gateways>` (optional): The client backend to communicate with an oasis gateway
* ``db`` - ``Db`` (optional): The persistent storage interface for the client's key manager.

--------------
Returns
--------------
``Service``: A service object with all rpc endpoints attached.

Service.at
==================

A more convenient api to attach to a previously deployed service is the
`Service.at` method, which will fetch the on-chain code and extract the idl
automatciially.

Note: this method should only be with oasis-rs services.


.. code-block:: javascript

	await oasis.Service.at(address [, options])

-------------
Parameters
-------------
1. ``address`` - ``string | Unit8Array``: The address of the service to connect to.
2. ``options`` - ``Object`` (optional): The service deploy options. See above.

--------------
Returns
--------------
``Promise<Service>``: A promise resolving to a service object with all rpc endpoints attached.

------------
Rpc Methods
------------

To make rpc requests to a service, invoke the rpc directly on the service object.
For example,

.. code-block:: javascript

   // Deployed service address.
   const address = ...;

   // Connects to the remote service.
   const service = await Service.at(address);

   // Service specific rpc parameter.
   const argument = 'this is an argument to a Service rpc';

   // RpcOptions.
   const options = { gasLimit: '0xe79732' };

   // Makes an rpc request to `myMethod` and returns the result.
   const returnValue = await service.myMethod(argument, options);

.. note::

   The client will ensure all Service api methods are camelCase, as is idiomatic JavaScript,
   even if your on-chain service uses snake_case, as is idiomatic Rust.

The positional arguments for a given rpc should be passed directly into the method.
In addition, one can **optionally** specify ``RpcOptions``. When used, these options
must be the last argument given to a method.

.. important:: Confidential Services

   When making RPCs to **confidential** services, one **must** specify the ``gasLimit`` option.
   The client can't estimiate the gas limit when state is confidential.

A Service's method call returns only after the transaction has been finalized by the Oasis network.

.. _rpc-options:

RpcOptions
----------
* ``gasLimit`` - ``string`` | ``number`` (optional): Gas limit to use for the transaction.
* ``value`` - ``string`` | ``number`` (optional): Value to send in the transaction.
* ``aad`` - ``string`` (optional): Additional authenticated data exposed to the confidential runtime.

-----------------
addEventListener
-----------------

To listen to events emitted by the service, use the ``addEventListener`` method.

.. code-block:: javascript

   service.addEventListener(event, function listener(event) {
     console.log('Received the event, ' event);
   });

An event is emitted only after the block containing it has been finalized by the Oasis network.

.. note::

   In the same way rpc method names are camelCase, event object keys are camelCase, even if the
   corresponding service is snake_case.

Parameters
----------
1. ``event`` - ``String``: The name of the event.
2. ``listener`` - ``Listener``: A function taking a single event as a parameter.

--------------------
removeEventListener
--------------------

To stop listening to events emitted by the service, use the ``removeEventListener`` method. It's suggested to use this method to properly cleanup gateway subscriptions that result from creating event listeners.

.. code-block:: javascript

   service.removeEventListener(event, listener);

Parameters
----------
1. ``event`` - ``String``: The name of the event.
2. ``listener`` - ``Listener``: The listener function previously given to ``addEventListener``.
