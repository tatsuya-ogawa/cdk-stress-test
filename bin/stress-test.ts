#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {StressTestStack} from '../lib/stress-test-stack';

const app = new cdk.App();
const cpu: number = app.node.tryGetContext("Cpu") || 512;
const memory: number = app.node.tryGetContext("Memory") || 1024;
const desiredCount: number = app.node.tryGetContext("DesiredCount") || 2;
const allowHostCsv: string = app.node.tryGetContext("AllowHostCsv") || [];
const dockerDir: string = app.node.tryGetContext("DockerDir");
const nameSpace: string = app.node.tryGetContext("NameSpace");
new StressTestStack(app, 'StressTestStack', {
    /* If you don't specify 'env', this stack will be environment-agnostic.
    * Account/Region-dependent features and context lookups will not work,
    * but a single synthesized template can be deployed anywhere. */

    /* Uncomment the next line to specialize this stack for the AWS Account
    * and Region that are implied by the current CLI configuration. */
    // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

    /* Uncomment the next line if you know exactly what Account and Region you
    * want to deploy the stack to. */
    // env: { account: '123456789012', region: 'us-east-1' },

    /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
    Cpu: cpu,
    Memory: memory,
    NameSpace: nameSpace,
    DockerDir: dockerDir,
    DesiredCount: desiredCount,
    AllowHost: allowHostCsv?.split(",")
});
