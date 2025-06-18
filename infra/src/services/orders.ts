import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";

import {  amqpListener } from "./rabbitmq";
import { ordersDockerImage } from "../images/orders";
import { cluster } from "../cluster";
import { appLoadBalancer } from "../load-balancer";

// criar o target group para o serviço de pedidos pelo loadbalancer
const ordersTargetGroup = appLoadBalancer.createTargetGroup("orders-target", {
  port: 3333, // Porta onde o serviço de pedidos está rodando
  protocol: "HTTP",
  healthCheck: {
    protocol: "HTTP",
    path: "/health", // Rota de verificação de saúde do serviço de pedidos
  },
});

// criar o listener para o serviço de pedidos pelo loadbalancer
export const ordersHttpListener = appLoadBalancer.createListener("orders-listener", {
  port: 3333, // Porta onde o serviço de pedidos está rodando
  protocol: "HTTP",
  targetGroup: ordersTargetGroup,
});
  

export const ordersService = new awsx.classic.ecs.FargateService("fargate-orders", {
  cluster, // O cluster para onde o serviço tem que está hospedado
  desiredCount: 1, // Quantidade de instancias
  waitForSteadyState: false, // Nao aguardar o cluster quando ficar pronta
  taskDefinitionArgs: {
    container: {
      image: ordersDockerImage.ref,
      cpu: 256,
      memory: 512,
      portMappings: [
        ordersHttpListener, // Mapeando a porta do serviço de pedidos
      ],
      environment: [
        {
          name: 'BROKER_URL',
          value: pulumi.interpolate`amqp://admin:admin@${amqpListener.endpoint.hostname}:${amqpListener.endpoint.port}`, // URL do RabbitMQ
        },
        {
          name: 'DATABASE_URL',
          value: 'postgresql://orders_owner:npg_3wnyJvWirbk6@ep-falling-boat-a4ko9zzr.us-east-1.aws.neon.tech/orders?sslmode=require' // Não se deve guardar dados sensíveis no código, mas aqui é só um exemplo. Use pulumi.secret para guardar dados sensíveis.
        },
        {
          name: "OTEL_TRACES_EXPORTER",
          value: "otlp"
        },
        {
          name: "OTEL_EXPORTER_OTLP_ENDPOINT",
          value: "https://otlp-gateway-prod-sa-east-1.grafana.net/otlp"
        },
        {
          name: "OTEL_EXPORTER_OTLP_HEADERS",
          value: "Authorization=Basic MTI5MjA0NTpnbGNfZXlKdklqb2lNVFEyTURrMU55SXNJbTRpT2lKemIyWjBMVzFwWTNKdmMyVnlkbWxqWlhNaUxDSnJJam9pZHpVeU5HbGpXRVkxTW1sMFluUkVNVFpJWlVvNU5qRnNJaXdpYlNJNmV5SnlJam9pY0hKdlpDMXpZUzFsWVhOMExURWlmWDA9"
        },
        {
          name: "OTEL_SERVICE_NAME",
          value: "orders"
        },
        {
          name: "OTEL_RESOURCE_ATTRIBUTES",
          value: "service.name=my-orders,service.namespace=soft-microservices,deployment.environment=production"
        },
        {
          name: "OTEL_NODE_RESOURCE_DETECTORS",
          value: "env,host,os"
        },
        {
          name: 'OTEL_NODE_ENABLE_INSTRUMENTATIONS',
          value: 'http,fastify,pg,amqplib'
        }

      ]
    },
  },
});
