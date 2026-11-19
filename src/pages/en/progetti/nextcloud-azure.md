---
layout: ../../../layouts/ProjectLayout.astro
title: "Nextcloud on Azure"
status: "Completato"
techs: 
  - "/logos/azure.png"
  - "/logos/azure-vm.png"
  - "/logos/azure-vnet.png"
  - "/logos/nextcloud.png"
  - "/logos/postgresql.png"
  - "/logos/docker.png"
  - "/logos/npm.png"
  - "/logos/apache.png"
  - "/logos/php.png"
  - "/logos/redis.png"
---

## Project Overview

Design and production deployment of a Cloud environment for hosting **Nextcloud**, structured on a decoupled architecture (Compute, Database, Storage) to maximize scalability. The project integrates perimeter security via Reverse Proxy alongside advanced performance optimization.

## Cloud Infrastructure (Microsoft Azure)

The architecture combines IaaS and PaaS services to separate application state from raw compute, providing greater operational flexibility:

* **Compute & Networking (IaaS):** The application core runs on a **Debian 13** Virtual Machine provisioned in the West Europe region (private IP `10.1.10.4` and public IP bound to a **DuckDNS** record). This instance hosts the Web Server, the **PHP** engine, and the **Docker** container dedicated to the Reverse Proxy. Network security is enforced through an Azure **Network Security Group (NSG)** paired with the local **UFW** firewall, configured in tandem to expose only strictly required ports (`22`, `80`, `443`, `81`) while allowing internal traffic to the application on port `8080/tcp`.
* **Database (PaaS):** The relational backend is powered by **Azure Database for PostgreSQL**, hosted in the North Europe region (`pgsql-nc-neu.postgres.database.azure.com`). To ensure secure, low-latency communication with the primary VM while bypassing the public Internet, both regions are linked via **VNet Peering**.
* **High-Availability Storage:** User data is stored on a 500 GB **Azure File Share** with **GZRS** (Geo-Zone-Redundant Storage) redundancy, providing synchronous replication across three availability zones plus asynchronous replication to a secondary region for maximum disaster protection. The share is natively mounted on the OS over **SMB** at `/mnt/ncdata/`.

## Backend Configuration (Web Server & PHP)

The application tier was custom-tuned to operate efficiently behind a reverse proxy and handle intensive workloads:

* **Apache Web Server:** To prevent port conflicts with the proxy, **Apache** was configured to listen strictly on the internal port (`Listen 8080` directive in `/etc/apache2/ports.conf`). Using `AllowOverride All` on `/var/www/html/`, **Nextcloud** can autonomously handle advanced routing and rewrites required for services like CardDAV and CalDAV.
* **PHP Engine (8.4 NTS):** The runtime was enhanced with `php-apcu`, `php-redis`, and `php-imagick` extensions. Customizations in `php.ini` raise the memory limit to `512M`, disable output buffering (as recommended by Nextcloud best practices), and enable **OPcache** to significantly accelerate script execution.

## Nextcloud Architecture (App & Caching)

The **Nextcloud** instance was isolated and tuned to minimize bottlenecks and offload pressure from the remote database:

* **Caching & File Locking:** To offset cross-region latency to **PostgreSQL**, fast cache lookups and file locks are served directly from RAM on the West Europe VM. Local caching uses **APCu**, while Transactional File Locking is handled by a local **Redis** daemon listening on `127.0.0.1:6379`.
* **System Parameters:** `config.php` was tailored by setting the proper `datadirectory` pointing to network storage, enforcing HTTPS URL generation (`overwriteprotocol => https`), and scheduling automated background maintenance and heavy cron jobs at 02:00 UTC via the `maintenance_window_start` parameter.

## Perimeter Security (Nginx Proxy Manager)

All incoming Internet traffic is intercepted, TLS-terminated, and filtered by **Nginx Proxy Manager (NPM)** before reaching internal workloads.

* **Docker Isolation:** The proxy runs via **Docker CE** on an isolated bridge network. To avoid **SQLite** database corruption and SSL certificate permission issues, persistent volumes (`/srv/npm/`) are stored on the VM's local managed disk rather than on the **SMB** share.
* **Reverse Proxy & SSL:** NPM handles requests targeting the dynamic domain managed by **DuckDNS** and forwards traffic internally to `10.1.10.4:8080`. It enforces enterprise-grade transport security by redirecting all traffic to HTTPS, enabling **HTTP/2** and **Websockets**, and automating **Let's Encrypt** certificate issuance and renewal via HTTP-01 challenges.
