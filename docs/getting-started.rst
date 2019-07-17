=================
Getting Started
=================

Oasis.js can be used with either of the two clients we provide.

gateway-client
=========================

The gateway-client provides the minimal set of features for interacting
with services through an Oasis gateway.

It includes

* :ref:`oasis.deploy <deploy>`
* :ref:`oasis.setGateway <setGateway>`
* :ref:`oasis.Service <service>`
* :ref:`oasis.gateways.Gateway <gateways>`

To install the gateway-client

Node.js
--------

.. code-block:: javascript

   npm install @oasislabs/gateway-client


Browser
--------
The Oasis CDN hosts the latest version of the library. It can be included in your HTML as follows:

.. code-block:: html

   <script src="https://cdn.oasiscloud.io/oasis-client-latest/gateway-client/index.browser.umd.js"
           charset="utf-8"
           type="text/javascript">
   </script>

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

.. code-block:: html

   <script src="https://cdn.oasiscloud.io/oasis-client-latest/client/index.browser.umd.js"
           charset="utf-8"
           type="text/javascript">
   </script>
