---
layout: ../../../layouts/ProjectLayout.astro
title: "Proxmox & PBS Homelab"
status: "In corso"
techs: 
  - "/logos/proxmox.png"
  - "/logos/pfsense.png"
  - "/logos/wireguard.png"
  - "/logos/docker.png"
  - "/logos/npm.png"
  - "/logos/rustdesk.png"
  - "/logos/immich.png"
  - "/logos/jellyfin.png"
  - "/logos/prometheus.png"
  - "/logos/grafana.png"
  - "/logos/loki.png"
  - "/logos/fritz.png"
  - "/logos/duckdns.png"
---

## Project Overview

Design, configuration, and production deployment of an advanced home server infrastructure based on **Proxmox VE** and **Proxmox Backup Server**. The architecture was engineered with a strong focus on security (**pfSense** firewall, network segmentation, **WireGuard** VPN), performance (**Docker** inside unprivileged LXC containers, GPU passthrough), and reliability (**ZFS** filesystem and hybrid storage architecture).

## Hardware & Virtualization Infrastructure

The cluster is built on a two-node architecture to separate compute workloads from backup operations:

* **Primary Hypervisor (Proxmox VE):** Ace Magician AM06PRO equipped with an AMD Ryzen 7 5700U (8 cores / 16 threads) and 32 GB of DDR4 RAM.

* **Backup Node (Proxmox Backup Server):** Logically isolated BMAX B3 Pro (Intel Celeron N5095 and 8GB of RAM), acting as an on-premise **Disaster Recovery** appliance.

* **Standardized Management:** The entire infrastructure follows a strict logical convention. The ID assigned to a VM or LXC Container directly determines the last octet of its IP address (e.g., VM `121` maps to IP `10.10.0.21`; CT `122` maps to `10.10.0.22`). Alongside this, the resource name on the hypervisor mirrors the internal guest hostname (e.g., the VM named `immich` has `immich` as its hostname; the CT named `npm` has `npm` as its hostname), ensuring a consistent mental map of the infrastructure and highly intuitive administration.

## Storage Architecture (ZFS & LVM)

Data management relies on a hybrid approach utilizing multiple hardware enclosures connected via USB 3.0:

* **Internal Storage:** 256GB NVMe drive dedicated exclusively to **Proxmox** and, for reliability and performance reasons, to the virtual system disk of the **pfSense** firewall.

* **OS & Services Storage (`zfs-ssd-os`):** External 4-bay MAIWO enclosure housing a 480GB SanDisk Plus SSD dedicated to VM and LXC Container system disks.

* **Sensitive Data Storage (`zfs-hdd-data`):** Inside the same MAIWO enclosure, a ZFS pool configured in **Mirror** (RAID 1) across two 2TB Toshiba PC P300 HDDs, used for persistent service storage (e.g., **Immich**).

* **Media Storage (`zfs-hdd-media-01` and `02`):** Two distinct ZFS pools, each formatted in **Stripe** mode on a single 4TB Toshiba Surveillance S300 HDD. Both drives are housed in a 2-bay CENMATE hardware enclosure and dedicated exclusively to the **Jellyfin** media catalog.

* **Backup Storage (`zfs-hdd-bckp`):** 2-bay FANTEC hardware RAID enclosure connected to the backup node, containing two 4TB Seagate Barracuda (2.5") HDDs configured in a **ZFS Mirror**.

## Networking, Security & Firewalling

Network traffic is orchestrated by a virtualized **pfSense** instance acting as the security perimeter for all services:

* **Network Segmentation:** Layer 2 separation between the home LAN (`vmbr0`, `192.168.1.0/24`) and the DMZ (`vmbr1`, `10.10.0.0/24`) where services reside.

* **Strict Firewall Isolation:** Rigorous top-down rules isolating the DMZ from the LAN, allowing access solely through the reverse proxy. **pfBlockerNG** with a MaxMind license is also deployed for GeoIP filtering, blocking traffic from unauthorized countries.

* **Unified DNS Resolution:** **pfSense** acts as the DNS resolver exclusively for isolated internal networks (DMZ and VPN clients), ensuring proper local domain name resolution for services.

* **Remote Access (WireGuard):** Administration and direct service access occur via **WireGuard** VPN (subnet `10.10.10.0/24`) using a custom **Split Tunneling** policy designed to bypass ISP gateway limitations.

* **Reverse Proxy & SSL Automation:** Secure Internet exposure relies on a Dynamic DNS provider (**DuckDNS**). The home router (**FRITZ!Box 7590**) automatically updates the DDNS record with the public IP and handles port forwarding (external port 8443 ➔ 443 **pfSense** ➔ 443 **Nginx Proxy Manager**). **NPM** then routes requests via subdomains (e.g., `immich.nase03.duckdns.org`) and automatically renews wildcard **Let's Encrypt** certificates.

## Deployed Services & Application Architecture

All application services are orchestrated via `docker-compose`, using approaches tailored to each workload's requirements:

* **Docker-in-LXC Architecture:** Most services run inside **Docker** containers hosted on unprivileged LXC containers (with `keyctl=1` and `nesting=1` enabled), delivering near-native performance and strong isolation.

* **Volume Management:** A tiered mount-point policy was implemented based on workload intensity. Heavyweight services such as **Immich** and **Jellyfin** use one virtual disk for the OS, a second isolated disk dedicated to the application and **Docker** dependencies (mounted at `/var` for the Immich VM and `/var/lib/docker` for the Jellyfin CT), and dedicated ZFS bind mounts for actual data (e.g., `/srv/immich-data` or `/srv/jellyfin-media-01` and `02`). All `docker-compose.yml` files are standardized under `/opt/service-name`.

* **Jellyfin (Media Server):** Hosted inside an LXC container, leveraging GPU Passthrough to offload video transcoding to the integrated AMD processor accelerator, keeping CPU usage low. Media libraries reside on the two dedicated **ZFS Stripe** pools, excluded from incremental backups but protected via cold backups.

* **Immich (Photo/Video Management):** To guarantee maximum isolation—especially during Machine Learning workloads (facial recognition)—it was deployed inside a full Virtual Machine built on the Q35 machine architecture.

> **🚧 In Progress: Observability (PLG Stack)**
> A dedicated monitoring Virtual Machine is currently being deployed with **Prometheus** (VM/CT metrics), **cAdvisor** (Docker metrics), and **Grafana** (visualization), with **Loki** planned next for centralized log aggregation.

* **RustDesk:** Self-hosted remote desktop solution. For security reasons, it is not exposed publicly and can only be reached after establishing a **WireGuard** VPN connection.

## Disaster Recovery Strategy

The data lifecycle is automatically managed by the isolated **Proxmox Backup Server** node, ensuring redundancy through precise retention schedules:

* **Backup Job:** Runs daily (19:30). Includes all OS disks and critical data, deliberately excluding massive multimedia pools by architectural design.
* **Prune Job:** Cleans up old snapshots daily (21:00).
* **Garbage Collection:** Reclaims physical disk space weekly (Saturday, 13:00).
* **Verification Job:** Verifies data integrity every Sunday (13:00), with a deep re-verification interval of 30 days. Telemetry from PBS and PVE along with backup logs are integrated into an alerting system via **Telegram** webhook.
