.. _workspace:

========================
workspace
========================

This feature is for node.js only.

The ``oasis.workspace`` namespace provides easy access to the build artifacts
in your local project workspace for **deployment**. This is particularly useful
when testing and is meant to be used when developing `oasis-rs <https://github.com/oasislabs/oasis-rs>`_
services with `oasis-cli <https://github.com/oasislabs/oasis-cli>`_, as it
relies on the oasis-cli configuration file.


Examples
---------

Suppose we have the following service:

.. code-block:: rust

   #[derive(Service)]
   pub struct MyService;

   impl MyService {
       pub fn new(_ctx: &Context, arg1: u64, arg2: u64) -> Result<Self, String> {
           Ok(Self {})
       }
   }

Deploying a service
-------------------

Then you can deploy it with ``oasis.workspace`` as follows:

.. code-block:: javascript

	oasis.workspace.MyService.deploy(arg1, arg2, options);

Where ``arg1`` and ``arg2`` refer to the positional constructor arguments of ``MyService``
and ``options`` is an (optional) instance of :ref:`RpcOptions <rpc-options>`.

Note that the number of arguments will vary per service and the ``options`` must be the **last**
argument given.

Using a gateway
---------------

You can also fetch the gateway specified in your configuration file and set that as your
default gateway. For example,

.. code-block:: javascript

   // Build the gateway object from the workspace configuration file.
   const gateway = await oasis.workspace.gateway();

   // Set the client's default gateway.
   oasis.setGateway(gateway);


Configuration
-------------

The workspace can be configured using a config.toml file to define the gateway and
an optional mnemonic or private key. For example,

.. code-block:: toml

   [profile.default]
   endpoint = 'https://gateway.devnet.oasiscloud.io'
   private_key = ''

   [profile.local]
   endpoint = 'ws://localhost:8546'
   mnemonic = 'range drive remove bleak mule satisfy mandate east lion minimum unfold ready'

Environment Variables
---------------------

Although not recommended (because they are meant to be configured with `oasis-cli <https://github.com/oasislabs/oasis-cli>`_),
one can also override the following environment variables.

* ``OASIS_WORKSPACE`` - Path to the workspace root directory. Defaults to the root directory of the local git repository.
* ``OASIS_PROFILE`` - The config profile to use. Defaults to ``default``.
* ``OASIS_CONFIG`` - Path to the config file to use. Defaults to a system specific path, e.g.
    * macOS and Linux - ``~/.config/oasis/config.toml``

How it works
------------

When ``oasis.workspace`` is first accessed, e.g., via ``oasis.workspace.MyService`` the
client lazily populates the namespace by searching for ``target/service/*.wasm`` files
in your local git repository directory subtree, constructing and attaching the found
service definitions to the namespace.

For an example workspace, see the `template <https://github.com/oasislabs/template>`_.
