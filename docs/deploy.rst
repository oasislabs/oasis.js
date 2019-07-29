.. _deploy:

===================
deploy
===================

The ``oasis.deploy`` method deploys a service to the Oasis cloud.

deploy
==================

.. code-block:: javascript

	deploy(options)

----------
options
----------
* ``bytecode`` - ``string | Uint8Array``: The bytecode for the service.
* ``arguments`` - ``Array``: Constructor arguments to pass to the service.
* ``header`` - ``Object`` (optional): The deploy header. See the default values below.
* ``gateway`` - :ref:`OasisGateway <gateways>` (optional): The client backend to communicate with an oasis gateway.
* ``options`` - :ref:`RpcOptions <rpc-options>` (optional): The transaction options to use for deploy.

----------
header
----------
* ``confidential`` - ``boolean`` (optional): True if the service should be confidential. Defaults to true.
* ``expiry`` - ``number`` (optional): Unix timestamp defining when the service expirs. Defaults to 100 years from the current timestamp.

--------------
Returns
--------------
:ref:`Service <service>`: The deployed service instance with all rpc endpoints attached.
