import { OasisGateway } from '../index';
import { HttpDeveloperGateway } from './http';

export default class DeveloperGateway {
  public static http(url: string): OasisGateway {
    return new HttpDeveloperGateway(url);
  }
}
