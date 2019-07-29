// Mocks the bytes types, e.g. PublicKey.
class Bytes {
  constructor(inner) {
    this.inner = inner;
  }
  bytes() {
    return this.inner;
  }
}
