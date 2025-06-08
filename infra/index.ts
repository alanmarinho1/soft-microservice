import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as docker from "@pulumi/docker-build";

// Subir imagem docker para o ECR
const ordersECRRepository = new awsx.ecr.Repository("order-ecr", {
  forceDelete: true,
});

//Token de autenticação para acessar o ECR
export const ordersECRToken = aws.ecr.getAuthorizationTokenOutput({
  registryId: ordersECRRepository.repository.registryId,
});

// Fazer build da imagem
export const ordersDockerImage = new docker.Image("orders-image", {
  tags: [
    pulumi.interpolate`${ordersECRRepository.repository.repositoryUrl}:latest`, // interpolate serve para destacar a string que vai ser usada para tag da imagem
  ],
  context: {
    location: "../app-orders", // local da imagem
  },
  push: true, // fazer o build e jogar no repository
  platforms: ["linux/amd64"],
  registries: [
    {
      address: ordersECRRepository.repository.repositoryUrl,
      username: ordersECRToken.userName,
      password: ordersECRToken.password,
    },
  ], // repository que vai receber a imagem
});


// Deploy no AWS
// Subir com ECS + Fargate
// Outras alternativas: EC2 e EKS

const cluster = new awsx.classic.ecs.Cluster("app-cluster")

const ordersService = new awsx.classic.ecs.FargateService("fargate-orders", {
  cluster, // O cluster para onde o serviço tem que está hospedado
  desiredCount: 1, // Quantidade de instancias
  waitForSteadyState: false, // Nao aguardar o cluster quando ficar pronta
  taskDefinitionArgs: {
    container: {
      image: ordersDockerImage.ref,
      cpu: 256,
      memory: 512,
    }
  },
});