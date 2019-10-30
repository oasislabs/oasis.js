import { bytes } from '@oasislabs/common';

export type DeployHeaderOptions = {
  expiry?: number;
  confidential?: boolean;
};

export class DeployHeaderError extends Error {}

// TODO: change all apis here to take Uint8Arrays as input/output instead
//       of hex strings.
export class DeployHeader {
  /**
   * @param {Number} version is the header version number.
   * @param {Object} is the header body with two fields, expiry (Number)
   *        and confidential (boolean).
   */
  constructor(public version: number, public body: DeployHeaderOptions) {}

  public static parseFromCode(
    deploycode: Uint8Array | string
  ): DeployHeader | null {
    const _deploycode: Uint8Array =
      typeof deploycode === 'string' ? bytes.parseHex(deploycode) : deploycode;
    return DeployHeaderReader.header(_deploycode);
  }

  data(): Uint8Array {
    const bodyBytes = DeployHeaderWriter.body(this.body);
    return new Uint8Array(
      bytes.concat([
        DeployHeader.prefix(),
        DeployHeaderWriter.shortToBytes(this.version),
        DeployHeaderWriter.shortToBytes(bodyBytes.length),
        bodyBytes,
      ])
    );
  }

  /**
   * @param   {Object} headerBody is the header object to encode.
   * @param   {Uint8Array} deploycode is the bytecode to which we want to prefix the header.
   * @returns The deploycode with the header prefixed as the encoded wire format, i.e.,
   *          b'\0sis' || version (2 bytes big endian) || length (2 bytes big endian) || json-header.
   *          Overrides any header fields that may already exist in the deploycode.
   */
  public static deployCode(
    headerBody: DeployHeaderOptions,
    deploycode: Uint8Array
  ): Uint8Array {
    DeployHeader.deployCodePreconditions(headerBody, deploycode);

    if (Object.keys(headerBody).length === 0) {
      return deploycode; // No header, so do nothing.
    }

    // Read the existing header, if it exists.
    let currentHeader = DeployHeaderReader.header(deploycode);
    // Bytecode to create the contract without the serialized deploy header prepended.
    let initcode: Uint8Array;
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

    const headerData = currentHeader.data();
    const code = new Uint8Array(headerData.length + initcode.length);
    code.set(headerData);
    code.set(initcode, headerData.length);

    return code;
  }

  private static deployCodePreconditions(
    headerBody: DeployHeaderOptions,
    deploycode: Uint8Array
  ) {
    if (!headerBody) {
      throw new Error('No header given');
    }
    if (deploycode.length === 0) {
      throw new Error('Malformed deploycode');
    }
    if (!DeployHeader.isValidBody(headerBody)) {
      throw new Error('Malformed deploycode or header');
    }
  }

  /**
   * @returns true iff the keys in the headerBody are part of the valid set.
   */
  public static isValidBody(headerBody: DeployHeaderOptions): boolean {
    const validKeys = ['expiry', 'confidential'];

    const keys = Object.keys(headerBody);
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

  public static prefix(): Uint8Array {
    return bytes.encodeUtf8('\0sis');
  }
}

/**
 * A collection of utilities for parsing through deploycode including the Oasis contract
 * deploy header in the form of a hex string.
 */
export class DeployHeaderReader {
  /**
   * @param   {String} deploycode is the transaction data to deploy a contract as a hex string.
   * @returns the contract deploy header prefixed to the deploycode, otherwise, null.
   */
  public static header(deploycode: Uint8Array): DeployHeader | null {
    if (!DeployHeaderReader.codeHasPrefixPrefix(deploycode)) {
      return null;
    }
    const version = DeployHeaderReader.version(deploycode);
    const body = DeployHeaderReader.body(deploycode);

    if (!DeployHeader.isValidBody(body)) {
      throw Error(`Invalid body ${JSON.stringify(body)}`);
    }

    return new DeployHeader(version, body);
  }
  /**
   * @param {Uint8Array} deploycode is a hex string of the header || initcode.
   */
  public static body(deploycode: Uint8Array): DeployHeaderOptions {
    if (!DeployHeaderReader.codeHasPrefixPrefix(deploycode)) {
      throw new DeployHeaderError('code must have the header prefiix');
    }

    const length = DeployHeaderReader.size(deploycode);
    const serializedBody = deploycode.subarray(
      DeployHeaderReader.bodyStart(),
      DeployHeaderReader.bodyStart() + length
    );

    return JSON.parse(bytes.decodeUtf8(serializedBody));
  }

  /**
   * @param {String} deploycode is a hex string of the header || initcode.
   */
  public static size(deploycode: Uint8Array): number {
    if (!DeployHeaderReader.codeHasPrefixPrefix(deploycode)) {
      throw new DeployHeaderError('code must have the header prefix');
    }

    const start = DeployHeaderReader.sizeStart();
    const lengthBytes = deploycode.subarray(
      start,
      start + DeployHeaderReader.sizeLength()
    );

    return DeployHeaderReader.shortFromBytes(lengthBytes);
  }

  /**
   * @param {String} deploycode is a hex string of the header || initcode.
   */
  public static version(deploycode: Uint8Array): number {
    if (!DeployHeaderReader.codeHasPrefixPrefix(deploycode)) {
      throw new DeployHeaderError('code must have the header prefix');
    }

    const start = DeployHeaderReader.versionStart();
    const versionBytes = deploycode.subarray(
      start,
      start + DeployHeaderReader.versionLength()
    );

    return DeployHeaderReader.shortFromBytes(versionBytes);
  }

  /**
   * @param {String} deploycode is a hex string of the header || initcode.
   */
  public static initcode(deploycode: Uint8Array): Uint8Array {
    if (!DeployHeaderReader.codeHasPrefixPrefix(deploycode)) {
      throw new DeployHeaderError('code must have the header prefix');
    }
    return deploycode.subarray(DeployHeaderReader.initcodeStart(deploycode));
  }

  private static initcodeStart(deploycode: Uint8Array): number {
    if (!DeployHeaderReader.codeHasPrefixPrefix(deploycode)) {
      throw new DeployHeaderError('code must have the header prefix');
    }
    return DeployHeaderReader.bodyStart() + DeployHeaderReader.size(deploycode);
  }

  /**
   * @param {Uint8Array} the 2-byte representation of the input.
   * @returns {Number} an unsigned 16-bit number.
   */
  public static shortFromBytes(arr: Uint8Array): number {
    return new DataView(arr.buffer).getUint16(
      arr.byteOffset,
      false /* little endian */
    );
  }

  public static codeHasPrefixPrefix(code: Uint8Array): boolean {
    const prefix = DeployHeader.prefix();
    for (let i = 0; i < prefix.length; i++) {
      if (code[i] !== prefix[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * @returns the hex string index of the start section.
   */
  private static versionStart(): number {
    return DeployHeader.prefix().length;
  }

  /**
   * @returns the length of the version in bytes.
   */
  public static versionLength(): number {
    return 2;
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
   * @returns the length of the body size in bytes.
   */
  private static sizeLength(): number {
    return 2;
  }

  /**
   * @returns the hex string index of the body section.
   */
  private static bodyStart(): number {
    return DeployHeaderReader.sizeStart() + DeployHeaderReader.sizeLength();
  }
}

export class DeployHeaderWriter {
  public static body(body: DeployHeaderOptions): Uint8Array {
    return bytes.encodeUtf8(JSON.stringify(body));
  }

  /**
   * @param {Number} an unsigned 16-bit number.
   * @returns {Uint8Array} the 2-byte representation of the input.
   */
  public static shortToBytes(num: number): Uint8Array {
    const arr = new Uint8Array(2);
    new DataView(arr.buffer).setUint16(
      0 /* offset */,
      num,
      false /* little endian */
    );
    return arr;
  }
}
