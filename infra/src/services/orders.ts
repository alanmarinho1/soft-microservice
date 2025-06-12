import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";
import { ordersDockerImage } from "../images/orders";
import { cluster } from "../cluster";

export const ordersService = new awsx.classic.ecs.FargateService("fargate-orders", {
  cluster, // O cluster para onde o serviço tem que está hospedado
  desiredCount: 1, // Quantidade de instancias
  waitForSteadyState: false, // Nao aguardar o cluster quando ficar pronta
  taskDefinitionArgs: {
    container: {
      image: ordersDockerImage.ref,
      cpu: 256,
      memory: 512,
    },
  },
});
