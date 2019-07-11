=================
Getting Started
=================

Oasis.js can be used with either of the two clients we provide.

gateway-client
=========================

The gateway-client provides the minimal set of features for interacting
with services through an Oasis gateway. TODO: link to a doc on the developer-gateway.

It includes

* :ref:`oasis.deploy <deploy>`
* :ref:`oasis.setGateway <setGateway>`
* :ref:`oasis.Service <service>`

To install the gateway-client

Node.js
--------

.. code-block:: javascript

   npm install @oasislabs/gateway-client


Browser
--------
We host the latest version of the library here [TODO].


client
========

In addition to the ``gateway-client``, we provide a heavier client that, in addition
to all the features provided by the ``gateway-client`` also provides the ability
to use a client-side wallet and specify web3 transaction options.

It includes

* :ref:`oasis.deploy <deploy>`
* :ref:`oasis.setGateway <setGateway>`
* :ref:`oasis.Service <service>`
* :ref:`oasis.gateways <gateways>`
* :ref:`oasis.Wallet <wallet>`
* :ref:`oasis.utils <utils>`

To install the client

Node.js
--------

.. code-block:: javascript

   npm install @oasislabs/client


Browser
-------
We host the latest version of the library here [TODO].
