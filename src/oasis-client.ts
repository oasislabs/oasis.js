/**
 * This is a DummyClass.
 */
export default class DummyClass {
  /**
   * This is an x variable.
   */
  x: string;

  constructor(x: string) {
    this.x = x;
  }

  public hi() {
    console.log(this.x);
  }
}

let d = new DummyClass('hello world!!!!!');

d.hi();
