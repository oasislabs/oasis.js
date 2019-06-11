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

------------
Rpc Methods
------------

To make rpc requests to a service, invoke the rpc directly on the service object.
For example,

.. code-block:: javascript

   // Interface definition.
   const idl = ...;

   // Deployed service address.
   const address = ...;

   // Connects to the remote service.
   const service = new Service(idl, address);

   // Makes an rpc request to `myMethod` and returns the result.
   const returnValue = await service.myMethod();


-----------------
addEventListener
-----------------

To listen to events emitted by the service, use the ``addEventListener`` method.

.. code-block:: javascript

   service.addEventListener('myEvent', (event) => {
     console.log('Received the event, ' event);
   });
