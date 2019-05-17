/**
 * The api module defines the types used for the v0/api of the developer
 * gateway.
 */

/**
 * DeveloperGatewayApi represents the path for a URI for the developer gateway.
 */
export type DeveloperGatewayApi = string;

/**
 * Deploys a services.
 */
export const DeployApi: DeveloperGatewayApi = 'v0/api/service/deploy';
/**
 * Invokes an rpc on a service.
 */
export const RpcApi: DeveloperGatewayApi = 'v0/api/service/execute';
/**
 * Retrieives the public key for a service.
 */
export const PublicKeyApi: DeveloperGatewayApi = 'v0/api/service/getPublicKey';
/**
 * Polls for an event previously requested.
 */
export const PollApi: DeveloperGatewayApi = 'v0/api/service/poll';

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
 * using the polling mechanims.
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
