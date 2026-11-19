---
layout: ../../../layouts/ProjectLayout.astro
title: "Active Directory & HA"
status: "Completato"
techs: 
  - "/logos/win10.png"
  - "/logos/active-directory.png"
  - "/logos/dns.png"
---

## Project Overview

Design, implementation, and validation of a complete **Microsoft Windows Server** domain infrastructure. The lab was built to simulate a high-availability Enterprise environment while tackling a demanding *capacity planning* challenge, as the entire infrastructure is virtualized and tuned (using dynamic disks and carefully balanced vCPU/RAM allocations) on a single physical host constrained to 16GB of memory.

## Virtualization & Network Security (Hyper-V & pfSense)

The environment runs on the **Hyper-V** hypervisor and is logically segmented to mirror a real corporate architecture:

* **Network Isolation:** Two virtual switches were created: an external switch (bridged to the physical NIC for Internet access) and a private switch for the internal corporate LAN.
* **Gateway & Firewall:** The network perimeter is protected by a **pfSense** virtual machine (`FW-PFSENSE`). Equipped with dual interfaces, it acts as router and default gateway (`192.168.66.254`) for the entire `192.168.66.0/24` private subnet housing all domain servers and clients.
* **Snapshot Management (Checkpoints):** To ensure stress tests remain reproducible and Disaster Recovery drills can be executed safely, the full VM lifecycle was protected using native **Hyper-V Checkpoints**, enabling instant rollback to pre-disaster states.

## Active Directory & DNS Resolution

The logical core of the infrastructure centers on the `lab.local` domain, served by two Domain Controllers configured for authentication and name resolution redundancy, as well as cross-version OS interoperability testing:

* **Consistency & Naming (Mixed Environment):** A strict naming convention was enforced (guest hostnames exactly match VM names). **AD DS** and **DNS** roles were deployed first on `SRV-DC-01` (**Windows Server 2019**, `192.168.66.1`) and subsequently on `SRV-DC-02` (upgraded to **Windows Server 2022**, `192.168.66.2`), successfully integrating both into the same Active Directory forest.

* **Cross-DNS Configuration:** To maximize resilience and prevent "replication island" issues, DNS resolution was cross-configured: DC1's primary DNS server points to DC2, and vice versa, while each uses itself (`127.0.0.1`) as its secondary DNS server.
* **External Resolution:** For queries outside the local domain, DNS Forwarders were configured to public resolvers (e.g., `8.8.8.8`, `1.1.1.1`), avoiding conditional forwarders.

## High Availability: DHCP Failover

IP address allocation for client endpoints is delivered in high availability across both Domain Controllers:

* **Scope & Reservations:** The `192.168.66.0/24` scope was configured while strategically excluding the first 20 IPs (reserved for infrastructure) and the last 5. Clients (e.g., `DSK-W10-01`) receive full network parameters including Gateway and DNS suffixes, alongside static MAC-based *Reservations* for key machines.
* **Load Balancing:** Service availability is maintained via a **DHCP Failover** relationship named `FAILOVER-DC1&2`, operating in 50% Load Balancing mode so that if one node goes down, its partner seamlessly takes over IP lease assignment in compliance with MCLT (Maximum Client Lead Time) settings.

## File Server, Deduplication & GPO Automation

Beyond core identity services, centralized file storage and user-side automation were implemented:

* **Storage Management (`SRV-FS-01`):** A dedicated File Server (`192.168.66.5`) was deployed with **Data Deduplication** enabled, maximizing physical disk efficiency on the host.
* **Permissions & Shares:** **SMB** network shares were provisioned using layered Share Permissions alongside tighter **NTFS** security permissions, validated against dedicated OUs (Organizational Units) and test security groups in Active Directory.
* **Group Policy (GPO):** To streamline the end-user experience, a **GPO** was created and linked to automatically map SMB network drives (Drive Mapping) for all domain users upon sign-in.

## Disaster Recovery & FSMO Roles Management

The architecture underwent rigorous failure simulations to validate Business Continuity procedures:

* **DHCP Failover Test:** After forcefully shutting down `SRV-DC-02`, client machines maintained network connectivity and `SRV-DC-01` seamlessly took over lease management upon renewal.
* **FSMO Role Seize (PowerShell):** Simulating the irreversible loss of the Primary Domain Controller (`SRV-DC-01`), all 5 **FSMO** (Flexible Single Master Operations) roles were seized onto `SRV-DC-02` via **PowerShell** CLI. Successful ownership transfer of all Master roles (RID, PDC Emulator, Infrastructure, Schema, Domain Naming) was verified with `netdom query fsmo`, confirming survival of the `lab.local` forest prior to rolling back via Checkpoint.
