// server.ts
import express from 'express';
import cors from 'cors';
import { App, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { spawn, ChildProcessWithoutNullStreams, exec } from 'child_process';
import { promisify } from 'util';
const execPromise = promisify(exec);

// Imports mapped to your local .gen folder
import { AwsProvider } from './.gen/providers/aws/provider';
import { S3Bucket } from './.gen/providers/aws/s3-bucket';
import { S3BucketVersioningA } from './.gen/providers/aws/s3-bucket-versioning';
import { S3BucketPublicAccessBlock } from './.gen/providers/aws/s3-bucket-public-access-block';
import { IamUser } from './.gen/providers/aws/iam-user';
import { IamGroup } from './.gen/providers/aws/iam-group';
import { IamRole } from './.gen/providers/aws/iam-role';
import { IamPolicy } from './.gen/providers/aws/iam-policy';
import { IamUserGroupMembership } from './.gen/providers/aws/iam-user-group-membership';
import { IamUserPolicyAttachment } from './.gen/providers/aws/iam-user-policy-attachment';
import { IamGroupPolicyAttachment } from './.gen/providers/aws/iam-group-policy-attachment';
import { IamRolePolicyAttachment } from './.gen/providers/aws/iam-role-policy-attachment';
import { Instance } from './.gen/providers/aws/instance';
import { IamInstanceProfile } from './.gen/providers/aws/iam-instance-profile';
import { S3Object } from './.gen/providers/aws/s3-object';
import { SecurityGroup } from './.gen/providers/aws/security-group';

import * as fs from 'fs';
import * as path from 'path';
import os from 'os';

const app = express();
app.use(cors());
app.use(express.json());

interface VisualNode {
  id: string;
  type: string;
  parentId?: string;
  data: {
    label: string;
    region: string;
    isPublic?: boolean;
    versioning?: boolean;
    iamType?: string;
    roleService?: string;
    policyActions?: string;
    policyResource?: string;
    trustType?: string;
    trustPrincipal?: string;
    instanceType?: string;
    ami?: string;
    volumeSize?: number;
    sourceType?: string;
    sourcePath?: string;
    hasCustomSecurityGroup?: boolean;
    securityGroup?: {
      id?: string;
      name: string;
      rules: Array<{
        id: string;
        type: 'ingress' | 'egress';
        protocol: string;
        fromPort: number;
        toPort: number;
        cidr?: string;
        description?: string;
      }>;
    };
    securityGroups?: Array<{
      id: string;
      name: string;
      rules: Array<{
        id: string;
        type: 'ingress' | 'egress';
        protocol: string;
        fromPort: number;
        toPort: number;
        cidr?: string;
        description?: string;
      }>;
    }>;
  };
}

interface VisualEdge {
  source: string;
  target: string;
}

class CloudForgeStack extends TerraformStack {
  constructor(scope: Construct, id: string, nodes: VisualNode[], edges: VisualEdge[]) {
    super(scope, id);

    let primaryRegion = nodes.length > 0 ? nodes[0].data.region : 'us-east-1';
    if (!primaryRegion || primaryRegion === 'global') {
      primaryRegion = 'us-east-1';
    }
    new AwsProvider(this, 'AWS', { region: primaryRegion });

    const resourceMap = new Map<string, { type: string; iamType?: string; name: string; ref: any }>();
    const iamResources = new Map<string, { ref: any; id: string }>();

    const getOrCreateIamResource = (iamType: string, name: string, creator: () => any) => {
      const key = `${iamType}_${name}`;
      if (iamResources.has(key)) {
        return iamResources.get(key)!.ref;
      }
      const ref = creator();
      iamResources.set(key, { ref, id: nodes.find(n => (n.data?.label || n.id).toLowerCase().replace(/[^a-z0-9-]/g, '-') === name)?.id || name });
      return ref;
    };

    // Pre-pass: Instantiate all unique Custom Security Groups
    const generatedSgs = new Map<string, SecurityGroup>();
    nodes.forEach((node) => {
      if (node.type === 'ec2Node' && node.data.hasCustomSecurityGroup) {
        const sgs = node.data.securityGroups || (node.data.securityGroup ? [node.data.securityGroup] : []);
        sgs.forEach((sgConfig) => {
          if (!sgConfig) return;
          const sgId = sgConfig.id || `sg-legacy-${node.id}`;

          if (!generatedSgs.has(sgId)) {
            const sgName = sgConfig.name || `${node.data.label.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-sg`;
            const safeSgId = sgId.replace(/[^a-zA-Z0-9]/g, '');

            const ingressRules = (sgConfig.rules || [])
              .filter((r: any) => r.type === 'ingress')
              .map((r: any) => {
                const isAll = r.protocol === 'all';
                return {
                  fromPort: isAll ? 0 : Number(r.fromPort),
                  toPort: isAll ? 0 : Number(r.toPort),
                  protocol: isAll ? '-1' : r.protocol,
                  cidrBlocks: [r.cidr || '0.0.0.0/0'],
                  description: r.description || '',
                };
              });

            const egressRules = (sgConfig.rules || [])
              .filter((r: any) => r.type === 'egress')
              .map((r: any) => {
                const isAll = r.protocol === 'all';
                return {
                  fromPort: isAll ? 0 : Number(r.fromPort),
                  toPort: isAll ? 0 : Number(r.toPort),
                  protocol: isAll ? '-1' : r.protocol,
                  cidrBlocks: [r.cidr || '0.0.0.0/0'],
                  description: r.description || '',
                };
              });

            const sgResource = new SecurityGroup(this, `${safeSgId}Resource`, {
              name: sgName,
              description: `Security group ${sgName}`,
              ingress: ingressRules,
              egress: egressRules,
              tags: { ManagedBy: 'CloudForge', Name: sgName },
            });

            generatedSgs.set(sgId, sgResource);
          }
        });
      }
    });

    nodes.forEach((node) => {
      const safeId = node.id.replace(/[^a-zA-Z0-9]/g, '');
      const labelName = node.data.label.toLowerCase().replace(/[^a-z0-9-]/g, '-');

      if (node.type === 's3Node') {
        const bucket = new S3Bucket(this, safeId, {
          bucket: labelName,
          tags: { ManagedBy: 'CloudForge' },
        });

        if (node.data.versioning) {
          new S3BucketVersioningA(this, `${safeId}_versioning`, {
            bucket: bucket.id,
            versioningConfiguration: { status: 'Enabled' },
          });
        }

        new S3BucketPublicAccessBlock(this, `${safeId}_access`, {
          bucket: bucket.id,
          blockPublicAcls: !node.data.isPublic,
          blockPublicPolicy: !node.data.isPublic,
          ignorePublicAcls: !node.data.isPublic,
          restrictPublicBuckets: !node.data.isPublic,
        });

        resourceMap.set(node.id, { type: 's3', name: bucket.bucket, ref: bucket });
      } else if (node.type === 'iamGroupNode') {
        const group = getOrCreateIamResource('Group', labelName, () => new IamGroup(this, safeId, {
          name: labelName,
        }));
        resourceMap.set(node.id, { type: 'iam', iamType: 'Group', name: labelName, ref: group });
      } else if (node.type === 'iamNode') {
        switch (node.data.iamType) {
          case 'User':
            const user = getOrCreateIamResource('User', labelName, () => new IamUser(this, safeId, {
              name: labelName,
              tags: { ManagedBy: 'CloudForge' },
            }));
            resourceMap.set(node.id, { type: 'iam', iamType: 'User', name: labelName, ref: user });
            break;
          case 'Group':
            const group = getOrCreateIamResource('Group', labelName, () => new IamGroup(this, safeId, {
              name: labelName,
            }));
            resourceMap.set(node.id, { type: 'iam', iamType: 'Group', name: labelName, ref: group });
            break;
          case 'Role':
            const trustType = node.data.trustType || 'service';
            const roleService = node.data.roleService || 'ec2.amazonaws.com';
            const trustPrincipal = node.data.trustPrincipal || '';

            let principal: any = {};
            let action = 'sts:AssumeRole';

            if (trustType === 'aws_arn') {
              principal = { AWS: trustPrincipal || '*' };
            } else if (trustType === 'federated') {
              principal = { Federated: trustPrincipal || '*' };
              action = 'sts:AssumeRoleWithWebIdentity';
            } else {
              principal = { Service: roleService };
            }

            const role = getOrCreateIamResource('Role', labelName, () => new IamRole(this, safeId, {
              name: labelName,
              assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Action: action,
                    Principal: principal,
                    Effect: 'Allow',
                    Sid: '',
                  },
                ],
              }),
              tags: { ManagedBy: 'CloudForge' },
            }));
            resourceMap.set(node.id, { type: 'iam', iamType: 'Role', name: labelName, ref: role });
            break;
          case 'Policy':
            const policyActionsStr = node.data.policyActions || 's3:*';
            const policyResource = node.data.policyResource || '*';
            const actions = policyActionsStr.split(',').map((act) => act.trim()).filter(Boolean);

            const policy = getOrCreateIamResource('Policy', labelName, () => new IamPolicy(this, safeId, {
              name: labelName,
              policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Action: actions,
                    Effect: 'Allow',
                    Resource: policyResource,
                  },
                ],
              }),
            }));
            resourceMap.set(node.id, { type: 'iam', iamType: 'Policy', name: labelName, ref: policy });
            break;
        }
      } else if (node.type === 'ec2Node') {
        const instanceType = node.data.instanceType || 't2.micro';
        const ami = node.data.ami || 'ami-0c55b159cbfafe1f0';
        const volumeSize = node.data.volumeSize || 8;

        let securityGroupIds: string[] | undefined = undefined;

        if (node.data.hasCustomSecurityGroup) {
          const sgs = node.data.securityGroups || (node.data.securityGroup ? [node.data.securityGroup] : []);
          if (sgs.length > 0) {
            const ids: string[] = [];
            sgs.forEach((sgConfig) => {
              if (!sgConfig) return;
              const sgId = sgConfig.id || `sg-legacy-${node.id}`;
              const sgResource = generatedSgs.get(sgId);
              if (sgResource) {
                ids.push(sgResource.id);
              }
            });
            if (ids.length > 0) {
              securityGroupIds = ids;
            }
          }
        }

        const ec2Instance = new Instance(this, safeId, {
          ami: ami,
          instanceType: instanceType,
          rootBlockDevice: {
            volumeSize: volumeSize,
            volumeType: 'gp3',
          },
          vpcSecurityGroupIds: securityGroupIds,
          tags: { ManagedBy: 'CloudForge', Name: labelName },
        });

        resourceMap.set(node.id, { type: 'ec2', name: labelName, ref: ec2Instance });
      }
    });

    // Compile S3 Objects (which require parent S3 Bucket references from resourceMap)
    nodes.forEach((node) => {
      if (node.type === 's3ObjectNode') {
        const parentId = node.parentId;
        if (!parentId) {
          console.warn(`S3 Object ${node.id} has no parent S3 Bucket.`);
          return;
        }

        const parentNode = resourceMap.get(parentId);
        if (!parentNode || parentNode.type !== 's3') {
          console.warn(`S3 Object ${node.id} parent ${parentId} is not a valid S3 Bucket resource.`);
          return;
        }

        const bucketRef = parentNode.ref as S3Bucket;
        const safeId = node.id.replace(/[^a-zA-Z0-9]/g, '');
        const objectKey = node.data.label || `object-${Math.floor(Math.random() * 1000)}`;
        const sourcePath = node.data.sourcePath || '';
        const sourceType = node.data.sourceType || 'file';

        if (sourceType === 'folder' && sourcePath) {
          try {
            const absoluteSourcePath = path.resolve(sourcePath);
            if (fs.existsSync(absoluteSourcePath) && fs.statSync(absoluteSourcePath).isDirectory()) {
              const walkFiles = (dir: string): string[] => {
                let results: string[] = [];
                const list = fs.readdirSync(dir);
                list.forEach((file) => {
                  const filePath = path.join(dir, file);
                  const stat = fs.statSync(filePath);
                  if (stat && stat.isDirectory()) {
                    results = results.concat(walkFiles(filePath));
                  } else {
                    results.push(filePath);
                  }
                });
                return results;
              };

              const files = walkFiles(absoluteSourcePath);
              files.forEach((file, index) => {
                const relativePath = path.relative(absoluteSourcePath, file).replace(/\\/g, '/');
                const key = `${objectKey}/${relativePath}`;
                const fileSafeId = `${safeId}_${index}`;

                new S3Object(this, fileSafeId, {
                  bucket: bucketRef.bucket,
                  key: key,
                  source: file,
                });
              });
            } else {
              new S3Object(this, safeId, {
                bucket: bucketRef.bucket,
                key: `${objectKey}/`,
                content: '',
              });
            }
          } catch (e) {
            console.error(`Failed to read folder ${sourcePath} for S3 object:`, e);
            new S3Object(this, safeId, {
              bucket: bucketRef.bucket,
              key: `${objectKey}/`,
              content: '',
            });
          }
        } else if (sourcePath) {
          try {
            const absoluteSourcePath = path.resolve(sourcePath);
            if (fs.existsSync(absoluteSourcePath)) {
              new S3Object(this, safeId, {
                bucket: bucketRef.bucket,
                key: objectKey,
                source: absoluteSourcePath,
              });
            } else {
              new S3Object(this, safeId, {
                bucket: bucketRef.bucket,
                key: objectKey,
                content: 'Placeholder content',
              });
            }
          } catch (e) {
            new S3Object(this, safeId, {
              bucket: bucketRef.bucket,
              key: objectKey,
              content: 'Placeholder content',
            });
          }
        } else {
          new S3Object(this, safeId, {
            bucket: bucketRef.bucket,
            key: objectKey,
            content: 'Placeholder content',
          });
        }
      }
    });

    // Track groups per user (keyed by user name to support a single user in multiple groups/canvas-nodes)
    const userGroups = new Map<string, { userRef: IamUser; userLabel: string; groupNames: string[]; groupRefs: IamGroup[] }>();
    const createdAttachments = new Set<string>();

    edges.forEach((edge, index) => {
      const sourceNode = resourceMap.get(edge.source);
      const targetNode = resourceMap.get(edge.target);

      if (!sourceNode || !targetNode) return;

      // User <-> Group Membership
      if (
        (sourceNode.iamType === 'User' && targetNode.iamType === 'Group') ||
        (sourceNode.iamType === 'Group' && targetNode.iamType === 'User')
      ) {
        const userNode = sourceNode.iamType === 'User' ? sourceNode : targetNode;
        const groupNode = sourceNode.iamType === 'Group' ? sourceNode : targetNode;

        const userRef = userNode.ref as IamUser;
        const groupRef = groupNode.ref as IamGroup;
        const userName = userNode.name;

        if (!userGroups.has(userName)) {
          userGroups.set(userName, { userRef, userLabel: userName, groupNames: [], groupRefs: [] });
        }
        const uGroup = userGroups.get(userName)!;
        if (!uGroup.groupNames.includes(groupRef.name)) {
          uGroup.groupNames.push(groupRef.name);
        }
        if (!uGroup.groupRefs.includes(groupRef)) {
          uGroup.groupRefs.push(groupRef);
        }
      }

      // Policy <-> User/Group/Role Attachment
      if (sourceNode.iamType === 'Policy' || targetNode.iamType === 'Policy') {
        const policyNode = sourceNode.iamType === 'Policy' ? sourceNode : targetNode;
        const attachedNode = sourceNode.iamType === 'Policy' ? targetNode : sourceNode;
        const attachedNodeId = sourceNode.iamType === 'Policy' ? edge.target : edge.source;

        const policyRef = policyNode.ref as IamPolicy;
        const safeAttachId = `${attachedNodeId}_${index}`.replace(/[^a-zA-Z0-9]/g, '');

        const attachKey = `${attachedNode.iamType}_${attachedNode.name}_${policyNode.name}`;
        if (!createdAttachments.has(attachKey)) {
          createdAttachments.add(attachKey);

          if (attachedNode.iamType === 'User') {
            const userRef = attachedNode.ref as IamUser;
            new IamUserPolicyAttachment(this, `user_policy_attach_${safeAttachId}`, {
              user: userRef.name,
              policyArn: policyRef.arn,
            });
          } else if (attachedNode.iamType === 'Group') {
            const groupRef = attachedNode.ref as IamGroup;
            new IamGroupPolicyAttachment(this, `group_policy_attach_${safeAttachId}`, {
              group: groupRef.name,
              policyArn: policyRef.arn,
            });
          } else if (attachedNode.iamType === 'Role') {
            const roleRef = attachedNode.ref as IamRole;
            new IamRolePolicyAttachment(this, `role_policy_attach_${safeAttachId}`, {
              role: roleRef.name,
              policyArn: policyRef.arn,
            });
          }
        }
      }

      // Role <-> EC2 Instance mapping
      if (
        (sourceNode && targetNode) &&
        ((sourceNode.iamType === 'Role' && targetNode.type === 'ec2') ||
          (sourceNode.type === 'ec2' && targetNode.iamType === 'Role'))
      ) {
        const roleNode = sourceNode.iamType === 'Role' ? sourceNode : targetNode;
        const ec2Node = sourceNode.type === 'ec2' ? sourceNode : targetNode;
        const ec2NodeId = sourceNode.type === 'ec2' ? edge.source : edge.target;

        const roleRef = roleNode.ref as IamRole;
        const ec2Ref = ec2Node.ref as Instance;

        const safeAttachId = `${ec2NodeId}_role`.replace(/[^a-zA-Z0-9]/g, '');

        // 1. Create IAM Instance Profile
        const instanceProfile = new IamInstanceProfile(this, `profile_${safeAttachId}`, {
          name: `${roleRef.name}-profile`,
          role: roleRef.name,
        });

        // 2. Attach profile to the EC2 Instance
        ec2Ref.iamInstanceProfile = instanceProfile.name;
      }
    });

    // Automatically add child users to parent groups based on visual nesting (parentId)
    nodes.forEach((node) => {
      if (node.parentId) {
        const parentNode = resourceMap.get(node.parentId);
        const childNode = resourceMap.get(node.id);

        if (
          parentNode &&
          childNode &&
          parentNode.iamType === 'Group' &&
          childNode.iamType === 'User'
        ) {
          const userRef = childNode.ref as IamUser;
          const groupRef = parentNode.ref as IamGroup;
          const groupName = groupRef.name;
          const userName = childNode.name;

          if (!userGroups.has(userName)) {
            userGroups.set(userName, { userRef, userLabel: userName, groupNames: [], groupRefs: [] });
          }

          const groups = userGroups.get(userName)!.groupNames;
          const groupRefs = userGroups.get(userName)!.groupRefs;
          if (!groups.includes(groupName)) {
            groups.push(groupName);
          }
          if (!groupRefs.includes(groupRef)) {
            groupRefs.push(groupRef);
          }
        }
      }
    });

    // Create User-Group memberships
    userGroups.forEach((val, userName) => {
      const safeMembershipId = `membership_${userName}`.replace(/[^a-zA-Z0-9]/g, '');
      new IamUserGroupMembership(this, safeMembershipId, {
        user: val.userRef.name,
        groups: val.groupNames,
        dependsOn: val.groupRefs,
      });
    });
  }
}

const SUPPORTED_INSTANCES = new Set([
  "t2.nano", "t2.micro", "t2.small", "t2.medium", "t2.large", "t2.xlarge", "t2.2xlarge",
  "t3.nano", "t3.micro", "t3.small", "t3.medium", "t3.large", "t3.xlarge", "t3.2xlarge",
  "t4g.nano", "t4g.micro", "t4g.small", "t4g.medium", "t4g.large", "t4g.xlarge", "t4g.2xlarge",
  "m5.large", "m5.xlarge", "m5.2xlarge", "m5.4xlarge",
  "m6g.large", "m6g.xlarge", "m6g.2xlarge", "m6g.4xlarge",
  "c5.large", "c5.xlarge", "c5.2xlarge", "c5.4xlarge",
  "c6g.large", "c6g.xlarge", "c6g.2xlarge", "c6g.4xlarge",
  "r5.large", "r5.xlarge", "r5.2xlarge", "r5.4xlarge",
  "r6g.large", "r6g.xlarge", "r6g.2xlarge", "r6g.4xlarge"
]);

const CACHE_DIR = path.join(__dirname, 'cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

import https from 'https';

function fetchPricingFromURL(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Follow 301/302 redirects recursively
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          fetchPricingFromURL(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }

      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download instances.json: ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

app.get('/api/pricing/ec2', async (req, res): Promise<any> => {
  const region = (req.query.region as string || 'us-east-1').toLowerCase();
  const cacheFilePath = path.join(CACHE_DIR, `pricing-${region}.json`);

  try {
    // Check cache
    if (fs.existsSync(cacheFilePath)) {
      const stats = fs.statSync(cacheFilePath);
      const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
      if (ageHours < 24) {
        const cachedData = fs.readFileSync(cacheFilePath, 'utf-8');
        return res.json(JSON.parse(cachedData));
      }
    }

    // Cache miss or stale: fetch new data
    const rawDataStr = await fetchPricingFromURL('https://instances.vantage.sh/instances.json');
    const instances = JSON.parse(rawDataStr);

    const parsedPricing: any[] = [];

    for (const inst of instances) {
      const instType = inst.instance_type;
      if (!SUPPORTED_INSTANCES.has(instType)) continue;

      const pricingMap = inst.pricing || {};
      const regionPrices = pricingMap[region] || {};

      const parsePrice = (priceObj: any): number | null => {
        if (!priceObj || !priceObj.ondemand) return null;
        const val = parseFloat(priceObj.ondemand);
        return isNaN(val) ? null : val;
      };

      const linux = parsePrice(regionPrices.linux);
      const mswin = parsePrice(regionPrices.mswin);
      const rhel = parsePrice(regionPrices.rhel);
      const sles = parsePrice(regionPrices.sles);

      const pricing = {
        Linux: linux !== null ? linux : 0.0116,
        Windows: mswin,
        RHEL: rhel !== null ? rhel : (linux !== null ? parseFloat((linux + 0.06).toFixed(4)) : 0.0716),
        UbuntuPro: linux !== null ? parseFloat((linux * 1.22).toFixed(4)) : 0.0142,
        SUSE: sles !== null ? sles : (linux !== null ? parseFloat((linux + 0.01).toFixed(4)) : 0.0216)
      };

      parsedPricing.push({
        value: instType,
        cpu: inst.vCPU,
        ram: inst.memory + " GiB",
        pricing
      });
    }

    if (parsedPricing.length === 0) {
      throw new Error("Parsed empty pricing mapping.");
    }

    fs.writeFileSync(cacheFilePath, JSON.stringify(parsedPricing, null, 2), 'utf-8');
    return res.json(parsedPricing);

  } catch (err) {
    console.error("Pricing Fetch/Cache failed, returning server fallback:", err);
    const fallbackData = [
      { value: "t2.nano", cpu: 1, ram: "0.5 GiB", pricing: { Linux: 0.0058, Windows: 0.0081, RHEL: 0.0658, UbuntuPro: 0.0076, SUSE: 0.0158 } },
      { value: "t2.micro", cpu: 1, ram: "1 GiB", pricing: { Linux: 0.0116, Windows: 0.0162, RHEL: 0.0716, UbuntuPro: 0.0142, SUSE: 0.0216 } },
      { value: "t2.small", cpu: 1, ram: "2 GiB", pricing: { Linux: 0.0230, Windows: 0.0324, RHEL: 0.0830, UbuntuPro: 0.0266, SUSE: 0.0330 } },
      { value: "t2.medium", cpu: 2, ram: "4 GiB", pricing: { Linux: 0.0464, Windows: 0.0648, RHEL: 0.1064, UbuntuPro: 0.0531, SUSE: 0.0564 } },
      { value: "t2.large", cpu: 2, ram: "8 GiB", pricing: { Linux: 0.0928, Windows: 0.1296, RHEL: 0.1528, UbuntuPro: 0.1062, SUSE: 0.1028 } },
      { value: "t2.xlarge", cpu: 4, ram: "16 GiB", pricing: { Linux: 0.1856, Windows: 0.2592, RHEL: 0.2456, UbuntuPro: 0.2124, SUSE: 0.1956 } },
      { value: "t2.2xlarge", cpu: 8, ram: "32 GiB", pricing: { Linux: 0.3712, Windows: 0.5184, RHEL: 0.4312, UbuntuPro: 0.4248, SUSE: 0.3812 } },
      { value: "t3.nano", cpu: 1, ram: "0.5 GiB", pricing: { Linux: 0.0052, Windows: 0.0079, RHEL: 0.0652, UbuntuPro: 0.0070, SUSE: 0.0152 } },
      { value: "t3.micro", cpu: 1, ram: "1 GiB", pricing: { Linux: 0.0104, Windows: 0.0156, RHEL: 0.0704, UbuntuPro: 0.0130, SUSE: 0.0204 } },
      { value: "t3.small", cpu: 2, ram: "2 GiB", pricing: { Linux: 0.0208, Windows: 0.0312, RHEL: 0.0808, UbuntuPro: 0.0244, SUSE: 0.0308 } },
      { value: "t3.medium", cpu: 2, ram: "4 GiB", pricing: { Linux: 0.0416, Windows: 0.0624, RHEL: 0.1016, UbuntuPro: 0.0488, SUSE: 0.0516 } },
      { value: "t3.large", cpu: 2, ram: "8 GiB", pricing: { Linux: 0.0832, Windows: 0.1248, RHEL: 0.1432, UbuntuPro: 0.0976, SUSE: 0.0932 } },
      { value: "t3.xlarge", cpu: 4, ram: "16 GiB", pricing: { Linux: 0.1664, Windows: 0.2496, RHEL: 0.2264, UbuntuPro: 0.1952, SUSE: 0.1764 } },
      { value: "t3.2xlarge", cpu: 8, ram: "32 GiB", pricing: { Linux: 0.3328, Windows: 0.4992, RHEL: 0.3928, UbuntuPro: 0.3904, SUSE: 0.3428 } },
      { value: "t4g.nano", cpu: 2, ram: "0.5 GiB", pricing: { Linux: 0.0042, Windows: null, RHEL: 0.0642, UbuntuPro: 0.0056, SUSE: 0.0142 } },
      { value: "t4g.micro", cpu: 2, ram: "1 GiB", pricing: { Linux: 0.0084, Windows: null, RHEL: 0.0684, UbuntuPro: 0.0104, SUSE: 0.0184 } },
      { value: "t4g.small", cpu: 2, ram: "2 GiB", pricing: { Linux: 0.0168, Windows: null, RHEL: 0.0768, UbuntuPro: 0.0196, SUSE: 0.0268 } },
      { value: "t4g.medium", cpu: 2, ram: "4 GiB", pricing: { Linux: 0.0336, Windows: null, RHEL: 0.0936, UbuntuPro: 0.0392, SUSE: 0.0436 } },
      { value: "t4g.large", cpu: 2, ram: "8 GiB", pricing: { Linux: 0.0672, Windows: null, RHEL: 0.1272, UbuntuPro: 0.0784, SUSE: 0.0772 } },
      { value: "t4g.xlarge", cpu: 4, ram: "16 GiB", pricing: { Linux: 0.1344, Windows: null, RHEL: 0.1944, UbuntuPro: 0.1568, SUSE: 0.1444 } },
      { value: "t4g.2xlarge", cpu: 8, ram: "32 GiB", pricing: { Linux: 0.2688, Windows: null, RHEL: 0.3288, UbuntuPro: 0.3136, SUSE: 0.2788 } },
      { value: "m5.large", cpu: 2, ram: "8 GiB", pricing: { Linux: 0.0960, Windows: 0.1880, RHEL: 0.1560, UbuntuPro: 0.1160, SUSE: 0.2160 } },
      { value: "m5.xlarge", cpu: 4, ram: "16 GiB", pricing: { Linux: 0.1920, Windows: 0.3760, RHEL: 0.2520, UbuntuPro: 0.2320, SUSE: 0.3120 } },
      { value: "m5.2xlarge", cpu: 8, ram: "32 GiB", pricing: { Linux: 0.3840, Windows: 0.7520, RHEL: 0.4440, UbuntuPro: 0.4640, SUSE: 0.5040 } },
      { value: "m5.4xlarge", cpu: 16, ram: "64 GiB", pricing: { Linux: 0.7680, Windows: 1.5040, RHEL: 0.8280, UbuntuPro: 0.9280, SUSE: 0.8880 } },
      { value: "m6g.large", cpu: 2, ram: "8 GiB", pricing: { Linux: 0.0770, Windows: null, RHEL: 0.1370, UbuntuPro: 0.0930, SUSE: 0.1970 } },
      { value: "m6g.xlarge", cpu: 4, ram: "16 GiB", pricing: { Linux: 0.1540, Windows: null, RHEL: 0.2140, UbuntuPro: 0.1860, SUSE: 0.2740 } },
      { value: "m6g.2xlarge", cpu: 8, ram: "32 GiB", pricing: { Linux: 0.3080, Windows: null, RHEL: 0.3680, UbuntuPro: 0.3720, SUSE: 0.4280 } },
      { value: "m6g.4xlarge", cpu: 16, ram: "64 GiB", pricing: { Linux: 0.6160, Windows: null, RHEL: 0.6760, UbuntuPro: 0.7440, SUSE: 0.7360 } },
      { value: "c5.large", cpu: 2, ram: "4 GiB", pricing: { Linux: 0.0850, Windows: 0.1770, RHEL: 0.1450, UbuntuPro: 0.1050, SUSE: 0.2050 } },
      { value: "c5.xlarge", cpu: 4, ram: "8 GiB", pricing: { Linux: 0.1700, Windows: 0.3540, RHEL: 0.2300, UbuntuPro: 0.2100, SUSE: 0.2900 } },
      { value: "c5.2xlarge", cpu: 8, ram: "16 GiB", pricing: { Linux: 0.3400, Windows: 0.7080, RHEL: 0.4000, UbuntuPro: 0.4200, SUSE: 0.4600 } },
      { value: "c5.4xlarge", cpu: 16, ram: "32 GiB", pricing: { Linux: 0.6800, Windows: 1.4160, RHEL: 0.7400, UbuntuPro: 0.8400, SUSE: 0.8000 } },
      { value: "c6g.large", cpu: 2, ram: "4 GiB", pricing: { Linux: 0.0680, Windows: null, RHEL: 0.1280, UbuntuPro: 0.0840, SUSE: 0.1880 } },
      { value: "c6g.xlarge", cpu: 4, ram: "8 GiB", pricing: { Linux: 0.1360, Windows: null, RHEL: 0.1960, UbuntuPro: 0.1680, SUSE: 0.2560 } },
      { value: "c6g.2xlarge", cpu: 8, ram: "16 GiB", pricing: { Linux: 0.2720, Windows: null, RHEL: 0.3320, UbuntuPro: 0.3360, SUSE: 0.3920 } },
      { value: "c6g.4xlarge", cpu: 16, ram: "32 GiB", pricing: { Linux: 0.5440, Windows: null, RHEL: 0.6040, UbuntuPro: 0.6720, SUSE: 0.6640 } },
      { value: "r5.large", cpu: 2, ram: "16 GiB", pricing: { Linux: 0.1260, Windows: 0.2180, RHEL: 0.1860, UbuntuPro: 0.1460, SUSE: 0.2460 } },
      { value: "r5.xlarge", cpu: 4, ram: "32 GiB", pricing: { Linux: 0.2520, Windows: 0.4360, RHEL: 0.3120, UbuntuPro: 0.2920, SUSE: 0.3720 } },
      { value: "r5.2xlarge", cpu: 8, ram: "64 GiB", pricing: { Linux: 0.5040, Windows: 0.8720, RHEL: 0.5640, UbuntuPro: 0.5840, SUSE: 0.6240 } },
      { value: "r5.4xlarge", cpu: 16, ram: "128 GiB", pricing: { Linux: 1.0080, Windows: 1.7440, RHEL: 1.0680, UbuntuPro: 1.1680, SUSE: 1.1280 } },
      { value: "r6g.large", cpu: 2, ram: "16 GiB", pricing: { Linux: 0.1010, Windows: null, RHEL: 0.1610, UbuntuPro: 0.1170, SUSE: 0.2210 } },
      { value: "r6g.xlarge", cpu: 4, ram: "32 GiB", pricing: { Linux: 0.2020, Windows: null, RHEL: 0.2620, UbuntuPro: 0.2340, SUSE: 0.3220 } },
      { value: "r6g.2xlarge", cpu: 8, ram: "64 GiB", pricing: { Linux: 0.4040, Windows: null, RHEL: 0.4640, UbuntuPro: 0.4680, SUSE: 0.5240 } },
      { value: "r6g.4xlarge", cpu: 16, ram: "128 GiB", pricing: { Linux: 0.8080, Windows: null, RHEL: 0.8680, UbuntuPro: 0.9360, SUSE: 0.9280 } }
    ];
    return res.json(fallbackData);
  }
});

app.post('/api/compile', (req, res): any => {
  const nodes: VisualNode[] = req.body.nodes;
  const edges: VisualEdge[] = req.body.edges || [];
  if (!nodes || nodes.length === 0) {
    return res.status(400).json({ error: "No nodes provided" });
  }

  if (req.body.canvasState) {
    try {
      fs.writeFileSync(path.join(process.cwd(), 'last-canvas-state.json'), JSON.stringify(req.body.canvasState, null, 2), 'utf-8');
    } catch (e) {
      console.error("Failed to write temporary canvas state:", e);
    }
  }

  try {
    const cdktfApp = new App();
    new CloudForgeStack(cdktfApp, 'cloudforge-export', nodes, edges);
    cdktfApp.synth();

    const generatedFilePath = path.join(__dirname, 'cdktf.out', 'stacks', 'cloudforge-export', 'cdk.tf.json');

    if (fs.existsSync(generatedFilePath)) {
      const generatedCode = fs.readFileSync(generatedFilePath, 'utf-8');
      return res.json({
        message: "Compilation successful",
        code: JSON.parse(generatedCode)
      });
    } else {
      return res.status(500).json({ error: "Synthesized file not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Compilation failed", details: String(error) });
  }
});

const CONFIG_PATH = path.join(os.homedir(), '.cloudforge-config.json');

function getProjectsDir(): string {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (config.projectsDir) {
        return config.projectsDir;
      }
    } catch (err) {
      console.error("Error reading config:", err);
    }
  }
  const defaultDir = path.join(os.homedir(), 'CloudForgeProjects');
  if (!fs.existsSync(defaultDir)) {
    fs.mkdirSync(defaultDir, { recursive: true });
  }
  return defaultDir;
}

function setProjectsDir(dir: string) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ projectsDir: dir }, null, 2));
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_');
}

function getProjectFilePath(dir: string, id: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const match = files.find((file) => file.endsWith(`-${id}.json`) || file === `${id}.json`);
  return match ? path.join(dir, match) : null;
}

// 1. GET settings
app.get('/api/settings', (_req, res) => {
  res.json({ projectsDir: getProjectsDir() });
});

// 2. POST settings
app.post('/api/settings', (req, res): any => {
  const { projectsDir } = req.body;
  if (!projectsDir) {
    return res.status(400).json({ error: "projectsDir is required" });
  }
  try {
    const resolvedPath = path.resolve(projectsDir);
    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true });
    }
    setProjectsDir(resolvedPath);
    res.json({ projectsDir: resolvedPath });
  } catch (err) {
    res.status(500).json({ error: "Failed to configure projects directory", details: String(err) });
  }
});

// 3. GET all projects
app.get('/api/projects', (_req, res) => {
  const dir = getProjectsDir();
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const files = fs.readdirSync(dir);
    const projects: any[] = [];
    files.forEach((file) => {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(dir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const proj = JSON.parse(content);
          if (proj.id && proj.name) {
            projects.push(proj);
          }
        } catch (e) {
          console.warn(`Skipping invalid project file ${file}:`, e);
        }
      }
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: "Failed to read projects from disk", details: String(err) });
  }
});

// 4. POST save/create project
app.post('/api/projects', (req, res): any => {
  const project = req.body;
  if (!project.id || !project.name) {
    return res.status(400).json({ error: "Project id and name are required" });
  }
  const dir = getProjectsDir();
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Delete any old filename version for this project to prevent duplicate files
    const existingPath = getProjectFilePath(dir, project.id);
    if (existingPath) {
      try {
        fs.unlinkSync(existingPath);
      } catch (e) { }
    }
    const safeName = sanitizeFilename(project.name);
    const filePath = path.join(dir, `${safeName}-${project.id}.json`);
    project.updatedAt = Date.now();
    fs.writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf-8');
    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ error: "Failed to save project to disk", details: String(err) });
  }
});

// 5. PUT rename project
app.put('/api/projects/:id', (req, res): any => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  const dir = getProjectsDir();
  const existingPath = getProjectFilePath(dir, id);
  try {
    if (!existingPath || !fs.existsSync(existingPath)) {
      return res.status(404).json({ error: "Project not found" });
    }
    const content = fs.readFileSync(existingPath, 'utf-8');
    const project = JSON.parse(content);
    project.name = name;
    project.updatedAt = Date.now();

    // Delete old name file
    fs.unlinkSync(existingPath);

    // Create new name file
    const safeName = sanitizeFilename(name);
    const newPath = path.join(dir, `${safeName}-${id}.json`);
    fs.writeFileSync(newPath, JSON.stringify(project, null, 2), 'utf-8');

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ error: "Failed to rename project", details: String(err) });
  }
});

// 6. DELETE project
app.delete('/api/projects/:id', (req, res): any => {
  const { id } = req.params;
  const dir = getProjectsDir();
  const filePath = getProjectFilePath(dir, id);
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Project not found on disk" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project file", details: String(err) });
  }
});

// 7. GET browse filesystem
app.get('/api/fs/browse', (req, res): any => {
  const queryPath = req.query.path as string;
  let targetPath = queryPath || os.homedir();

  try {
    targetPath = path.resolve(targetPath);
    if (!fs.existsSync(targetPath)) {
      return res.status(400).json({ error: "Path does not exist" });
    }

    const stats = fs.statSync(targetPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: "Path is not a directory" });
    }

    const entries = fs.readdirSync(targetPath, { withFileTypes: true });

    const folders = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        path: path.join(targetPath, entry.name),
        isDir: true,
      }));

    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => ({
        name: entry.name,
        path: path.join(targetPath, entry.name),
        isDir: false,
      }));

    res.json({
      currentPath: targetPath,
      parentPath: path.dirname(targetPath),
      folders,
      files,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to read directory", details: String(err) });
  }
});

function getDirSize(dirPath: string): number {
  let size = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          size += getDirSize(fullPath);
        } else if (entry.isFile()) {
          const stats = fs.statSync(fullPath);
          size += stats.size;
        }
      } catch (e) {
        // ignore inaccessible files
      }
    }
  } catch (err) {
    // ignore failures
  }
  return size;
}

app.get('/api/fs/size', (req, res): any => {
  const targetPath = req.query.path as string;
  if (!targetPath) {
    return res.status(400).json({ error: "Path query parameter is required" });
  }

  try {
    const resolvedPath = path.resolve(targetPath);
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: "Path does not exist" });
    }

    const stats = fs.statSync(resolvedPath);
    let sizeBytes = 0;
    if (stats.isDirectory()) {
      sizeBytes = getDirSize(resolvedPath);
    } else {
      sizeBytes = stats.size;
    }

    res.json({ path: resolvedPath, sizeBytes });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate path size", details: String(err) });
  }
});

let activeProcess: ChildProcessWithoutNullStreams | null = null;

const stripAnsi = (str: string) => {
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
};

app.post('/api/deploy/input', (req, res): any => {
  const { input } = req.body;
  if (activeProcess && !activeProcess.killed) {
    activeProcess.stdin.write(input + "\n");
    return res.json({ success: true });
  }
  return res.status(400).json({ error: "No active deployment process running" });
});

app.get('/api/deploy/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendSSE = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const deployDir = path.join(__dirname, 'cdktf.out', 'stacks', 'cloudforge-export');
  if (!fs.existsSync(deployDir)) {
    sendSSE({ type: "stderr", text: "❌ CDKTF synthesis output not found. Please compile the stack first.\n" });
    sendSSE({ type: "exit", code: 1 });
    res.end();
    return;
  }

  const isWindows = process.platform === 'win32';
  const localTerraformPath = path.join(__dirname, isWindows ? 'terraform.exe' : 'terraform');
  const terraformCmd = fs.existsSync(localTerraformPath) ? localTerraformPath : 'terraform';

  sendSSE({ type: "stdout", text: `🚀 Starting deployment process in:\n📁 ${deployDir}\n\n` });

  // Run a command helper
  const runTerraformCommand = (args: string[]): Promise<number> => {
    return new Promise((resolve) => {
      sendSSE({ type: "stdout", text: `\n✨ Running: terraform ${args.join(' ')}\n` });

      const proc = spawn(terraformCmd, args, { cwd: deployDir });
      activeProcess = proc;

      proc.stdout.on('data', (data) => {
        const text = stripAnsi(data.toString());
        sendSSE({ type: "stdout", text });
        if (text.toLowerCase().includes('enter a value:')) {
          sendSSE({ type: "awaitingInput" });
        }
      });

      proc.stderr.on('data', (data) => {
        const text = stripAnsi(data.toString());
        sendSSE({ type: "stderr", text });
      });

      proc.on('close', (code) => {
        activeProcess = null;
        resolve(code || 0);
      });

      proc.on('error', (err) => {
        sendSSE({ type: "stderr", text: `❌ Execution error: ${err.message}\n` });
        activeProcess = null;
        resolve(1);
      });
    });
  };

  // Run init, plan, then apply
  (async () => {
    let code = await runTerraformCommand(['init']);
    if (code !== 0) {
      sendSSE({ type: "stderr", text: `\n❌ terraform init failed with exit code ${code}\n` });
      sendSSE({ type: "exit", code });
      res.end();
      return;
    }

    code = await runTerraformCommand(['plan', '-lock=false']);
    if (code !== 0) {
      sendSSE({ type: "stderr", text: `\n❌ terraform plan failed with exit code ${code}\n` });
      sendSSE({ type: "exit", code });
      res.end();
      return;
    }

    code = await runTerraformCommand(['apply', '-lock=false']);
    if (code !== 0) {
      sendSSE({ type: "stderr", text: `\n❌ terraform apply failed with exit code ${code}\n` });
      sendSSE({ type: "exit", code });
      res.end();
      return;
    }

    // Save deployment state file
    const generatedFilePath = path.join(deployDir, 'cdk.tf.json');
    const deployedFilePath = path.join(__dirname, 'deployed-cdk.tf.json');
    try {
      fs.copyFileSync(generatedFilePath, deployedFilePath);

      // Save history record
      const timestamp = Date.now();
      const recordId = `deploy-${timestamp}`;
      const DEPLOYMENTS_DIR = path.join(__dirname, 'deployments');
      if (!fs.existsSync(DEPLOYMENTS_DIR)) {
        fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
      }
      const recordPath = path.join(DEPLOYMENTS_DIR, `${recordId}.json`);
      const schemaCode = JSON.parse(fs.readFileSync(generatedFilePath, 'utf-8'));
      let canvasState = null;
      const canvasStatePath = path.join(process.cwd(), 'last-canvas-state.json');
      if (fs.existsSync(canvasStatePath)) {
        try {
          canvasState = JSON.parse(fs.readFileSync(canvasStatePath, 'utf-8'));
        } catch (err) {
          console.error("Failed to read cached canvas state:", err);
        }
      }
      const record = {
        id: recordId,
        timestamp,
        code: schemaCode,
        canvasState: canvasState
      };
      fs.writeFileSync(recordPath, JSON.stringify(record, null, 2), 'utf-8');

      sendSSE({ type: "stdout", text: "💾 Deployment state and record saved successfully.\n" });
    } catch (e: any) {
      sendSSE({ type: "stderr", text: `⚠️ Warning: Failed to save deployment state file: ${e.message}\n` });
    }

    sendSSE({ type: "stdout", text: "\n🎉 Deployment successfully completed!\n" });
    sendSSE({ type: "exit", code: 0 });
    res.end();
  })();

  req.on('close', () => {
    if (activeProcess) {
      activeProcess.kill();
      activeProcess = null;
    }
  });
});

async function getLiveNetworkDetails(subnetId: string) {
  try {
    // 1. Describe Subnet to get VPC ID and Subnet CIDR
    const subnetCmd = `aws ec2 describe-subnets --subnet-ids ${subnetId}`;
    const { stdout: subnetStdout } = await execPromise(subnetCmd);
    const subnetData = JSON.parse(subnetStdout).Subnets?.[0];
    if (!subnetData) return null;

    const vpcId = subnetData.VpcId;
    const subnetCidr = subnetData.CidrBlock;

    // 2. Describe VPC to get VPC CIDR
    const vpcCmd = `aws ec2 describe-vpcs --vpc-ids ${vpcId}`;
    const { stdout: vpcStdout } = await execPromise(vpcCmd);
    const vpcData = JSON.parse(vpcStdout).Vpcs?.[0];
    const vpcCidr = vpcData?.CidrBlock || "172.31.0.0/16";

    // 3. Describe Internet Gateway attached to the VPC
    const igwCmd = `aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=${vpcId}"`;
    let igwId = null;
    let igwName = "Internet Gateway";
    try {
      const { stdout: igwStdout } = await execPromise(igwCmd);
      const igwData = JSON.parse(igwStdout).InternetGateways?.[0];
      if (igwData) {
        igwId = igwData.InternetGatewayId;
        const nameTag = igwData.Tags?.find((t: any) => t.Key === 'Name')?.Value;
        if (nameTag) igwName = nameTag;
      }
    } catch (e) {
      console.warn(`Failed to fetch IGW details for VPC ${vpcId}:`, e);
    }

    // Fallback if no IGW found (e.g. CLI permissions or mock setup) to ensure it is created on canvas
    if (!igwId && vpcId) {
      igwId = `igw-${vpcId.replace('vpc-', '')}`;
      igwName = "Default IGW";
    }


    return {
      vpcId,
      vpcCidr,
      subnetId,
      subnetCidr,
      internetGatewayId: igwId,
      internetGatewayName: igwName
    };
  } catch (err) {
    console.error(`Error querying AWS CLI for subnet ${subnetId}:`, err);
    return null;
  }
}

app.get('/api/deploy/live-resources', async (_req, res): Promise<any> => {
  let tfstatePath = path.join(__dirname, 'terraform.cloudforge-export.tfstate');
  if (!fs.existsSync(tfstatePath)) {
    tfstatePath = path.join(__dirname, 'cdktf.out', 'stacks', 'cloudforge-export', 'terraform.tfstate');
  }
  if (!fs.existsSync(tfstatePath)) {
    return res.json({ resources: {} });
  }

  try {
    const tfstate = JSON.parse(fs.readFileSync(tfstatePath, 'utf-8'));
    const resourcesInfo: Record<string, any> = {};

    if (tfstate.resources) {
      for (const resource of tfstate.resources) {
        if (resource.type === 'aws_instance') {
          const nodeSafeId = resource.name;
          const instanceData = resource.instances?.[0]?.attributes;
          if (instanceData) {
            const subnetId = instanceData.subnet_id;
            let networkDetails = null;

            if (subnetId) {
              networkDetails = await getLiveNetworkDetails(subnetId);
            }

            resourcesInfo[nodeSafeId] = {
              instanceId: instanceData.id,
              publicIp: instanceData.public_ip || null,
              privateIp: instanceData.private_ip || null,
              publicDns: instanceData.public_dns || null,
              privateDns: instanceData.private_dns || null,
              state: instanceData.instance_state || 'running',
              subnetId: subnetId || null,
              networkDetails: networkDetails || {
                vpcId: 'vpc-default',
                vpcCidr: '172.31.0.0/16',
                subnetId: subnetId || 'subnet-default',
                subnetCidr: '172.31.16.0/20',
                internetGatewayId: 'igw-default',
                internetGatewayName: 'Default IGW'
              }
            };
          }
        }
      }
    }
    return res.json({ resources: resourcesInfo });
  } catch (err) {
    console.error("Failed to read terraform state:", err);
    return res.status(500).json({ error: "Failed to read terraform state", details: String(err) });
  }
});

const DEPLOYMENTS_DIR = path.join(__dirname, 'deployments');
if (!fs.existsSync(DEPLOYMENTS_DIR)) {
  fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
}

app.get('/api/deploy/status', (_req, res) => {
  const deployedFilePath = path.join(__dirname, 'deployed-cdk.tf.json');
  const deployed = fs.existsSync(deployedFilePath);

  let latestDeploymentId: string | null = null;
  if (fs.existsSync(DEPLOYMENTS_DIR)) {
    const files = fs.readdirSync(DEPLOYMENTS_DIR)
      .filter(f => f.startsWith('deploy-') && f.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a));
    if (files.length > 0) {
      latestDeploymentId = files[0].replace('.json', '');
    }
  }

  res.json({ deployed, latestDeploymentId });
});

app.get('/api/deployments', (_req, res) => {
  try {
    if (!fs.existsSync(DEPLOYMENTS_DIR)) {
      res.json([]);
      return;
    }
    const files = fs.readdirSync(DEPLOYMENTS_DIR)
      .filter(f => f.startsWith('deploy-') && f.endsWith('.json'));

    const deployments = files.map(file => {
      const filePath = path.join(DEPLOYMENTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }).sort((a, b) => b.timestamp - a.timestamp);

    res.json(deployments);
  } catch (err) {
    res.status(500).json({ error: "Failed to load deployments", details: String(err) });
  }
});

app.post('/api/deployments/redeploy', (req, res) => {
  const { deploymentId } = req.body;
  if (!deploymentId) {
    res.status(400).json({ error: "deploymentId is required" });
    return;
  }

  const recordPath = path.join(DEPLOYMENTS_DIR, `${deploymentId}.json`);
  if (!fs.existsSync(recordPath)) {
    res.status(404).json({ error: "Deployment not found" });
    return;
  }

  try {
    const record = JSON.parse(fs.readFileSync(recordPath, 'utf-8'));
    const deployDir = path.join(__dirname, 'cdktf.out', 'stacks', 'cloudforge-export');
    if (!fs.existsSync(deployDir)) {
      fs.mkdirSync(deployDir, { recursive: true });
    }
    const targetPath = path.join(deployDir, 'cdk.tf.json');
    fs.writeFileSync(targetPath, JSON.stringify(record.code, null, 2), 'utf-8');

    res.json({ success: true, message: "Code loaded into active workspace" });
  } catch (err) {
    res.status(500).json({ error: "Failed to redeploy configuration", details: String(err) });
  }
});

app.put('/api/deployments/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || typeof name !== 'string') {
    res.status(400).json({ error: "Name is required and must be a string" });
    return;
  }

  const recordPath = path.join(DEPLOYMENTS_DIR, `${id}.json`);
  if (!fs.existsSync(recordPath)) {
    res.status(404).json({ error: "Deployment not found" });
    return;
  }

  try {
    const record = JSON.parse(fs.readFileSync(recordPath, 'utf-8'));
    record.name = name;
    fs.writeFileSync(recordPath, JSON.stringify(record, null, 2), 'utf-8');
    res.json({ success: true, deployment: record });
  } catch (err) {
    res.status(500).json({ error: "Failed to update deployment name", details: String(err) });
  }
});

app.delete('/api/deployments', (_req, res) => {
  try {
    if (fs.existsSync(DEPLOYMENTS_DIR)) {
      const files = fs.readdirSync(DEPLOYMENTS_DIR)
        .filter(f => f.startsWith('deploy-') && f.endsWith('.json'));
      files.forEach(file => {
        fs.unlinkSync(path.join(DEPLOYMENTS_DIR, file));
      });
    }
    res.json({ success: true, message: "Deployments history cleared successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear deployments", details: String(err) });
  }
});

app.get('/api/destroy/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendSSE = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const deployDir = path.join(__dirname, 'cdktf.out', 'stacks', 'cloudforge-export');
  if (!fs.existsSync(deployDir)) {
    sendSSE({ type: "stderr", text: "❌ CDKTF synthesis output not found. Please compile the stack first.\n" });
    sendSSE({ type: "exit", code: 1 });
    res.end();
    return;
  }

  const isWindows = process.platform === 'win32';
  const localTerraformPath = path.join(__dirname, isWindows ? 'terraform.exe' : 'terraform');
  const terraformCmd = fs.existsSync(localTerraformPath) ? localTerraformPath : 'terraform';

  sendSSE({ type: "stdout", text: `🚀 Starting destruction process in:\n📁 ${deployDir}\n\n` });

  const runTerraformCommand = (args: string[]): Promise<number> => {
    return new Promise((resolve) => {
      sendSSE({ type: "stdout", text: `\n✨ Running: terraform ${args.join(' ')}\n` });

      const proc = spawn(terraformCmd, args, { cwd: deployDir });
      activeProcess = proc;

      proc.stdout.on('data', (data) => {
        const text = stripAnsi(data.toString());
        sendSSE({ type: "stdout", text });
        if (text.toLowerCase().includes('enter a value:')) {
          sendSSE({ type: "awaitingInput" });
        }
      });

      proc.stderr.on('data', (data) => {
        const text = stripAnsi(data.toString());
        sendSSE({ type: "stderr", text });
      });

      proc.on('close', (code) => {
        activeProcess = null;
        resolve(code || 0);
      });

      proc.on('error', (err) => {
        sendSSE({ type: "stderr", text: `❌ Execution error: ${err.message}\n` });
        activeProcess = null;
        resolve(1);
      });
    });
  };

  (async () => {
    let code = await runTerraformCommand(['init']);
    if (code !== 0) {
      sendSSE({ type: "stderr", text: `\n❌ terraform init failed with exit code ${code}\n` });
      sendSSE({ type: "exit", code });
      res.end();
      return;
    }

    code = await runTerraformCommand(['destroy', '-lock=false']);
    if (code !== 0) {
      sendSSE({ type: "stderr", text: `\n❌ terraform destroy failed with exit code ${code}\n` });
      sendSSE({ type: "exit", code });
      res.end();
      return;
    }

    const deployedFilePath = path.join(__dirname, 'deployed-cdk.tf.json');
    if (fs.existsSync(deployedFilePath)) {
      try {
        fs.unlinkSync(deployedFilePath);
        sendSSE({ type: "stdout", text: "🗑️ Deployment state file removed.\n" });
      } catch (e: any) {
        sendSSE({ type: "stderr", text: `⚠️ Warning: Failed to remove deployment state file: ${e.message}\n` });
      }
    }

    sendSSE({ type: "stdout", text: "\n🎉 Infrastructure successfully destroyed!\n" });
    sendSSE({ type: "exit", code: 0 });
    res.end();
  })();

  req.on('close', () => {
    if (activeProcess) {
      activeProcess.kill();
      activeProcess = null;
    }
  });
});

app.post('/api/validate-key', async (req, res) => {
    const { provider, model, apiKey, customBaseUrl } = req.body;
    console.log("Validating key for provider:", provider, "with requested model:", model);

    if (!provider || !apiKey) {
      res.status(400).json({ success: false, error: "Provider and API Key are required." });
      return;
    }

    try {
      if (provider === 'gemini') {
        const checkModel = model || 'gemini-3.6-flash';
        const url = `${customBaseUrl || 'https://generativelanguage.googleapis.com'}/v1beta/models/${checkModel}:generateContent?key=${apiKey}`;
        console.log(`[Handshake] Querying Gemini model: ${checkModel} at URL: ${url.replace(apiKey, "REDACTED")}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }] }]
          })
        });

        const data = await response.json() as any;

        if (response.ok) {
          console.log(`[Handshake] Gemini verification succeeded.`);
          res.json({ success: true });
        } else {
          console.error("Gemini Key Validation Error response:", JSON.stringify(data));
          const errMsg = data?.error?.message || (data?.error ? JSON.stringify(data.error) : "Invalid API key or model configuration.");
          res.status(response.status).json({
            success: false,
            error: `Gemini API Error: ${errMsg}`
          });
        }
      } else if (provider === 'claude') {
        const checkModel = model || 'claude-sonnet-5';
        const url = `${customBaseUrl || 'https://api.anthropic.com'}/v1/messages`;
        console.log(`[Handshake] Querying Claude model: ${checkModel} at URL: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: checkModel,
            max_tokens: 5,
            messages: [{ role: "user", content: "ping" }]
          })
        });

        const data = await response.json() as any;

        if (response.ok) {
          console.log(`[Handshake] Claude verification succeeded.`);
          res.json({ success: true });
        } else {
          console.error("Claude Key Validation Error response:", JSON.stringify(data));
          const errMsg = data?.error?.message || (data?.error ? JSON.stringify(data.error) : "Invalid API key or model configuration.");
          res.status(response.status).json({
            success: false,
            error: `Claude API Error: ${errMsg}`
          });
        }
      } else {
        res.status(400).json({ success: false, error: "Unknown provider." });
      }
    } catch (err: any) {
      console.error("Validation Connection Error:", err);
      res.status(500).json({ success: false, error: `Connection failed: ${err.message}` });
    }
  });

app.post('/api/survey/next-question', async (req, res) => {
  const { provider, model, apiKey, customBaseUrl, history, topicIndex } = req.body;

  if (!provider || !apiKey || topicIndex === undefined) {
    res.status(400).json({ success: false, error: "Provider, API Key, and topicIndex are required." });
    return;
  }

  const historyString = (history || [])
    .map((h: any) => `Question: ${h.question}\nAnswer: ${h.answer}`)
    .join("\n\n");

  const prompt = `You are an expert Cloud Solutions Architect surveyor. Your job is to dynamically ask the user the next question in a cloud design survey to gather specifications for building a cloud architecture diagram.

The current target topic index is ${topicIndex}.
Topics list:
0. Organization: What kind of organization they have (e.g. startup, enterprise, SaaS, e-commerce, etc.)
1. Cloud Drivers: Why they want to move to/build in the cloud (scalability, compliance, migration, cost-savings, etc.)
2. Workload: What exactly they want to build (e.g., three-tier web application, data pipeline, serverless API, etc.)
3. Rationale: Why they want to build this specific workload (business goals, high availability, etc.)
4. Tech & Deployment: How they want to build it (e.g., preference for AWS, specific databases, containers vs VMs, etc.)

Conversation history so far:
${historyString || "No history yet (this is the first question)."}

Generate a clear, friendly, and engaging single question for the user targeting topic #${topicIndex}.
Requirements:
- Take the history of previous answers into account so the question feels personalized and natural.
- Return ONLY the raw question text. Do not add headers, prefix labels, explanations, or markdown code fences. Just output the question.`;

  try {
    let questionText = "";
    if (provider === 'gemini') {
      const checkModel = model || 'gemini-3.6-flash';
      const url = `${customBaseUrl || 'https://generativelanguage.googleapis.com'}/v1beta/models/${checkModel}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await response.json() as any;
      if (!response.ok) {
        res.status(response.status).json({ success: false, error: data?.error?.message || "Gemini API error." });
        return;
      }
      questionText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    } else if (provider === 'claude') {
      const checkModel = model || 'claude-sonnet-5';
      const url = `${customBaseUrl || 'https://api.anthropic.com'}/v1/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: checkModel,
          max_tokens: 150,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json() as any;
      if (!response.ok) {
        res.status(response.status).json({ success: false, error: data?.error?.message || "Claude API error." });
        return;
      }
      questionText = data?.content?.[0]?.text?.trim() || "";
    } else {
      res.status(400).json({ success: false, error: "Unknown provider." });
      return;
    }

    res.json({ success: true, question: questionText });
  } catch (err: any) {
    res.status(500).json({ success: false, error: `Connection failed: ${err.message}` });
  }
});

app.post('/api/survey/generate-diagram', async (req, res) => {
  const { provider, model, apiKey, customBaseUrl, history } = req.body;

  if (!provider || !apiKey) {
    res.status(400).json({ success: false, error: "Provider and API Key are required." });
    return;
  }

  const historyString = (history || [])
    .map((h: any) => `Question: ${h.question}\nAnswer: ${h.answer}`)
    .join("\n\n");

  const prompt = `You are an expert Cloud Solutions Architect. Based on the user's survey responses below:
${historyString}

Generate an initial cloud architecture layout.
Return ONLY a valid JSON object matching the following structure. Do not wrap in markdown code fences. Do not output any explanation text.

JSON Structure:
{
  "nodes": [
    {
      "id": "node_1",
      "type": "ec2Node" | "s3Node" | "iamNode",
      "data": {
        "label": "Web Server (EC2)",
        "region": "us-east-1",
        "instanceType": "t3.micro",
        "volumeSize": 20
      },
      "position": { "x": 100, "y": 100 }
    }
  ],
  "edges": [
    { "source": "node_1", "target": "node_2" }
  ]
}

Guidelines:
- Supported node types are 'ec2Node', 's3Node', and 'iamNode'.
- Nodes should have a label and relevant configuration in \`data\`.
- Position x and y coordinates must be spaced out cleanly (e.g. increments of 250px or 300px horizontally/vertically) so they do not overlap.
- Return ONLY valid JSON, with no explanation or wrapping.`;

  try {
    let rawText = "";
    if (provider === 'gemini') {
      const checkModel = model || 'gemini-3.6-flash';
      const url = `${customBaseUrl || 'https://generativelanguage.googleapis.com'}/v1beta/models/${checkModel}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await response.json() as any;
      if (!response.ok) {
        res.status(response.status).json({ success: false, error: data?.error?.message || "Gemini API error." });
        return;
      }
      rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    } else if (provider === 'claude') {
      const checkModel = model || 'claude-sonnet-5';
      const url = `${customBaseUrl || 'https://api.anthropic.com'}/v1/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: checkModel,
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json() as any;
      if (!response.ok) {
        res.status(response.status).json({ success: false, error: data?.error?.message || "Claude API error." });
        return;
      }
      rawText = data?.content?.[0]?.text?.trim() || "";
    } else {
      res.status(400).json({ success: false, error: "Unknown provider." });
      return;
    }

    // Clean up code fences if returned
    let cleanText = rawText;
    if (cleanText.includes("```")) {
      const matches = cleanText.match(/```(?:json)?([\s\S]*?)```/);
      if (matches && matches[1]) {
        cleanText = matches[1].trim();
      }
    }

    try {
      const diagram = JSON.parse(cleanText);
      res.json({ success: true, diagram });
    } catch (parseErr) {
      console.error("JSON parsing failed. Raw response:", rawText);
      res.status(500).json({ success: false, error: "Failed to parse generated layout. AI model response was not valid JSON.", rawResponse: rawText });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: `Connection failed: ${err.message}` });
  }
});

  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`🚀 CloudForge CDKTF Compiler Engine running on http://localhost:${PORT}`);
  });