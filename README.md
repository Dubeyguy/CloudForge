# ⚡ CloudForge

> **Visual Infrastructure as Code (IaC) Studio**  
> Design AWS architectures visually on an interactive canvas and automatically synthesize, plan, and deploy production-ready Terraform infrastructure.

---

> [!WARNING]
> **Work in Progress (WIP)**: CloudForge is currently under active development and is **not a final product**. Features, schemas, and APIs may change. Use caution before deploying to production cloud environments.

---

## 📖 Overview

**CloudForge** bridges the gap between visual system architecture diagrams and actual cloud provisioning. Instead of writing verbose and error-prone Terraform configurations by hand, CloudForge allows engineers and architects to:
- Drag and drop AWS cloud components onto an interactive graph canvas.
- Configure resource properties (regions, instance sizes, storage policies, security rules, IAM permissions).
- Automatically compile the visual graph into standard **Terraform / CDKTF** stacks.
- Execute `plan`, `apply`, and `destroy` operations directly from the UI with real-time streaming terminal logs.
- Estimate infrastructure costs live with the integrated EC2 pricing engine.

---

## ✨ Features

- 🎨 **Interactive Node-Based Canvas**: Built with `@xyflow/react` for smooth zooming, panning, connecting, and node manipulation.
- 🏗️ **Automated IaC Synthesis**: Translates visual topology into valid [CDKTF](https://developer.hashicorp.com/terraform/cdktf) (Cloud Development Kit for Terraform) and HCL code.
- 🚀 **One-Click Deployments**: Run Terraform plans, applications, and teardowns directly with live output.
- 💰 **Real-Time Cost Estimation**: Instant pricing feedback for EC2 compute configurations.
- 📁 **Project Dashboard & Storage**: Manage multiple architectures, save locally, and reload previous sessions.
- 🌗 **Modern UI / Themes**: Responsive dark, light, and custom themes with customizable canvas settings.

---

## 🧱 Supported AWS Resources (Expanding)

- **Compute**: Amazon EC2 Instances, AMI selection, storage sizing, Security Group attachments.
- **Storage**: Amazon S3 Buckets, Public Access Blocks, Versioning, S3 Object management.
- **Security & IAM**: IAM Users, Groups, Roles, Policies, Policy Attachments, and Instance Profiles.
- **Networking & Firewalls**: Security Groups with dynamic ingress/egress rule configuration.

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Canvas Engine**: `@xyflow/react` (React Flow)
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js & Express with TypeScript (`ts-node-dev`)
- **IaC Engine**: HashiCorp CDKTF & Terraform CLI
- **AWS Provider**: `@gen/providers/aws`

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.9` or higher
- **Terraform CLI**: Installed and available in PATH (or local binary in backend)
- **AWS Credentials**: Configured via AWS CLI (`~/.aws/credentials`) or environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)

---

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Dubeyguy/CloudForge.git
   cd CloudForge
   ```

2. **Setup Frontend:**
   ```bash
   npm install
   npm run dev
   ```
   *Frontend will run at: `http://localhost:5173`*

3. **Setup Backend:**
   ```bash
   cd cloudforge-backend
   npm install
   npm run dev
   ```
   *Backend server will run at: `http://localhost:3001`*

---

## 🗺️ Roadmap

- [ ] Support for VPCs, Subnets, and Route Tables
- [ ] Multi-cloud provider support (GCP, Azure)
- [ ] Bidirectional import: Parse existing Terraform `.tf` files into visual nodes
- [ ] Export to raw HCL/Terraform zip bundles
- [ ] Team collaboration & cloud synchronization

---

## 📄 License

This project is licensed under the [Mozilla Public License 2.0 (MPL-2.0)](./cloudforge-backend/LICENSE.txt).
