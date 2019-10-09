export interface Db {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

export class LocalStorage implements Db {
  private storage: any;

  constructor() {
    // Node.
    if (typeof window === 'undefined') {
      this.storage = require('node-localstorage').LocalStorage('.oasis');
    }
    // Browser.
    else {
      this.storage = localStorage;
    }
  }
  get(key: string): string | undefined {
    return this.storage.getItem(key);
  }

  set(key: string, value: string) {
    this.storage.setItem(key, value);
  }
}

export class DummyStorage implements Db {
  private storage: Map<string, string>;

  constructor() {
    this.storage = new Map();
  }

  get(key: string): string | undefined {
    return this.storage.get(key);
  }

  set(key: string, value: string) {
    this.storage.set(key, value);
  }
}
