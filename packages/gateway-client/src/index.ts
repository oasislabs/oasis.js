import Gateway from '@oasislabs/gateway';
import { Service, deploy, setGateway } from '@oasislabs/service';

const oasis = {
  Service,
  deploy,
  setGateway,
  gateways: {
    Gateway,
  },
};

export default oasis;
