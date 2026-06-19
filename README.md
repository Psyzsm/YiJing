# Yìjìng OS

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Framework: Next.js](https://img.shields.io/badge/Framework-Next.js_14-black)](https://nextjs.org/)
[![Infrastructure: Docker](https://img.shields.io/badge/Infrastructure-Docker-blue)](https://www.docker.com/)
[![CMS: Ghost](https://img.shields.io/badge/CMS-Ghost-ghost)](https://ghost.org/)

**A containerized web-based desktop environment inspired by operating system interfaces.**

https://github.com/user-attachments/assets/ccf58764-524c-4fdd-bc02-9f961eb77857

**[Live Demonstration](https://demo.psyzsm.com) | Architecture Documentation (W.I.P)**

Yìjìng OS explores an alternative navigation paradigm where applications, documents, and routes are represented as a living topology graph rather than traditional menus. It serves both as a single-user portfolio platform and an experiment in web-native desktop environments.

## Why I Built This

Yìjìng OS started as a personal experiment. I wanted a self-hostable web desktop that could function as both a portfolio and a knowledge environment, but I couldn't find an existing project that combined those ideas in a way I wanted to deploy myself. So with that, I began building one from scratch. It started as a personal tool that turned into an exploration of graph-based navigation, self-hosted infrastructure, and web-native desktop environments, eventually becoming an open-source project.

## Core Features

* **Automatic Theme Extraction:** The system automatically extracts color palettes from your uploaded background wallpaper and generates dynamic Tailwind CSS variables to re-theme the entire environment at build time.
* **Graph-Based Navigation:** A 60FPS physics-based force-directed graph built on D3.js, replacing standard UI navigation with an interactive routing layer.
* **Built-in Ghost CMS:** A pre-configured Docker pipeline that spins up an isolated Ghost CMS instance (using SQLite) and pipes your writing directly into the desktop via a REST API.
* **Spam-Resistant Contact Form:** Protected by Altcha proof-of-work challenges to mitigate automated scraping and recruiter spam without relying on third-party tracking or CAPTCHA puzzles.

## Gallery

| Desktop Environment | Topology Router |
| :---: | :---: |
| ![Desktop Overview](https://blog.psyzsm.com/content/images/size/w1600/2026/06/Screenshot-2026-06-15-150616.png) | ![Topology Router](https://blog.psyzsm.com/content/images/size/w1600/2026/06/Screenshot-2026-06-15-150535.png) |
| **Mobile Mode** | **Ghost CMS Integration** |
| ![Mobile Mode](https://blog.psyzsm.com/content/images/2026/06/Screenshot-2026-06-15-150643.png) | ![Ghost Integration](https://blog.psyzsm.com/content/images/size/w1600/2026/06/Screenshot-2026-06-15-150744.png) |

### Infrastructure Topology

```text
Internet
   │
   ▼
[ Caddy Reverse Proxy ] ──(Automated Let's Encrypt SSL)
   │
   ├──► [ Next.js Container ] (Port 3000)
   │      ├── Desktop Window Manager
   │      ├── D3 Force-Directed Router
   │      └── Altcha PoW Vault
   │
   └──► [ Ghost CMS Container ] (Port 2368)
          └── SQLite Database (Persistent Volume)
```

## System Prerequisites

If deploying to a live server, ensure your environment meets the following specifications:

-   **OS:** Ubuntu / Debian (recommended)
    
-   **Software:** Docker Engine v20.10+ & Docker Compose v2+
    
-   **Hardware:** 2GB RAM Minimum.
    
-   **Network:** Ports `80` and `443` must be open on your provider's firewall.
    

> **CRITICAL FOR 1GB RAM SERVERS (Oracle Micro / DigitalOcean Basic):**
> 
> Next.js requires significant memory to compile static assets. If you are on a 1GB server, the Docker build will trigger an Out-of-Memory (Exit 137) crash. You **MUST** allocate a swap file before running the setup script:
> ```
> sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
> ```
>
> Besure the run this line to make this swap file permanent across reboots:
> ```
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```

## Automated Deployment (Live Server)

Yìjìng includes an interactive deployment script for bare-metal VPS provisioning. Run this directly on your server:
```
mkdir -p yijing && cd yijing && curl -sL [https://api.github.com/repos/Psyzsm/YiJing/tarball/main](https://api.github.com/repos/Psyzsm/YiJing/tarball/main) | tar -xz --strip-components=1 && chmod +x *.sh && ./setup.sh
```

_The setup routine will configure Caddy, generate cryptographic HMAC parameters, construct the Docker Compose manifest, and map persistent volumes._

## Configuration & Personalization
Personal data, social links, and application lists are centralized. To personalize your portfolio, copy the template and edit it:

```
cp yijing.config.example.ts yijing.config.ts
nano yijing.config.ts
```
_The core site.ts auto-imports from this configuration file, meaning you never have to manually edit the React components to personalize your portfolio._

## Local Development (Non-Docker)
If you wish to modify the React components or test themes locally without spinning up the entire container stack:

```
# Clone the repository
git clone [https://github.com/Psyzsm/YiJing.git](https://github.com/Psyzsm/YiJing.git)
cd YiJing

# Install dependencies (pnpm recommended)
pnpm install

# Run the development server
pnpm dev
```
_(Note: Local development defaults to mock data if the Ghost CMS environment variables are missing from your .env.local file)._

## Environment Variables Reference

The automated `setup.sh` script generates these for you, but if you are configuring manually, your `.env.local` requires the following:
| Variable | Required | Description | Example |
|--|--|--|--|
| `GHOST_API_URL` | Yes | Internal/External URL for the Ghost instance. | `http://yijing-ghost:2368` |
| `GHOST_CONTENT_API_KEY` | Yes | Key generated inside Ghost Admin integrations. | `2b919...bf62` |
| `ALTCHA_HMAC_KEY` | Yes | High-entropy string used to sign PoW challenges. | `auto-generated` |
| `SMTP_HOST` | No | Mail server for the Contact Vault. | ``smtp.gmail.com`` |
| `SMTP_PORT` | No | Mail server port. | `587` |
| `SMTP_USER` | No | Email authentication user. | `your_email@gmail.com` |
| `SMTP_PASS` | No | Email app password (Do not use standard password). | `abcd1234efgh5678` |

## Security & Known Limitations

-   **Single-Tenant Design:** Yìjìng OS is designed primarily as an isolated, single-user portfolio. It is not intended for multi-tenant deployments.
    
-   **Security Responsibility:** While the Contact Vault utilizes Proof-of-Work to mitigate spam, ensuring firewall integrity, keeping Docker updated, and securing the Ghost Admin credentials remain the responsibility of the server administrator.
    
-   **Dynamic Palette Extraction:** Color palettes are extracted at build-time. Changing the background image requires running `./update.sh` to re-extract colors and rebuild the CSS.
    
-   **Mobile Experience:** Absolute window positioning does not translate to mobile devices. The portfolio utilizes a dynamic listener instead to reshape the UI into a fullscreen mobile app layout on smaller viewports.
    

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
