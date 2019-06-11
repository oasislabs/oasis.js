=================
Getting Started
=================

Oasis.js can be used with either of the two clients we provide.

developer-gateway-client
=========================

The developer-gateway-client provides the minimal set of features for interacting
with services through a developer-gateway. TODO: link to a doc on the developer-gateway.

It includes

* :ref:`oasis.deploy <deploy>`
* :ref:`oasis.Service <service>`

To install the developer-gateway-client

Node.js
--------

.. code-block:: javascript

   npm install developer-gateway-client


Browser
--------
We host the latest version of the library here [TODO].


client
========

In addition to the ``developer-gateway-client``, we provide a heavier client that, in addition
to all the features provided by the ``developer-gateway-client`` also provides the ability
to use a client-side wallet and specify web3 transaction options.

It includes

* :ref:`oasis.deploy <deploy>`
* :ref:`oasis.Service <service>`
* :ref:`oasis.gateways <gateways>`
* :ref:`oasis.Wallet <wallet>`
* :ref:`oasis.utils <utils>`

To install the client

Node.js
--------

.. code-block:: javascript

   npm install client


Browser
-------
We host the latest version of the library here [TODO].
