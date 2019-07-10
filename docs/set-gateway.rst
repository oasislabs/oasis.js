.. _setGateway:

=========================
setGateway
=========================

The ``oasis.setGateway`` method configures the client so that all service communication is done through the given :ref:`OasisGateway <gateways>`. This method should be called before interacting with any services.

setGateway
=========================
.. code-block:: javascript

   oasis.setGateway(gateway)

----------
Parameters
----------
1. ``gateway`` - :ref:`OasisGateway <gateways>`: The gateway to facilitate all service communications.
