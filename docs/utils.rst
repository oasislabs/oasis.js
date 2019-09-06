.. include:: links.rst

.. _utils:

===================
utils
===================

``oasis.utils`` provides a collection of client utilities.

utils.encrypt
==================
.. code-block:: javascript

   utils.encrypt(
     nonce,
     plaintext,
     peerPublicKey,
     privateKey,
     aad
   );

Parameters
-----------
* ``nonce`` - ``Uint8Array``: The nonce used to encrypt the ciphertext.
* ``plaintext`` - ``Uint8Array``: The text to be encrypted
* ``peerPublicKey`` - ``Uint8Array``: The public key to which the ciphertext will be encrypted.
* ``publicKey`` - ``Uint8Array``: The public key of the entity encrypting the data.
* ``privateKey`` - ``Uint7Array``: The private key of the entity encrypting the data.
* ``aad`` - ``Uint8Array`` the additional authenticated data for the AEAD.

Returns
--------
``Uint8Array``: The encoded wire format of the ciphertext ``PUBLIC_KEY || CIPHER_LENGTH || AAD_LENGTH || CIPHER ||AAD || NONCE``, where ``CIPHER_LENGTH`` AND ``AAD_LENGTH`` are encoded as big endian uint64.

utils.decrypt
==================

Decrypts the given ciphertext using `Deoxysii.js`_ and the wire format specified above.

.. code-block:: javascript

   utils.decrypt(encryption, secretKey);

Parameters
-----------
1. ``encryption`` - ``Uint8Array``: The encrypted data in the wire formated specified above.
2. ``secretKey`` - ``Uint8Array``: The secret key to which the data was encrypted.

Returns
--------

``Object``: The decryption of the object with a key for each component of the decryption.
  * ``nonce`` - ``Uint8Array``: The nonce used to encrypt the ciphertext.
  * ``plaintext`` - ``Uint8Array``: The decrypted ciphertext.
  * ``peerPublicKey`` - ``Uint8Array``: The public key from which the ciphertext encrypted.
  * ``aad`` - ``Uint8Array`` the additional authenticated data for the AEAD.

utils.header.parseHex
========================

.. code-block:: javascript

	oasis.utils.header.parseHex(deploycode);

Parameters
----------
1. ``deploycode`` - ``String``: Hex string representing the deployed bytecode of a service, prefixed with the header wire format:

.. code-block:: javascript

   b'\0sis' || version (2 bytes big endian) || length (2 bytes big endian) || json-header

Returns
--------
``Object``:  The deploy header with all fields.
   * ``version`` - ``number``: The version number of the header.
   * ``expirty`` - ``number``: Service expiry timestamp
   * ``confidential`` -  ``boolean``: True if the service is confidential.

utils.bytes.parseHex
=====================

.. code-block:: javascript

   oasis.utils.bytes.parseHex(hexStr);

Parameters
-----------
1. ``hexStr`` - ``String``: Hex string to parse.

Returns
--------
``Uint8Array``: Transformed representation the given hex string.

utils.bytes.toHex
==================
.. code-block:: javascript

   oasis.utils.bytes.toHex(byteArray);

Parameters
----------
1. ``byteArray`` - ``Uint8Array``: Byte array to convert into a hex string

Returns
--------
``String``: Transformed representation of the given byte array.


utils.bytes.encodeUtf8
======================

.. code-block:: javascript

	oasis.utils.header.encodeUtf8(input);


Parameters
----------
1. ``input`` - ``string``: String to encode into a utf8 encoded byte array

Returns
-------
``Uint8Array``: Utf8 encoded byte earray

utils.bytes.decodeUtf8
======================

.. code-block:: javascript

	oasis.utils.header.decodeUtf8(input);

Parameters
----------
1. ``input`` - ``Uint8Array``: Byte array previously encoded with ``utils.bytes.encodeUtf8``

Returns
-------
``String``: Utf8 encoded string

utils.cbor.encode
=================

.. code-block:: javascript

	oasis.utils.cbor.encode(input);

Parameters
----------
1. ``input`` - ``Object``: JSON object to cbor encode

Returns
-------
``Uint8Array``: Cbor encoded byte array


utils.cbor.decode
=================


.. code-block:: javascript

	oasis.utils.cbor.decode(input);

Parameters
----------
1. ``input`` - ``Uint8Array``: Cbor encoded byte array

Returns
-------
``Object``: Decoded JSON object

utils.keccak256
===============

Keccak256 implementation from `js-sha3 <https://github.com/emn178/js-sha3>`_.

utils.idl.fromWasm
===================

.. code-block:: javascript

	oasis.utils.idl.fromWasm(bytecode);

Parameters
----------
1. ``bytecode`` - ``Uint8Array``: Raw wasi bytecode compiled with ``oasis build``. See the `oasis-cli <https://github.com/oasislabs/oasis-cli>`_.

Returns
-------
``Promise<Object>``: Promise resolving to the Idl extracted from the `oasis-interface` section of the given bytecode.

utils.idl.fromWasmSync
=======================

.. code-block:: javascript

	oasis.utils.idl.fromWasmSync(input);

A synchronous version of ``utils.idl.fromWasm``.
