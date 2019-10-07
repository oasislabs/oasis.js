.. _deploy:

===================
deploy
===================

The ``oasis.deploy`` method deploys a service via an Oasis gateway.

deploy
==================

.. code-block:: javascript

	deploy(...args, options)

-------------
Parameters
-------------
1. ``args`` - The positional constructor arguments for the service. Note that the type and number of these arguments depend on the service being constructed.
2. ``options`` - ``Object`` (optional): The service deploy options. Must be the last argument in the deploy function call.

----------
options
----------
* ``bytecode`` - ``string | Uint8Array``: The bytecode for the service.
* ``header`` - ``Object`` (optional): The deploy header. See the default values below.
* ``gateway`` - :ref:`OasisGateway <gateways>` (optional): The client backend to communicate with an oasis gateway.
* ``gasLimit`` - ``string`` | ``number`` (optional): Gas limit to use for the transaction.
* ``value`` - ``string`` | ``number`` (optional): Value to send in the transaction.

----------
header
----------
* ``confidential`` - ``boolean`` (optional): True if the service should be confidential. Defaults to true.
* ``expiry`` - ``number`` (optional): Unix timestamp defining when the service expirs. Defaults to 100 years from the current timestamp.

--------------
Returns
--------------
:ref:`Service <service>`: The deployed service instance with all rpc endpoints attached.
