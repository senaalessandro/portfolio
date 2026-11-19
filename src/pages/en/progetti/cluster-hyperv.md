---
layout: ../../../layouts/ProjectLayout.astro
title: "Hyper-V Cluster & DR"
status: "Completato"
techs: 
  - "/logos/win10.png"
  - "/logos/hyperv.png"
---

## Project Overview

Design, implementation, and testing of an educational lab (Proof of Concept) for a High Availability (**HA**) **Microsoft Hyper-V** cluster running via nested virtualization on **Proxmox VE**. This simulated environment replicates a complete architecture based on **Windows Server 2022**, integrating **Active Directory** Domain Services, a centralized **iSCSI SAN**, advanced **SDN** networking, **Failover Clustering** policies (Zero Downtime), and a **Disaster Recovery** infrastructure powered by **Hyper-V Replica**.

## Storage & SAN Architecture

Hosted on the same hardware as the primary **Proxmox** homelab, compute resources are shared while storage has been segmented and specifically provisioned for this lab:

* **Host Storage (ZFS):** The entire lab—including all VM operating system (OS) disks, bulk SAN capacity, and the quorum Witness disk—rests on a single **ZFS** pool (`zfs-ssd-os-02`) backed by a Crucial MX500 SSD.
* **iSCSI SAN & RAID 5 (`SRV-SAN-01`):** Shared cluster storage for the HA setup is served by a dedicated VM acting as an iSCSI Target. Internally, three virtual disks provided by the hypervisor are aggregated into a **RAID 5** storage pool, adding an extra logical layer of fault tolerance and balanced I/O performance before exposing storage to the **Hyper-V** nodes.
* **Multipath I/O (MPIO):** iSCSI path redundancy via **MPIO** was configured on the **Hyper-V** nodes, ensuring operational continuity and load balancing in the event one of the storage VNets drops.
* **Disk Witness (Quorum):** `LUN 0` (1 GB) mapped as a Quorum Witness, acting as a "third voter" to prevent Split-Brain scenarios.
* **Cluster Shared Volume (CSV):** `LUN 1` (50 GB) formatted as a CSV (mounted at `C:\ClusterStorage\Volume1\`). Enables **Hyper-V** nodes to perform simultaneous block-level I/O operations on HA VM VHDX files.

## Advanced Networking (Proxmox SDN)

Network traffic is logically isolated using **Proxmox SDN** (Software-Defined Network), creating a fully confined Simple Zone (`vnetwork`). To maximize storage throughput and **Live Migration** speed, the network is segmented into dedicated VNets configured with **Jumbo Frames** (MTU `9000`):

* **Management (`mgmt`):** `/28` network with Internet routing delegated to **pfSense** (IP `10.10.0.14/28`).
* **Heartbeat (`hb`):** `/30` network dedicated exclusively to cluster heartbeats, preventing latency spikes and false-positive node isolation events.
* **iSCSI (`iscsi1`, `iscsi2`):** Isolated `/29` networks dedicated to SAN storage traffic.
* **Live Migration (`lm1`, `lm2`):** `/30` networks dedicated to live memory transfer of running VMs.

## Logical Architecture & Virtual Machines

The domain (`cluster.local`) consists of 6 primary Virtual Machines, all running **Windows Server 2022**:

* **Domain Controller (`SRV-DC-01`):** Hosts **AD DS** services and the **DNS** zone.
* **Management Server (`SRV-AP-01`):** Centralized control node equipped with **RSAT** and **Windows Admin Center (WAC)** for unified remote node administration.
* **iSCSI SAN (`SRV-SAN-01`):** Manages the local **RAID 5** pool and exposes shared LUNs to the cluster over iSCSI targets.
* **Compute Nodes (`SRV-HV-01`, `SRV-HV-02`):** **Hyper-V** nodes forming the HA cluster. The second node was provisioned by cloning the first and running Sysprep to reset its SID.
* **Disaster Recovery Node (`SRV-HV-DR`):** Standalone domain-joined **Hyper-V** node, independent from the primary cluster's shared storage (CSV/SAN), assigned a dedicated IP on the management VNet (`10.0.10.10/28`).

## Failover Cluster Configuration (`CLUSTER-HV`)

The core of the infrastructure is the logical Microsoft cluster built using the **Failover Clustering** feature:

* **Cluster Validation:** Prior to deployment, the infrastructure underwent the strict Cluster Validation Wizard, passing Microsoft tests across Storage, Network, and System categories to certify environment compliance.
* **Cluster Name Object (CNO):** Provisioned the `CLUSTER-HV` logical computer object inside **Active Directory**, bound to the virtual IP `10.10.0.13/28` on the management network to serve as the centralized management endpoint.
* **Network Orchestration:** Through **Failover Cluster Manager**, cluster networks were classified by priority and role. The Management network was restricted from carrying intra-cluster traffic, whereas Live Migration (`lm1`, `lm2`) and Heartbeat (`hb`) networks were prioritized for internal orchestration and keep-alive exchanges.

## High Availability (HA) & Live Migration

The test infrastructure was validated through demanding stress tests to verify workload mobility and fault tolerance:

* **Live Migration (Zero Downtime):** Executed hot migration of a test VM from Node 1 to Node 2. Leveraging **SMB Multichannel** across the isolated `lm1` and `lm2` networks, VM memory state was transferred with only a single ICMP packet dropped.
* **Hard Crash Simulation:** Forcefully powered off the owning node at the hypervisor level. The cluster automatically cold-booted the VM on the surviving node. Once the failed node recovered, a Failback was executed seamlessly without user interruption.
* **MPIO Resilience:** Simulated an iSCSI network partition by disabling a network adapter, confirming Multipath I/O failover occurred cleanly without CSV data corruption.

## Disaster Recovery Strategy (Hyper-V Replica)

To ensure business continuity in case of total failure of the primary cluster or SAN, a DR architecture was implemented using asynchronous replication to the independent node `SRV-HV-DR`:

* **Replica Broker (`REPLICA-HV`):** Created the "Hyper-V Replica Broker" clustered role in **Failover Cluster Manager** (IP `10.0.10.12/28`) to act as a unified endpoint between the DR node and both primary cluster nodes, coordinating replication to CSV storage (`C:\ClusterStorage\Volume1\replica`).
* **Kerberos Constrained Delegation:** To automate replication direction reversal (Failback) without running into Kerberos permission errors, the **Hyper-V Replica** service was configured in **Active Directory** with mutual trust between `SRV-HV-DR`, the primary cluster nodes (`SRV-HV-01`, `SRV-HV-02`), and the Broker (`REPLICA-HV`).
* **Authentication & RPO:** Replication travels over HTTP (port `80`) using domain-integrated Kerberos authentication, asynchronously transmitting only deltas according to defined Recovery Point Objective (RPO) intervals.
* **Isolated & Planned Failover (Zero Data Loss):** The system was validated both with sandbox test failovers (booting cloned VMs on DR without causing network IP conflicts) and with Planned Failovers, achieving zero data loss and immediately reversing replication from DR back to the primary cluster after recovery.
