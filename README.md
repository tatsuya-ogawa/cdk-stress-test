# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy --context AllowHostCsv=1.1.1.1/32,2.2.2.2/32 --context NameSpace=test.local --context DockerDir=./docker`      deploy this stack to your default AWS account/region
 * `cdk diff   --context AllowHostCsv=1.1.1.1/32,2.2.2.2/32 --context NameSpace=test.local --context DockerDir=./docker`      compare deployed stack with current state
 * `cdk synth  --context AllowHostCsv=1.1.1.1/32,2.2.2.2/32 --context NameSpace=test.local --context DockerDir=./docker`      emits the synthesized CloudFormation template
