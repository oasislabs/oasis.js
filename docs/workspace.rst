.. _workspace:

========================
workspace
========================

Note: this feature is for node.js only.

The ``oasis.workspace`` namespace provides easy access to the build artifacts
in your local project workspace for **deployment**. This is particularly useful
when testing.

When ``oasis.workspace`` is first accessed, e.g., for some service named ``MyService``
via ``oasis.workspace.MyService`` the client lazily populates the namespace by searching
for ``target/service/*.wasm`` files in your local git repository directory subtree,
constructing and attaching the found service definitions to the namespace.

For an example workspace, see the `template <https://github.com/oasislabs/template>`_.

Example
--------

Suppose we have the following service:

.. code-block:: rust

   #[derive(Service)]
   pub struct MyService;

   impl MyService {
       pub fn new(_ctx: &Context, arg1: u64, arg2: u64) -> Result<Self, String> {
           Ok(Self {})
       }
   }

Then we can deploy it with ``oasis.workspace`` as follows:

.. code-block:: javascript

	oasis.workspace.MyService.deploy(arg1, arg2, options);

Where ``arg1`` and ``arg2`` refer to the positional constructor arguments of ``MyService``
and ``options`` is an (optional) instance of :ref:`RpcOptions <rpc-options>`.

Note that the number of arguments will vary per service and the ``options`` must be the **last**
argument given.


Config
------

The workspace can be configured in one of two ways

* set the the default gateway on the client via :ref:`oasis.setGateway <setGateway>`
* use a config.toml file to define the gateway (TODO: fill in this section once CLI flow is documented).

Environment Variables
---------------------

Although not recommended, one can also override the following environment variables, if needed.

* ``OASIS_WORKSPACE`` - Path to the workspace root directory. Defaults to the local git repositories root directory.
* ``OASIS_PROFILE`` - The config profile to use. Defaults to ``default``.
* ``OASIS_CONFIG`` - Path to the config file to use. Defaults to a system specific path, e.g.
    * macOS - ``~/Library/Preferences/oasis/config.toml``
    * Linux - ``~/.config/oasis/config.toml'``
