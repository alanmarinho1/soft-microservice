import * as awsx from "@pulumi/awsx";
import { cluster } from "../cluster";
import { appLoadBalancer, networkLoadBalancer } from "../load-balancer";

// Este bloco cria um "grupo de destino" para o painel de controle do RabbitMQ. Ele serve para dizer ao balanceador de carga para onde enviar os acessos feitos na porta 15672 (painel web do RabbitMQ).
const rabbitMQAdminTargetGroup = appLoadBalancer.createTargetGroup("rabbitmq-admin-target", {
  port: 15672, 
  protocol: "HTTP",
  healthCheck: {
    path: "/",
    protocol: "HTTP",
  },
});

// Este bloco cria um "ouvinte" (listener) que fica esperando conexões na porta 15672. Quando alguém acessa essa porta, ele direciona o acesso para o grupo de destino acima, mostrando o painel do RabbitMQ.
const rabbitMQAdminHttpListener = appLoadBalancer.createListener("rabbitmq-admin-listener", {
  port: 15672, 
  protocol: "HTTP",
  targetGroup: rabbitMQAdminTargetGroup,
});

export const rabbitMQService = new awsx.classic.ecs.FargateService("fargate-rabbitmq", {
  cluster, // O cluster para onde o serviço tem que está hospedado
  desiredCount: 1, // Quantidade de instancias
  waitForSteadyState: false, // Nao aguardar o cluster quando ficar pronta
  taskDefinitionArgs: {
    container: {
      image: 'rabbitmq:3-management', // Usando a imagem oficial do RabbitMQ com o plugin de gerenciamento
      portMappings: [
        rabbitMQAdminHttpListener, // Mapeando a porta do painel de administração
      ],
      environment: [
        {name: 'RABBITMQ_DEFAULT_USER', value: 'admin'},
        {name: 'RABBITMQ_DEFAULT_PASS', value: 'admin'}, //se quiser guardar dados sensiveis no Pulumi: {name: 'RABBITMQ_DEFAULT_PASS', value: pulumi.secret('senha_secreta')},
        ],
      cpu: 256,
      memory: 512,
    },
  },
});
