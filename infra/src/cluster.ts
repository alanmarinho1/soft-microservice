import * as awsx from "@pulumi/awsx";


// Deploy no AWS
// Subir com ECS + Fargate
// Outras alternativas: EC2 e EKS

export const cluster = new awsx.classic.ecs.Cluster("app-cluster");
