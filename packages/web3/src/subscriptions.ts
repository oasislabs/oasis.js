import { Middleware } from './websocket';

export class Subscriptions implements Middleware {
  /**
   * Maps subscriptionId to the callback to invoke whenever a message
   * with that id is handled.
   */
  private subscriptionCallbacks: Map<string, Function> = new Map();

  handle(message: any): any | undefined {
    const data = JSON.parse(message.data);
    if (data.params && data.params.subscription) {
      const callback = this.subscriptionCallbacks.get(
        `${data.params.subscription}`
      );
      if (callback) {
        callback(data);
      }
      return undefined;
    }
    return message;
  }

  add(subscriptionId: string, callback: Function) {
    this.subscriptionCallbacks.set(subscriptionId, callback);
  }

  remove(id: string) {
    this.subscriptionCallbacks.delete(id);
  }
}
