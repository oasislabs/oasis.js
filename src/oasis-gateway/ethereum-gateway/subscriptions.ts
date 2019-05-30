import { Middleware } from './websocket';

export class Subscriptions implements Middleware {
  /**
   * Maps event names to their subscription ids. Used to implement
   * unsubscribe, as the client frontend knows nothing about the
   * actual subscription id.
   */
  private subscriptionEventIds: Map<string, string> = new Map();

  /**
   * Maps subscriptionId to the callback to invoke whenever a message
   * with that id is handled.
   */
  private subscriptionCallbacks: Map<string, Function> = new Map();

  handle(message: any): any | undefined {
    let data = JSON.parse(message.data);
    if (data.params && data.params.subscription) {
      let callback = this.subscriptionCallbacks.get(
        `${data.params.subscription}`
      );
      if (callback) {
        callback(data);
      }
      return undefined;
    }
    return message;
  }

  add(event: string, subscriptionId: string, callback) {
    this.subscriptionEventIds.set(event, subscriptionId);
    this.subscriptionCallbacks.set(subscriptionId, callback);
  }

  remove(event: string): string | undefined {
    let id = this.subscriptionEventIds.get(event);
    if (!id) {
      return undefined;
    }
    this.subscriptionEventIds.delete(event);
    this.subscriptionCallbacks.delete(id);

    return id;
  }
}
