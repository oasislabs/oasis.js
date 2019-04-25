import Service from './service';

export default function deploy(
  service: Service,
  options: DeployOptions
): Service {
  // todo
  return service;
}

type DeployOptions = {
  bytecode: string;
  arguments?: Array<any>;
  header?: DeployHeader;
};

type DeployHeader = {
  confidential: boolean;
  expiry: number;
};
