import { Bytes } from '@oasislabs/types';
import { bytes } from '@oasislabs/common';

import * as assert from 'assert';

export type DeployHeaderOptions = {
  expiry?: number;
  confidential?: boolean;
};

export class DeployHeader {
  /**
   * @param {Number} version is the header version number.
   * @param {Object} is the header body with two fields, expiry (Number)
   *        and confidential (boolean).
   */
  constructor(public version: number, public body: DeployHeaderOptions) {}

  data(): string {
    let version = DeployHeaderWriter.version(this.version);
    let body = DeployHeaderWriter.body(this.body);

    assert.strictEqual(body.length % 2, 0);

    let length = DeployHeaderWriter.size(body);

    if (length.substr(2).length > 4) {
      throw new Error(
        'Length of the contract deploy header must be no greater than two bytes'
      );
    }

    return (
      '0x' +
      DeployHeader.prefix() +
      version.substr(2) +
      length.substr(2) +
      body.substr(2)
    );
  }

  /**
   * @param   {Object} headerBody is the header object to encode.
   * @param   {String} deploycode is a hex string of the current code to which we
   *          want to prefix the header.
   * @returns The deploycode with the header prefixed as the encoded wire format, i.e.,
   *          b'\0sis' || version (2 bytes little endian) || length (2 bytes little endian) || json-header.
   *          Overrides any header fields that may already exist in the deploycode.
   */
  public static deployCode(
    headerBody: DeployHeaderOptions,
    deploycode: Bytes
  ): Bytes {
    if (typeof deploycode !== 'string') {
      deploycode = bytes.toHex(deploycode);
    }
    DeployHeader.deployCodePreconditions(headerBody, deploycode);

    if (Object.keys(headerBody).length === 0) {
      // All apis should return buffers not hex strings.
      return bytes.parseHex(deploycode.substr(2));
    }

    // Read the existing header, if it exists.
    let currentHeader = DeployHeaderReader.header(deploycode);
    // Hex code to create the contract without the serialized deploy header prepended.
    let initcode;
    // No header so just make a new one. The initcode is the given deploycode.
    if (currentHeader === null) {
      currentHeader = new DeployHeader(DeployHeader.currentVersion(), {});
      initcode = deploycode;
    }
    // Extract the initcode from the deploy code.
    else {
      initcode = DeployHeaderReader.initcode(deploycode);
    }
    if (headerBody) {
      Object.assign(currentHeader.body, headerBody);
    }

    let code = currentHeader.data() + initcode.substr(2);
    // All apis should return buffers not hex strings.
    return bytes.parseHex(code.substr(2));
  }

  private static deployCodePreconditions(
    headerBody: DeployHeaderOptions,
    deploycode: string
  ) {
    if (!deploycode.startsWith('0x')) {
      throw new Error('Malformed deploycode');
    }
    if (!headerBody) {
      throw new Error('No header given');
    }
    if (!DeployHeader.isValidBody(headerBody)) {
      throw new Error('Malformed deploycode or header');
    }
  }

  /**
   * @returns true iff the keys in the headerBody are part of the valid set.
   */
  public static isValidBody(headerBody: DeployHeaderOptions): boolean {
    let validKeys = ['expiry', 'confidential'];

    let keys = Object.keys(headerBody);
    for (let k = 0; k < keys.length; k += 1) {
      if (!validKeys.includes(keys[k])) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns the current version of the header.
   */
  public static currentVersion(): number {
    return 1;
  }

  /**
   * Hex representation of b'\0sis'.
   */
  public static prefix(): string {
    return '00736973';
  }
}

/**
 * A collection of utilities for parsing through deploycode including the Oasis contract
 * deploy header in the form of a hex string.
 */
// TODO: change return values to be Bytes.
export class DeployHeaderReader {
  /**
   * @param   {String} deploycode is the transaction data to deploy a contract as a hex string.
   * @returns the contract deploy header prefixed to the deploycode, otherwise, null.
   */
  public static header(deploycode: Bytes): DeployHeader | null {
    if (typeof deploycode !== 'string') {
      deploycode = bytes.toHex(deploycode);
    }

    if (!deploycode.startsWith('0x' + DeployHeader.prefix())) {
      return null;
    }
    let version = DeployHeaderReader.version(deploycode);
    let body = DeployHeaderReader.body(deploycode);

    if (!DeployHeader.isValidBody(body)) {
      throw Error(`Invalid body ${JSON.stringify(body)}`);
    }

    return new DeployHeader(version, body);
  }
  /**
   * @param {String} deploycode is a hex string of the header || initcode.
   */
  public static body(deploycode: Bytes): DeployHeaderOptions {
    if (typeof deploycode !== 'string') {
      deploycode = bytes.toHex(deploycode);
    }

    assert.strictEqual(
      true,
      deploycode.startsWith('0x' + DeployHeader.prefix())
    );

    let length = DeployHeaderReader.size(deploycode);
    let serializedBody = deploycode.substr(
      DeployHeaderReader.bodyStart(),
      length * 2
    );

    return JSON.parse(bytes.decodeUtf8(bytes.parseHex(serializedBody)));
  }

  /**
   * @param {String} deploycode is a hex string of the header || initcode.
   */
  public static size(deploycode: Bytes): number {
    if (typeof deploycode !== 'string') {
      deploycode = bytes.toHex(deploycode);
    }

    assert.strictEqual(
      true,
      deploycode.startsWith('0x' + DeployHeader.prefix())
    );

    let length = deploycode.substr(
      DeployHeaderReader.sizeStart(),
      DeployHeaderReader.sizeLength()
    );

    return parseInt('0x' + length, 16);
  }

  /**
   * @param {String} deploycode is a hex string of the header || initcode.
   */
  public static version(deploycode: Bytes): number {
    if (typeof deploycode !== 'string') {
      deploycode = bytes.toHex(deploycode);
    }

    assert.strictEqual(
      true,
      deploycode.startsWith('0x' + DeployHeader.prefix())
    );

    let version = deploycode.substr(
      DeployHeaderReader.versionStart(),
      DeployHeaderReader.versionLength()
    );

    return parseInt('0x' + version, 16);
  }

  /**
   * @param {String} deploycode is a hex string of the header || initcode.
   */
  public static initcode(deploycode: Bytes): string {
    if (typeof deploycode !== 'string') {
      deploycode = bytes.toHex(deploycode);
    }

    assert.strictEqual(
      true,
      deploycode.startsWith('0x' + DeployHeader.prefix())
    );

    return (
      '0x' + deploycode.substr(DeployHeaderReader.initcodeStart(deploycode))
    );
  }

  private static initcodeStart(deploycode: Bytes): number {
    if (typeof deploycode !== 'string') {
      deploycode = bytes.toHex(deploycode);
    }

    assert.strictEqual(
      true,
      deploycode.startsWith('0x' + DeployHeader.prefix())
    );

    // Make sure to convert the "length" to nibbles, since it's in units of bytes.
    return (
      DeployHeaderReader.bodyStart() + DeployHeaderReader.size(deploycode) * 2
    );
  }

  /**
   * @returns the hex string index of the start section.
   */
  private static versionStart(): number {
    return 2 + DeployHeader.prefix().length;
  }

  /**
   * @returns the length of the version in nibbles.
   */
  public static versionLength(): number {
    return 2 * 2;
  }

  /**
   * @returns the index of the starting point of the size section.
   */
  private static sizeStart(): number {
    return (
      DeployHeaderReader.versionStart() + DeployHeaderReader.versionLength()
    );
  }

  /**
   * @returns the length of the header size in nibbles.
   */
  private static sizeLength(): number {
    return 2 * 2;
  }

  /**
   * @returns the hex string index of the body section.
   */
  private static bodyStart(): number {
    return DeployHeaderReader.sizeStart() + DeployHeaderReader.sizeLength();
  }
}

// TODO: change return values to be Bytes.
export class DeployHeaderWriter {
  public static size(body: Bytes): string {
    if (typeof body !== 'string') {
      body = bytes.toHex(body);
    }
    return bytes.toHex(bytes.parseNumber(body.substr(2).length / 2, 2));
  }

  public static version(version: number): string {
    return bytes.toHex(
      bytes.parseNumber(version, DeployHeaderReader.versionLength() / 2)
    );
  }

  public static body(body: DeployHeaderOptions): string {
    return bytes.toHex(bytes.encodeUtf8(JSON.stringify(body)));
  }
}

// Alias.
function parseHex(deploycode: Bytes): DeployHeader | null {
  return DeployHeaderReader.header(deploycode);
}

// Convenience api export.
export const header = {
  parseHex
};
