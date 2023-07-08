# GitLab CDK Deployment in TypeScript

This repository contains the CDK (Cloud Development Kit) TypeScript code that sets up a GitLab infrastructure and service on AWS (Amazon Web Services).

## Project structure

This project is organized into three primary parts:
- The `gitlab-infra-stack.ts` is responsible for setting up the underlying AWS infrastructure that includes a VPC (Virtual Private Cloud) and its related networking components.
- The `gitlab-stack.ts` deploys the actual GitLab service and a windows bastion host within the VPC, along with the necessary security groups, IAM roles, and autoscaling groups.
- The `gitlab.ts` file is the entry point of the application and it is responsible for deploying the stacks in the desired AWS account and region.

## Getting Started

These instructions will guide you through the process of deploying GitLab on AWS using this CDK project.

### Prerequisites

Ensure you have the following installed on your local machine:

1. [Node.js](https://nodejs.org/) - version 14.x or higher
2. [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) - version 2.x or higher
3. AWS CLI - version 2.x or higher
4. A valid AWS account and your AWS credentials configured on your local machine. See the [official guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html) for more information.

## Environment Variables

This project relies on the following environment variables that you will need to set:

- `AWS_ACCOUNT_ID`: Your AWS Account ID
- `AWS_REGION`: The AWS Region where the stack will be deployed
- `GITLAB_ROOT_PASSWORD`: The password to be used for the root user in GitLab

You can export these environment variables in your shell:

```bash
export AWS_ACCOUNT_ID=YourAwsAccountId
export AWS_REGION=YourAwsRegion
export GITLAB_ROOT_PASSWORD=YourGitlabRootPassword
```
### Deploying the project

After exporting the necessary environment variables, you can deploy the project by running:

```bash
git clone https://github.com/markoskandylis/gitlab-cdk.git
cd repo-dir
npm install
cdk deploy --all

```
### Deploying the project
## gitlab-infra-stack
This stack deploys the base VPC for the GitLab environment.
## gitlab-infra-stack
This stack deploys GitLab in the VPC created by gitlab-infra-stack, it also creates a load balancer and a Windows Bastion Host for access to the GitLab instance.
