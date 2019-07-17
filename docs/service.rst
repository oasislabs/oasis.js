.. _service:

===================
Service
===================

``oasis.Service`` objects represent deployed services running on the Oasis cloud.

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
`Service.at` method, which will fetch the on-chain code extract the idl
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

   // Makes an rpc request to `myMethod` and returns the result.
   const returnValue = await service.myMethod();


-----------------
addEventListener
-----------------

To listen to events emitted by the service, use the ``addEventListener`` method.

.. code-block:: javascript

   service.addEventListener(event, function listener(event) {
     console.log('Received the event, ' event);
   });

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
