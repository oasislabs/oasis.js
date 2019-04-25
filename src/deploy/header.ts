const assert = require('assert');
const bytes = require('./bytes');
const utils = require('./utils');

export default class DeployHeader {
  /**
   * @param {Number} version is the header version number.
   * @param {Object} is the header body with two fields, expiry (Number)
   *        and confidential (boolean).
   */
  constructor(private version: number, private body: DeployHeaderContent) {}

  data(): string {
    let version = DeployHeaderHexWriter.version(this.version);
    let body = DeployHeaderHexWriter.body(this.body);

    assert.equal(body.length % 2, 0);

    let length = DeployHeaderHexWriter.size(body);

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
  static deployCode(
    headerBody: DeployHeaderContent,
    deploycode: string
  ): string {
    DeployHeader.deployCodePreconditions(headerBody, deploycode);

    if (Object.keys(headerBody).length === 0) {
      return deploycode;
    }

    // Read the existing header, if it exists.
    let currentHeader = DeployHeaderHexReader.header(deploycode);
    // Hex code to create the contract without the serialized deploy header prepended.
    let initcode;
    // No header so just make a new one. The initcode is the given deploycode.
    if (currentHeader === null) {
      currentHeader = new DeployHeader(DeployHeader.currentVersion(), {});
      initcode = deploycode;
    }
    // Extract the initcode from the deploy code.
    else {
      initcode = DeployHeaderHexReader.initcode(deploycode);
    }
    if (headerBody) {
      Object.assign(currentHeader.body, headerBody);
    }

    return currentHeader.data() + initcode.substr(2);
  }

  static deployCodePreconditions(
    headerBody: DeployHeaderContent,
    deploycode: string
  ) {
    if (!deploycode.startsWith('0x')) {
      throw Error('Malformed deploycode');
    }
    if (!headerBody) {
      throw Error('No header given');
    }
    if (!DeployHeader.isValidBody(headerBody)) {
      throw Error('Malformed deploycode or header');
    }
  }

  /**
   * @returns true iff the keys in the headerBody are part of the valid set.
   */
  static isValidBody(headerBody: DeployHeaderContent): boolean {
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
  static currentVersion(): number {
    return 1;
  }

  /**
   * Hex representation of b'\0sis'.
   */
  static prefix(): string {
    return '00736973';
  }
}

type DeployHeaderContent = {
  expiry?: number;
  confidential?: boolean;
};

/**
 * A collection of utilities for parsing through deploycode including the Oasis contract
 * deploy header in the form of a hex string.
 */
export class DeployHeaderHexReader {
  /**
   * @param   {String} deploycode is the transaction data to deploy a contract as a hex string.
   * @returns the contract deploy header prefixed to the deploycode, otherwise, null.
   */
  static header(deploycode: string): DeployHeader {
    if (!deploycode.startsWith('0x' + DeployHeader.prefix())) {
      return null;
    }
    let version = DeployHeaderHexReader.version(deploycode);
    let body = DeployHeaderHexReader.body(deploycode);

    if (!DeployHeader.isValidBody(body)) {
      throw Error(`Invalid body ${body}`);
    }

    return new DeployHeader(version, body);
  }
  /**
   * @param {String} deploycode is a hex string of the header || initcode.
   */
  static body(deploycode: string): DeployHeaderContent {
    assert.equal(true, deploycode.startsWith('0x' + DeployHeader.prefix()));

    let length = DeployHeaderHexReader.size(deploycode);
    let serializedBody = deploycode.substr(
      DeployHeaderHexReader.bodyStart(),
      length * 2
    );

    return JSON.parse(Buffer.from(serializedBody, 'hex').toString('utf8'));
  }

  /**
   * @param {String} deploycode is a hex string of the header || initcode.
   */
  static size(deploycode: string): number {
    assert.equal(true, deploycode.startsWith('0x' + DeployHeader.prefix()));

    let length = deploycode.substr(
      DeployHeaderHexReader.sizeStart(),
      DeployHeaderHexReader.sizeLength()
    );

    return parseInt('0x' + length);
  }

  /**
   * @param {String} deploycode is a hex string of the header || initcode.
   */
  static version(deploycode: string): number {
    assert.equal(true, deploycode.startsWith('0x' + DeployHeader.prefix()));

    let version = deploycode.substr(
      DeployHeaderHexReader.versionStart(),
      DeployHeaderHexReader.versionLength()
    );

    return parseInt('0x' + version);
  }

  /**
   * @param {String} deploycode is a hex string of the header || initcode.
   */
  static initcode(deploycode: string): string {
    assert.equal(true, deploycode.startsWith('0x' + DeployHeader.prefix()));

    return (
      '0x' + deploycode.substr(DeployHeaderHexReader.initcodeStart(deploycode))
    );
  }

  static initcodeStart(deploycode: string): number {
    assert.equal(true, deploycode.startsWith('0x' + DeployHeader.prefix()));

    // Make sure to convert the "length" to nibbles, since it's in units of bytes.
    return (
      DeployHeaderHexReader.bodyStart() +
      DeployHeaderHexReader.size(deploycode) * 2
    );
  }

  /**
   * @returns the hex string index of the start section.
   */
  static versionStart(): number {
    return 2 + DeployHeader.prefix().length;
  }

  /**
   * @returns the length of the version in nibbles.
   */
  static versionLength(): number {
    return 2 * 2;
  }

  /**
   * @returns the index of the starting point of the size section.
   */
  static sizeStart(): number {
    return (
      DeployHeaderHexReader.versionStart() +
      DeployHeaderHexReader.versionLength()
    );
  }

  /**
   * @returns the length of the header size in nibbles.
   */
  static sizeLength(): number {
    return 2 * 2;
  }

  /**
   * @returns the hex string index of the body section.
   */
  static bodyStart(): number {
    return (
      DeployHeaderHexReader.sizeStart() + DeployHeaderHexReader.sizeLength()
    );
  }
}

export class DeployHeaderHexWriter {
  static size(body: string): string {
    return bytes.toHex(bytes.parseNumber(body.substr(2).length / 2, 2));
  }

  static version(version: number): string {
    return bytes.toHex(
      bytes.parseNumber(version, DeployHeaderHexReader.versionLength() / 2)
    );
  }

  static body(body: DeployHeaderContent): string {
    return '0x' + Buffer.from(JSON.stringify(body), 'utf8').toString('hex');
  }
}
