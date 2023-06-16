import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { PostgresEngineVersion } from 'aws-cdk-lib/aws-rds';

export class GitlabInfraStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly lbSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Deploy the base vpc for the gitlab test environment

    const vpc = new ec2.Vpc(this, 'VPC', {
      natGateways: 2,
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [

        {
          cidrMask: 24,
          name: 'ingress',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'application',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ]

    });

    this.vpc = vpc;

  }
}
