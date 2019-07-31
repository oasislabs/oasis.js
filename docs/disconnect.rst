.. _disconnect:

===================
disconnect
===================

The ``oasis.disconnect`` method disconnects the client from the default :ref:`OasisGateway <gateways>`, set via :ref:`oasis.setGateway <setGateway>`. When using websockets, this method should be called to clean up any outstanding connections, e.g., when testing.


disconnect
==================

.. code-block:: javascript

	oasis.disconnect()
