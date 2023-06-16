#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GitlabStack } from '../lib/gitlab-stack';
import { GitlabInfraStack } from '../lib/gitlab-infra-stack';



const app = new cdk.App();
const gitlabInfraStack = new GitlabInfraStack(app, 'GitlabInfraStack', {
  env: {
    account: "",
    region: "",
  }
});
const gitlabStack = new GitlabStack(app, 'GitlabStack', {
  gitlabVPC: gitlabInfraStack.vpc,
  env: {
    account: "",
    region: "",
  }
});