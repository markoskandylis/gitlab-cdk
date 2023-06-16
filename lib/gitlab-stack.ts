import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as asg from "aws-cdk-lib/aws-autoscaling";
import * as iam from "aws-cdk-lib/aws-iam";
interface GitlabStackProps extends cdk.StackProps {
  gitlabVPC: ec2.Vpc;
}

export class GitlabStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GitlabStackProps) {
    super(scope, id, props);

    // Creating load balancers Sercurity group

    const lbSecurityGroup = new ec2.SecurityGroup(this, "LBSecurityGroup", {
      vpc: props.gitlabVPC,
      allowAllOutbound: true,
      description: "Security group for the Gitlab LB",
      securityGroupName: "gitlab-loadbalancer-sec-group",
    });

    lbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
    lbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));
    lbSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));

    const dockerComposeYml = `
    version: '3.6'
    services:
      web:
        image: 'gitlab/gitlab-ee:latest'
        restart: always
        hostname: 'gitlab.test.stinky-badger.net'
        environment:
          GITLAB_OMNIBUS_CONFIG: |
            external_url 'http://-------'
            # Add any other gitlab.rb configuration here, each on its own line
        ports:
          - '80:80'
          - '2022:22'
        volumes:
          - '$GITLAB_HOME/config:/etc/gitlab'
          - '$GITLAB_HOME/logs:/var/log/gitlab'
          - '$GITLAB_HOME/data:/var/opt/gitlab'
        shm_size: '256m'
    `;

    // The code that defines your stack goes here
    const gitlabUserData = ec2.UserData.forLinux();
    gitlabUserData.addCommands(
      // Update the installed packages and package cache
      "yum update -y",

      // Add the official Docker repository, download the latest version of Docker, and install it
      "yum install docker -y",

      // Start the Docker service
      "systemctl start docker",

      // Add the ec2-user to the docker group so you can execute Docker commands without using sudo
      "usermod -a -G docker ssm-user",

      // Enable Docker to start at system boot
      "chkconfig docker on",

      // Install docker-compose
      "curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose",
      "chmod +x /usr/local/bin/docker-compose",

      // Define the GITLAB_HOME environment variable
      "export GITLAB_HOME=/srv/gitlab",

      // Create the GitLab directory
      "mkdir -p $GITLAB_HOME",

      // Set up the GitLab docker-compose.yml file
      `echo "${dockerComposeYml.replace(
        /"/g,
        '\\"'
      )}" > $GITLAB_HOME/docker-compose.yml`,

      // Start GitLab
      "cd $GITLAB_HOME && docker-compose up -d"
    );

    const gitlabInstanceRole = new iam.Role(this, "GitlabInstanceRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    const gitlabInstacnePolicies = ["AmazonSSMManagedInstanceCore"];

    for (let policy of gitlabInstacnePolicies) {
      gitlabInstanceRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName(policy)
      );
    }

    const gitlabTemplate = new ec2.LaunchTemplate(this, "GitlabEc2Template", {
      machineImage: ec2.MachineImage.latestAmazonLinux2022(),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.LARGE
      ),
      securityGroup: lbSecurityGroup,
      userData: gitlabUserData,
      role: gitlabInstanceRole,
      blockDevices: [{
        deviceName: '/dev/xvda',  // Replace with your root device name if it's not '/dev/xvda'
        volume: ec2.BlockDeviceVolume.ebs(100),  // 100 GB EBS volume
      }],
    });

    const gitlabasg = new asg.AutoScalingGroup(this, "GitlabASG", {
      vpc: props.gitlabVPC,
      desiredCapacity: 1,
      launchTemplate: gitlabTemplate,
    });

    const bastionHostWindows = new ec2.Instance(this, 'BastionHostWindows', {
      vpc: props.gitlabVPC,
      instanceName: 'BastionHostWindows',
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MEDIUM),
      machineImage: new ec2.WindowsImage(ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE),
      role: gitlabInstanceRole,
    });

  
    // deploy classic loadbalancer using cdk for the github

    const lb = new elbv2.ApplicationLoadBalancer(this, "LB", {
      vpc: props.gitlabVPC,
      internetFacing: false,
      loadBalancerName: "gitlab-loadbalancer",
      securityGroup: lbSecurityGroup,
    });

    const ports = [80];
    for (let port of ports) {
      const listener = lb.addListener(`Listener-${port}`, {
        port: port,
        protocol:
          port === 80
            ? elbv2.ApplicationProtocol.HTTP
            : port === 443
            ? elbv2.ApplicationProtocol.HTTPS
            : undefined,
      });

      listener.addTargets(`Target-${port}`, {
        port: 80,
        targets: [gitlabasg],
      });
    }
  }
}
