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
    isPublic: boolean;
    versioning: boolean;
  };
}

class CloudForgeStack extends TerraformStack {
  constructor(scope: Construct, id: string, nodes: VisualNode[]) {
    super(scope, id);

    const primaryRegion = nodes.length > 0 ? nodes[0].data.region : 'us-east-1';
    new AwsProvider(this, 'AWS', { region: primaryRegion });

    nodes.forEach((node) => {
      if (node.type === 's3Node') {
        const safeId = node.id.replace(/[^a-zA-Z0-9]/g, '');
        const bucketName = node.data.label.toLowerCase().replace(/[^a-z0-9-]/g, '-');

        const bucket = new S3Bucket(this, safeId, {
          bucket: bucketName,
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
      }
    });
  }
}

// Fixed endpoint with strict return pathways
app.post('/api/compile', (req, res): any => {
  const nodes: VisualNode[] = req.body.nodes;
  if (!nodes || nodes.length === 0) {
    return res.status(400).json({ error: "No nodes provided" });
  }

  try {
    const cdktfApp = new App();
    new CloudForgeStack(cdktfApp, 'cloudforge-export', nodes);
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