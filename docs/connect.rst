.. _connect:

=========================
connect
=========================

The ``oasis.connect`` method connects the client so that all service communication is done through the given :ref:`OasisGateway <gateways>`. This method must be called before interacting with any services.

connect
=========================
.. code-block:: javascript

   oasis.connect(gateway)

----------
Parameters
----------
1. ``gateway`` - :ref:`OasisGateway <gateways>`: The gateway to facilitate all service communications.
