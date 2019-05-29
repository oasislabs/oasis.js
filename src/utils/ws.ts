export default /* tslint:disable */
(typeof WebSocket !== 'undefined' ? WebSocket : require('ws')) as WebSocket;
