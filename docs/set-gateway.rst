.. _setGateway:

=========================
setGateway
=========================

The ``oasis.setGateway`` method connects the client so that all service communication is done through the given :ref:`OasisGateway <gateways>`. This method must be called before interacting with any services.

setGateway
=========================
.. code-block:: javascript

   oasis.setGateway(gateway)

----------
Parameters
----------
1. ``gateway`` - :ref:`OasisGateway <gateways>`: The gateway to facilitate all service communications.
