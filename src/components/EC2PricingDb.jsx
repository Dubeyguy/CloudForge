export const ALL_INSTANCE_TYPES = [
  // T2 Family (Burstable, Legacy)
  { value: "t2.nano", label: "t2.nano", family: "General Purpose", cpu: 1, ram: "0.5 GiB", currentGen: true, freeTier: false, legacy: true, pricing: { Linux: 0.0058, Windows: 0.0081, RHEL: 0.0658, UbuntuPro: 0.0076, SUSE: 0.0158 } },
  { value: "t2.micro", label: "t2.micro", family: "General Purpose", cpu: 1, ram: "1 GiB", currentGen: true, freeTier: true, legacy: true, pricing: { Linux: 0.0116, Windows: 0.0162, RHEL: 0.0716, UbuntuPro: 0.0142, SUSE: 0.0216 } },
  { value: "t2.small", label: "t2.small", family: "General Purpose", cpu: 1, ram: "2 GiB", currentGen: true, freeTier: false, legacy: true, pricing: { Linux: 0.0230, Windows: 0.0324, RHEL: 0.0830, UbuntuPro: 0.0266, SUSE: 0.0330 } },
  { value: "t2.medium", label: "t2.medium", family: "General Purpose", cpu: 2, ram: "4 GiB", currentGen: true, freeTier: false, legacy: true, pricing: { Linux: 0.0464, Windows: 0.0648, RHEL: 0.1064, UbuntuPro: 0.0531, SUSE: 0.0564 } },
  { value: "t2.large", label: "t2.large", family: "General Purpose", cpu: 2, ram: "8 GiB", currentGen: true, freeTier: false, legacy: true, pricing: { Linux: 0.0928, Windows: 0.1296, RHEL: 0.1528, UbuntuPro: 0.1062, SUSE: 0.1028 } },
  { value: "t2.xlarge", label: "t2.xlarge", family: "General Purpose", cpu: 4, ram: "16 GiB", currentGen: true, freeTier: false, legacy: true, pricing: { Linux: 0.1856, Windows: 0.2592, RHEL: 0.2456, UbuntuPro: 0.2124, SUSE: 0.1956 } },
  { value: "t2.2xlarge", label: "t2.2xlarge", family: "General Purpose", cpu: 8, ram: "32 GiB", currentGen: true, freeTier: false, legacy: true, pricing: { Linux: 0.3712, Windows: 0.5184, RHEL: 0.4312, UbuntuPro: 0.4248, SUSE: 0.3812 } },

  // T3 Family (Burstable, Current Gen)
  { value: "t3.nano", label: "t3.nano", family: "General Purpose", cpu: 1, ram: "0.5 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0052, Windows: 0.0079, RHEL: 0.0652, UbuntuPro: 0.0070, SUSE: 0.0152 } },
  { value: "t3.micro", label: "t3.micro", family: "General Purpose", cpu: 1, ram: "1 GiB", currentGen: true, freeTier: true, legacy: false, pricing: { Linux: 0.0104, Windows: 0.0156, RHEL: 0.0704, UbuntuPro: 0.0130, SUSE: 0.0204 } },
  { value: "t3.small", label: "t3.small", family: "General Purpose", cpu: 2, ram: "2 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0208, Windows: 0.0312, RHEL: 0.0808, UbuntuPro: 0.0244, SUSE: 0.0308 } },
  { value: "t3.medium", label: "t3.medium", family: "General Purpose", cpu: 2, ram: "4 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0416, Windows: 0.0624, RHEL: 0.1016, UbuntuPro: 0.0488, SUSE: 0.0516 } },
  { value: "t3.large", label: "t3.large", family: "General Purpose", cpu: 2, ram: "8 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0832, Windows: 0.1248, RHEL: 0.1432, UbuntuPro: 0.0976, SUSE: 0.0932 } },
  { value: "t3.xlarge", label: "t3.xlarge", family: "General Purpose", cpu: 4, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1664, Windows: 0.2496, RHEL: 0.2264, UbuntuPro: 0.1952, SUSE: 0.1764 } },
  { value: "t3.2xlarge", label: "t3.2xlarge", family: "General Purpose", cpu: 8, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.3328, Windows: 0.4992, RHEL: 0.3928, UbuntuPro: 0.3904, SUSE: 0.3428 } },

  // T4g Family (Burstable, AWS Graviton2)
  { value: "t4g.nano", label: "t4g.nano", family: "General Purpose", cpu: 2, ram: "0.5 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0042, Windows: null, RHEL: 0.0642, UbuntuPro: 0.0056, SUSE: 0.0142 } },
  { value: "t4g.micro", label: "t4g.micro", family: "General Purpose", cpu: 2, ram: "1 GiB", currentGen: true, freeTier: true, legacy: false, pricing: { Linux: 0.0084, Windows: null, RHEL: 0.0684, UbuntuPro: 0.0104, SUSE: 0.0184 } },
  { value: "t4g.small", label: "t4g.small", family: "General Purpose", cpu: 2, ram: "2 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0168, Windows: null, RHEL: 0.0768, UbuntuPro: 0.0196, SUSE: 0.0268 } },
  { value: "t4g.medium", label: "t4g.medium", family: "General Purpose", cpu: 2, ram: "4 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0336, Windows: null, RHEL: 0.0936, UbuntuPro: 0.0392, SUSE: 0.0436 } },
  { value: "t4g.large", label: "t4g.large", family: "General Purpose", cpu: 2, ram: "8 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0672, Windows: null, RHEL: 0.1272, UbuntuPro: 0.0784, SUSE: 0.0772 } },
  { value: "t4g.xlarge", label: "t4g.xlarge", family: "General Purpose", cpu: 4, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1344, Windows: null, RHEL: 0.1944, UbuntuPro: 0.1568, SUSE: 0.1444 } },
  { value: "t4g.2xlarge", label: "t4g.2xlarge", family: "General Purpose", cpu: 8, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.2688, Windows: null, RHEL: 0.3288, UbuntuPro: 0.3136, SUSE: 0.2788 } },

  // M5 Family (General Purpose)
  { value: "m5.large", label: "m5.large", family: "General Purpose", cpu: 2, ram: "8 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0960, Windows: 0.1880, RHEL: 0.1560, UbuntuPro: 0.1160, SUSE: 0.2160 } },
  { value: "m5.xlarge", label: "m5.xlarge", family: "General Purpose", cpu: 4, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1920, Windows: 0.3760, RHEL: 0.2520, UbuntuPro: 0.2320, SUSE: 0.3120 } },
  { value: "m5.2xlarge", label: "m5.2xlarge", family: "General Purpose", cpu: 8, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.3840, Windows: 0.7520, RHEL: 0.4440, UbuntuPro: 0.4640, SUSE: 0.5040 } },
  { value: "m5.4xlarge", label: "m5.4xlarge", family: "General Purpose", cpu: 16, ram: "64 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.7680, Windows: 1.5040, RHEL: 0.8280, UbuntuPro: 0.9280, SUSE: 0.8880 } },

  // M6g Family (General Purpose, AWS Graviton3)
  { value: "m6g.large", label: "m6g.large", family: "General Purpose", cpu: 2, ram: "8 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0770, Windows: null, RHEL: 0.1370, UbuntuPro: 0.0930, SUSE: 0.1970 } },
  { value: "m6g.xlarge", label: "m6g.xlarge", family: "General Purpose", cpu: 4, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1540, Windows: null, RHEL: 0.2140, UbuntuPro: 0.1860, SUSE: 0.2740 } },
  { value: "m6g.2xlarge", label: "m6g.2xlarge", family: "General Purpose", cpu: 8, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.3080, Windows: null, RHEL: 0.3680, UbuntuPro: 0.3720, SUSE: 0.4280 } },
  { value: "m6g.4xlarge", label: "m6g.4xlarge", family: "General Purpose", cpu: 16, ram: "64 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.6160, Windows: null, RHEL: 0.6760, UbuntuPro: 0.7440, SUSE: 0.7360 } },

  // C5 Family (Compute Optimized)
  { value: "c5.large", label: "c5.large", family: "Compute Optimized", cpu: 2, ram: "4 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0850, Windows: 0.1770, RHEL: 0.1450, UbuntuPro: 0.1050, SUSE: 0.2050 } },
  { value: "c5.xlarge", label: "c5.xlarge", family: "Compute Optimized", cpu: 4, ram: "8 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1700, Windows: 0.3540, RHEL: 0.2300, UbuntuPro: 0.2100, SUSE: 0.2900 } },
  { value: "c5.2xlarge", label: "c5.2xlarge", family: "Compute Optimized", cpu: 8, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.3400, Windows: 0.7080, RHEL: 0.4000, UbuntuPro: 0.4200, SUSE: 0.4600 } },
  { value: "c5.4xlarge", label: "c5.4xlarge", family: "Compute Optimized", cpu: 16, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.6800, Windows: 1.4160, RHEL: 0.7400, UbuntuPro: 0.8400, SUSE: 0.8000 } },

  // C6g Family (Compute Optimized, AWS Graviton3)
  { value: "c6g.large", label: "c6g.large", family: "Compute Optimized", cpu: 2, ram: "4 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.0680, Windows: null, RHEL: 0.1280, UbuntuPro: 0.0840, SUSE: 0.1880 } },
  { value: "c6g.xlarge", label: "c6g.xlarge", family: "Compute Optimized", cpu: 4, ram: "8 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1360, Windows: null, RHEL: 0.1960, UbuntuPro: 0.1680, SUSE: 0.2560 } },
  { value: "c6g.2xlarge", label: "c6g.2xlarge", family: "Compute Optimized", cpu: 8, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.2720, Windows: null, RHEL: 0.3320, UbuntuPro: 0.3360, SUSE: 0.3920 } },
  { value: "c6g.4xlarge", label: "c6g.4xlarge", family: "Compute Optimized", cpu: 16, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.5440, Windows: null, RHEL: 0.6040, UbuntuPro: 0.6720, SUSE: 0.6640 } },

  // R5 Family (Memory Optimized)
  { value: "r5.large", label: "r5.large", family: "Memory Optimized", cpu: 2, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1260, Windows: 0.2180, RHEL: 0.1860, UbuntuPro: 0.1460, SUSE: 0.2460 } },
  { value: "r5.xlarge", label: "r5.xlarge", family: "Memory Optimized", cpu: 4, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.2520, Windows: 0.4360, RHEL: 0.3120, UbuntuPro: 0.2920, SUSE: 0.3720 } },
  { value: "r5.2xlarge", label: "r5.2xlarge", family: "Memory Optimized", cpu: 8, ram: "64 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.5040, Windows: 0.8720, RHEL: 0.5640, UbuntuPro: 0.5840, SUSE: 0.6240 } },
  { value: "r5.4xlarge", label: "r5.4xlarge", family: "Memory Optimized", cpu: 16, ram: "128 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 1.0080, Windows: 1.7440, RHEL: 1.0680, UbuntuPro: 1.1680, SUSE: 1.1280 } },

  // R6g Family (Memory Optimized, AWS Graviton3)
  { value: "r6g.large", label: "r6g.large", family: "Memory Optimized", cpu: 2, ram: "16 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.1010, Windows: null, RHEL: 0.1610, UbuntuPro: 0.1170, SUSE: 0.2210 } },
  { value: "r6g.xlarge", label: "r6g.xlarge", family: "Memory Optimized", cpu: 4, ram: "32 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.2020, Windows: null, RHEL: 0.2620, UbuntuPro: 0.2340, SUSE: 0.3220 } },
  { value: "r6g.2xlarge", label: "r6g.2xlarge", family: "Memory Optimized", cpu: 8, ram: "64 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.4040, Windows: null, RHEL: 0.4640, UbuntuPro: 0.4680, SUSE: 0.5240 } },
  { value: "r6g.4xlarge", label: "r6g.4xlarge", family: "Memory Optimized", cpu: 16, ram: "128 GiB", currentGen: true, freeTier: false, legacy: false, pricing: { Linux: 0.8080, Windows: null, RHEL: 0.8680, UbuntuPro: 0.9360, SUSE: 0.9280 } }
];

export const REGIONAL_MULTIPLIERS = {
  "us-east-1": 1.00,
  "us-east-2": 1.05,
  "us-west-1": 1.20,
  "us-west-2": 1.10,
  "eu-west-1": 1.12,
  "eu-central-1": 1.18,
  "ap-south-1": 1.15
};

export const OS_IMAGES = [
  {
    id: "amazon-linux-2023",
    name: "Amazon Linux 2023 (AL2023)",
    platform: "Linux",
    defaultAmis: {
      "us-east-1": "ami-04b70fa74e45c3917",
      "us-east-2": "ami-05d389e10743b881a",
      "us-west-1": "ami-038b90a07d27e85c7",
      "us-west-2": "ami-03d5c48b0a1d9cad5",
      "ap-south-1": "ami-022d03f649d12a49d"
    }
  },
  {
    id: "ubuntu-24",
    name: "Ubuntu Server 24.04 LTS",
    platform: "Linux",
    defaultAmis: {
      "us-east-1": "ami-04a81a99f5ec58529",
      "us-east-2": "ami-0904037de8501fd90",
      "us-west-1": "ami-053a45df0a698bc08",
      "us-west-2": "ami-0606dd43116f5ed57",
      "ap-south-1": "ami-0f5ee92e2d63afc18"
    }
  },
  {
    id: "windows-2022",
    name: "Windows Server 2022 Base",
    platform: "Windows",
    defaultAmis: {
      "us-east-1": "ami-03c62377d6118544d",
      "us-east-2": "ami-0d65b161df27f8a70",
      "us-west-1": "ami-0b92db2d713c7bc37",
      "us-west-2": "ami-07971b3e150965e64",
      "ap-south-1": "ami-07d0f779774640108"
    }
  },
  {
    id: "rhel-9",
    name: "Red Hat Enterprise Linux 9",
    platform: "RHEL",
    defaultAmis: {
      "us-east-1": "ami-0583d8c7a9c35d7a9",
      "us-east-2": "ami-0f2c00a6e76cfb1ef",
      "us-west-1": "ami-054965c6cd7c6e4c9",
      "us-west-2": "ami-03c004c27a20c3a2f",
      "ap-south-1": "ami-0e1d062fe401e4046"
    }
  },
  {
    id: "suse-15",
    name: "SUSE Linux Enterprise Server 15",
    platform: "SUSE",
    defaultAmis: {
      "us-east-1": "ami-0db2fb6d43522f7b8",
      "us-east-2": "ami-04e4c360b37dc1d7c",
      "us-west-1": "ami-01d89955faad0061e",
      "us-west-2": "ami-09cf8f1b63574c8bc",
      "ap-south-1": "ami-03b879ec352a979dd"
    }
  }
];

export const calculateEC2Cost = (instanceType, volumeSize, region, platform) => {
  const currentInstanceType = instanceType || "t2.micro";
  const currentVolumeSize = volumeSize || 8;
  const currentRegion = region || "us-east-1";
  const currentPlatform = platform || "Linux";

  const matchedType = ALL_INSTANCE_TYPES.find(t => t.value === currentInstanceType);
  const hourlyPrice = matchedType && matchedType.pricing
    ? (matchedType.pricing[currentPlatform] !== null ? matchedType.pricing[currentPlatform] : matchedType.pricing["Linux"])
    : 0.0116;

  const baseCost = (hourlyPrice || 0) * 730;
  const multiplier = REGIONAL_MULTIPLIERS[currentRegion.toLowerCase()] !== undefined
    ? REGIONAL_MULTIPLIERS[currentRegion.toLowerCase()]
    : 1.15;

  const instanceCost = baseCost * multiplier;
  const storageCost = currentVolumeSize * 0.08;
  return parseFloat((instanceCost + storageCost).toFixed(2));
};

