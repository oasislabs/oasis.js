/**
 * The api module defines the types used for the v0/api of the developer
 * gateway.
 */

/**
 *  Event is an interface for types that can be fetched by polling on a service.
 */
export type Event = ExecuteServiceEvent | PublicKeyEvent | ErrorEvent;

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
  publicKey: string;
  timestamp: number;
  signature: string;
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
