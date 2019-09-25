/**
 * The api module defines the types used for the v0/api of the developer
 * gateway.
 */

/**
 * DeveloperGatewayApi represents the path for a URI for the developer gateway.
 */
export type DeveloperGatewayApi = {
  url: string;
  method: string;
};

/**
 * Deploys a services.
 */
export const DeployApi: DeveloperGatewayApi = {
  url: 'v0/api/service/deploy',
  method: 'POST',
};

/**
 * Invokes an rpc on a service.
 */
export const RpcApi: DeveloperGatewayApi = {
  url: 'v0/api/service/execute',
  method: 'POST',
};

/**
 * Retrieives the public key for a service.
 */
export const PublicKeyApi: DeveloperGatewayApi = {
  url: 'v0/api/service/getPublicKey',
  method: 'POST',
};

/**
 * Retrieves the code for an address.
 */
export const GetCodeApi: DeveloperGatewayApi = {
  url: 'v0/api/service/getCode',
  method: 'POST',
};

/**
 * Polls for an event on a service.
 */
export const ServicePollApi: DeveloperGatewayApi = {
  url: 'v0/api/service/poll',
  method: 'POST',
};

/**
 * Subscribes to a gateway topic.
 */
export const SubscribeApi: DeveloperGatewayApi = {
  url: 'v0/api/event/subscribe',
  method: 'POST',
};

/**
 * Polls for an event on a subscription.
 */
export const SubscribePollApi: DeveloperGatewayApi = {
  url: 'v0/api/event/poll',
  method: 'POST',
};

/**
 * Retrieves the health status of the gateway.
 */
export const HealthApi: DeveloperGatewayApi = {
  url: 'v0/api/health',
  method: 'GET',
};

/**
 * Unsubscribes from a `SubscribeApi` subscription.
 */
export const UnsubscribeApi: DeveloperGatewayApi = {
  url: 'v0/api/event/unsubscribe',
  method: 'POST',
};

/**
 *  Event is an interface for types that can be fetched by polling on a service.
 */
export type Event =
  | ExecuteServiceEvent
  | PublicKeyEvent
  | DeployEvent
  | ErrorEvent;

/**
 * ExecuteServiceResponse is an asynchronous response that will be obtained
 * using the polling mechanisms.
 */
export type ExecuteServiceResponse = {
  id: number;
};

/**
 * PollServiceResponse returns a list of asynchronous responses the
 * client requested
 */
export type PollServiceResponse = {
  offset: number;
  events: Event[] | null;
};

/**
 * ExecuteServiceEvent is the event that can be polled by the user
 * as a result to a ServiceExecutionRequest.
 */
export type ExecuteServiceEvent = {
  id: number;
  address: string;
  output: string;
};

export type PublicKeyEvent = {
  id: number;
  publicKey: string;
  timestamp: number;
  signature: string;
};

export type DeployEvent = {
  id: number;
  address: string;
};

/**
 * ErrorEvent is the event that can be polled by the user as a result
 * to a request that failed.
 */
export type ErrorEvent = {
  id: number;
  cause: Error;
};

export type Error = {
  errorCode: number;
  description: string;
};
