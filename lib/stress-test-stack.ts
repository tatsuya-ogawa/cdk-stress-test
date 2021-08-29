import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from "@aws-cdk/aws-ecs";
import * as iam from '@aws-cdk/aws-iam';
import * as logs from '@aws-cdk/aws-logs';
import * as alb from '@aws-cdk/aws-elasticloadbalancingv2';
import {ApplicationProtocol} from '@aws-cdk/aws-elasticloadbalancingv2';
import * as assets from '@aws-cdk/aws-ecr-assets';
import * as servicediscovery from "@aws-cdk/aws-servicediscovery";
import * as patterns from '@aws-cdk/aws-ecs-patterns';

interface StressTestStackProps extends cdk.StackProps {
    NameSpace: string,
    Cpu: number,
    Memory: number,
    DockerDir: string
}

export class StressTestStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: StressTestStackProps) {
        super(scope, id, props);

        // The code that defines your stack goes here
        const vpc = new ec2.Vpc(this, `VPC`, {
            cidr: "10.0.0.0/16",
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'public',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: 'private',
                    subnetType: ec2.SubnetType.PRIVATE,
                },
                {
                    cidrMask: 28,
                    name: 'isolated',
                    subnetType: ec2.SubnetType.ISOLATED,
                }
            ]
        });
        const namespace = new servicediscovery.PrivateDnsNamespace(
            this,
            `Namespace`,
            {
                name: props.NameSpace,
                vpc: vpc,
                description: "Private Namespace for stress test",
            }
        );

        const cloudMapService = namespace.createService(`CloudMapService`, {
            dnsRecordType: servicediscovery.DnsRecordType.A
        });

        const cluster = new ecs.Cluster(this, `EcsCluster`, {vpc});
        const executionRole = new iam.Role(this, `EcsTaskExecutionRole`, {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
            ],
        });
        const serviceTaskRole = new iam.Role(this, `EcsServiceTaskRole`, {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        });
        const logGroup = new logs.LogGroup(this, `ServiceLogGroup`, {});

        const masterServiceTaskDefinition = new ecs.FargateTaskDefinition(this, `MasterServiceTaskDefinition`, {
            cpu: props.Cpu,
            memoryLimitMiB: props.Memory,
            executionRole: executionRole,
            taskRole: serviceTaskRole,
        });

        const imageAsset = new assets.DockerImageAsset(this, `ImageAsset`, {
            directory: props.DockerDir,
            repositoryName: "stress-test",
        });
        masterServiceTaskDefinition.addContainer(`MasterServiceTaskContainerDefinition`, {
            image: ecs.ContainerImage.fromDockerImageAsset(imageAsset),
            cpu: props.Cpu,
            memoryLimitMiB: props.Memory,
            memoryReservationMiB: props.Memory,
            logging: ecs.LogDriver.awsLogs({
                logGroup,
                streamPrefix: "master"
            }),
            command: [
                "-f", "locustfile.py", "--master", "-H", `http://master.${props.NameSpace}:8089`
            ],
            portMappings:[{
                containerPort: 8089,
                hostPort: 8089,
                protocol: ecs.Protocol.TCP,
            }]
        });

        const securityGroup = new ec2.SecurityGroup(this, `SecurityGroup`, {
            vpc: vpc
        });
        // const serviceFargateService = new ecs.FargateService(this, `MasterServiceServiceDefinition`, {
        //     cluster,
        //     vpcSubnets: vpc.selectSubnets({subnetType: ec2.SubnetType.PRIVATE}),
        //     securityGroup,
        //     taskDefinition: masterServiceTaskDefinition,
        //     desiredCount: 2,
        //     maxHealthyPercent: 200,
        //     minHealthyPercent: 50,
        // })
        new patterns.ApplicationLoadBalancedFargateService(
            this,
            `ALB`,
            {
                cluster,
                taskDefinition:masterServiceTaskDefinition,
                platformVersion: ecs.FargatePlatformVersion.LATEST,
                securityGroups:[securityGroup],
                taskSubnets: vpc.selectSubnets({subnetType: ec2.SubnetType.PRIVATE}),
                openListener:false
            }
        );
    }
}
