// server.ts
import express from 'express';
import cors from 'cors';
import { App, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

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

import * as fs from 'fs';
import * as path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

interface VisualNode {
  id: string;
  type: string;
  data: {
    label: string;
    region: string;
    isPublic?: boolean;
    versioning?: boolean;
    iamType?: string;
    roleService?: string;
    policyActions?: string;
    policyResource?: string;
  };
}

interface VisualEdge {
  source: string;
  target: string;
}

class CloudForgeStack extends TerraformStack {
  constructor(scope: Construct, id: string, nodes: VisualNode[], edges: VisualEdge[]) {
    super(scope, id);

    const primaryRegion = nodes.length > 0 ? nodes[0].data.region : 'us-east-1';
    new AwsProvider(this, 'AWS', { region: primaryRegion });

    const resourceMap = new Map<string, { type: string; iamType?: string; name: string; ref: any }>();

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
      } else if (node.type === 'iamNode') {
        switch (node.data.iamType) {
          case 'User':
            const user = new IamUser(this, safeId, {
              name: labelName,
              tags: { ManagedBy: 'CloudForge' },
            });
            resourceMap.set(node.id, { type: 'iam', iamType: 'User', name: labelName, ref: user });
            break;
          case 'Group':
            const group = new IamGroup(this, safeId, {
              name: labelName,
            });
            resourceMap.set(node.id, { type: 'iam', iamType: 'Group', name: labelName, ref: group });
            break;
          case 'Role':
            const roleService = node.data.roleService || 'ec2.amazonaws.com';
            const role = new IamRole(this, safeId, {
              name: labelName,
              assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Action: 'sts:AssumeRole',
                    Principal: {
                      Service: roleService,
                    },
                    Effect: 'Allow',
                    Sid: '',
                  },
                ],
              }),
              tags: { ManagedBy: 'CloudForge' },
            });
            resourceMap.set(node.id, { type: 'iam', iamType: 'Role', name: labelName, ref: role });
            break;
          case 'Policy':
            const policyActionsStr = node.data.policyActions || 's3:*';
            const policyResource = node.data.policyResource || '*';
            const actions = policyActionsStr.split(',').map((act) => act.trim()).filter(Boolean);
            
            const policy = new IamPolicy(this, safeId, {
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
            });
            resourceMap.set(node.id, { type: 'iam', iamType: 'Policy', name: labelName, ref: policy });
            break;
        }
      }
    });

    // Track groups per user to avoid overriding multiple memberships
    const userGroups = new Map<string, { userRef: IamUser; userLabel: string; groupNames: string[] }>();

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
        const userNodeId = sourceNode.iamType === 'User' ? edge.source : edge.target;

        const userRef = userNode.ref as IamUser;
        const groupRef = groupNode.ref as IamGroup;

        if (!userGroups.has(userNodeId)) {
          userGroups.set(userNodeId, { userRef, userLabel: userNode.name, groupNames: [] });
        }
        userGroups.get(userNodeId)!.groupNames.push(groupRef.name);
      }

      // Policy <-> User/Group/Role Attachment
      if (sourceNode.iamType === 'Policy' || targetNode.iamType === 'Policy') {
        const policyNode = sourceNode.iamType === 'Policy' ? sourceNode : targetNode;
        const attachedNode = sourceNode.iamType === 'Policy' ? targetNode : sourceNode;
        const attachedNodeId = sourceNode.iamType === 'Policy' ? edge.target : edge.source;

        const policyRef = policyNode.ref as IamPolicy;
        const safeAttachId = `${attachedNodeId}_${index}`.replace(/[^a-zA-Z0-9]/g, '');

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
    });

    // Create User-Group memberships
    userGroups.forEach((val, userNodeId) => {
      const safeMembershipId = `membership_${userNodeId}`.replace(/[^a-zA-Z0-9]/g, '');
      new IamUserGroupMembership(this, safeMembershipId, {
        user: val.userRef.name,
        groups: val.groupNames,
      });
    });
  }
}

// Fixed endpoint with strict return pathways
app.post('/api/compile', (req, res): any => {
  const nodes: VisualNode[] = req.body.nodes;
  const edges: VisualEdge[] = req.body.edges || [];
  if (!nodes || nodes.length === 0) {
    return res.status(400).json({ error: "No nodes provided" });
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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 CloudForge CDKTF Compiler Engine running on http://localhost:${PORT}`);
});