---
layout: ../../layouts/ProjectLayout.astro
title: "Cluster Hyper-V & DR"
status: "Completato"
techs: 
  - "/logos/win10.png"
  - "/logos/hyperv.png"
---

## Panoramica del Progetto

Progettazione, implementazione e test di un laboratorio didattico (Proof of Concept) per un cluster **Microsoft Hyper-V** in alta affidabilità (**HA**) nidificato (nested virtualization) su **Proxmox VE**. Questo ambiente simulato riproduce un'architettura completa basata su **Windows Server 2022**, integrando servizi di dominio **Active Directory**, una **SAN iSCSI** centralizzata, networking **SDN** avanzato, policy di **Failover Clustering** (Zero Downtime) e un'infrastruttura di **Disaster Recovery** basata su **Hyper-V Replica**.

## Architettura Storage e SAN

Ospitato sul medesimo hardware dell'homelab **Proxmox** principale, le risorse di calcolo sono condivise, ma lo storage è stato segmentato e configurato appositamente per questo laboratorio:

* **Storage Host (ZFS):** L'intero laboratorio — inclusi i dischi di sistema (OS) di tutte le VM, lo storage massivo per la SAN e il disco Witness per il quorum — poggia su un unico pool **ZFS** (`zfs-ssd-os-02`) ospitato su un SSD Crucial MX500.
* **SAN iSCSI e RAID 5 (`SRV-SAN-01`):** Lo storage condiviso del cluster HA è gestito da una VM dedicata che funge da Target iSCSI. Al suo interno, i tre dischi virtuali forniti dall'hypervisor sono stati aggregati in un pool di archiviazione in **RAID 5**, garantendo un ulteriore livello logico di tolleranza ai guasti e un bilanciamento delle prestazioni ottimizzato prima dell'esposizione dei dati ai nodi **Hyper-V**.
* **Multipath I/O (MPIO):** È stata implementata sui nodi **Hyper-V** la ridondanza dei percorsi iSCSI tramite **MPIO**, assicurando la continuità operativa e il bilanciamento del carico in caso di caduta di una delle VNet di storage.
* **Disk Witness (Quorum):** `LUN 0` (1 GB) mappata come Testimone di Quorum, agendo da "terzo elettore" per prevenire scenari di Split-Brain.
* **Cluster Shared Volume (CSV):** `LUN 1` (50 GB) convertita in CSV (montata in `C:\ClusterStorage\Volume1\`). Consente ai nodi **Hyper-V** di eseguire operazioni di I/O a livello di blocco simultaneamente sui file VHDX delle VM ad alta affidabilità.

## Networking Avanzato (Proxmox SDN)

Il traffico di rete è isolato logicamente tramite la funzionalità **SDN** (Software-Defined Network) di **Proxmox**, creando una Zone Simple (`vnetwork`) totalmente confinata. Per massimizzare le performance di storage e **Live Migration**, la rete è stata segmentata in VNet dedicate con **Jumbo Frames** (MTU `9000`):

* **Management (`mgmt`):** Rete `/28` con routing verso Internet delegato a **pfSense** (IP `10.10.0.14/28`).
* **Heartbeat (`hb`):** Rete `/30` dedicata esclusivamente ai battiti cardiaci del cluster, per prevenire latenze e falsi positivi di isolamento nodi.
* **iSCSI (`iscsi1`, `iscsi2`):** Reti `/29` isolate per il traffico storage verso la SAN.
* **Live Migration (`lm1`, `lm2`):** Reti `/30` dedicate al trasferimento a caldo della memoria delle VM.

## Architettura Logica e Macchine Virtuali

Il dominio (`cluster.local`) si articola su 6 Macchine Virtuali principali, tutte equipaggiate con **Windows Server 2022**:

* **Domain Controller (`SRV-DC-01`):** Gestisce i servizi **AD DS** e la zona **DNS**.
* **Management Server (`SRV-AP-01`):** Punto di controllo centralizzato dotato di **RSAT** e **Windows Admin Center (WAC)** per l'amministrazione remota unificata dei nodi.
* **SAN iSCSI (`SRV-SAN-01`):** Gestisce il pool **RAID 5** locale ed espone le LUN condivise al cluster tramite target iSCSI.
* **Nodi di Calcolo (`SRV-HV-01`, `SRV-HV-02`):** Nodi **Hyper-V** del cluster HA. Il secondo nodo è stato generato clonando il primo ed eseguendo Sysprep per il reset del SID.
* **Nodo Disaster Recovery (`SRV-HV-DR`):** Nodo **Hyper-V** standalone inserito a dominio, indipendente dallo storage condiviso (CSV/SAN) del cluster primario, con IP dedicato sulla VNet management (`10.0.10.10/28`).

## Configurazione del Failover Cluster (`CLUSTER-HV`)

Il cuore dell'infrastruttura è l'implementazione logica del cluster Microsoft tramite la funzionalità **Failover Clustering**:

* **Cluster Validation:** Prima del deployment, l'infrastruttura è stata sottoposta al rigoroso Cluster Validation Wizard, superando con successo i test Microsoft su Storage, Network e System, certificando la conformità dell'ambiente.
* **Cluster Name Object (CNO):** Creazione dell'oggetto logico `CLUSTER-HV` all'interno di **Active Directory**, associato all'IP virtuale `10.10.0.13/28` sulla rete di management. Questo agisce come punto di contatto centralizzato.
* **Orchestrazione Reti:** Tramite il **Failover Cluster Manager**, le reti clusterizzate sono state categorizzate per priorità e ruolo. La rete Management è stata inibita al traffico intra-cluster, mentre le reti Live Migration (`lm1`, `lm2`) e Heartbeat (`hb`) sono state impostate come preferenziali per l'orchestrazione interna e lo scambio di keep-alive.

## Alta Affidabilità (HA) e Live Migration

L'infrastruttura di test è stata validata con rigorosi scenari di stress per certificare la mobilità dei carichi e la tolleranza ai guasti:

* **Live Migration (Zero Downtime):** Eseguito lo spostamento a caldo di una VM di test dal Nodo 1 al Nodo 2. Sfruttando **SMB Multichannel** sulle reti isolate `lm1` e `lm2`, lo stato della RAM è stato trasferito con la perdita di un solo pacchetto ICMP.
* **Simulazione Hard Crash:** Arrestato brutalmente a livello hypervisor il nodo proprietario. Il cluster ha riavviato automaticamente la VM a freddo sul nodo superstite. Al ripristino, è stato eseguito un Failback invisibile all'utente.
* **Resilienza MPIO:** Simulato il partizionamento di una rete iSCSI disabilitando un'interfaccia di rete, certificando l'intervento del Multi-Pathing senza corruzione dei dati sul volume CSV.

## Strategia di Disaster Recovery (Hyper-V Replica)

Per garantire la business continuity in caso di perdita totale del cluster primario o della SAN, è stata implementata un'architettura di DR basata sulla replica asincrona verso il nodo indipendente `SRV-HV-DR`:

* **Replica Broker (`REPLICA-HV`):** Creato il ruolo "Gestore di replica Hyper-V" tramite **Failover Cluster Manager** (IP `10.0.10.12/28`) per fungere da punto di contatto unificato tra il nodo DR e i due nodi del cluster primario, coordinando la replica verso lo storage CSV (`C:\ClusterStorage\Volume1\replica`).
* **Delega Vincolata Kerberos (Constrained Delegation):** Per automatizzare l'inversione della rotta di replica (Failback) senza incorrere in errori di permessi di Kerberos, il servizio **Hyper-V Replica** è stato configurato in **Active Directory** con trust reciproci tra `SRV-HV-DR`, i nodi del cluster primario (`SRV-HV-01`, `SRV-HV-02`) e il Broker (`REPLICA-HV`).
* **Autenticazione e RPO:** La replica viaggia su HTTP (porta `80`) sfruttando l'autenticazione Kerberos integrata nel dominio, trasmettendo asincronamente solo i delta in base a Recovery Point Objective (RPO) prefissati.
* **Failover Isolato e Pianificato (Zero Data Loss):** Il sistema è stato collaudato sia con simulazioni sandbox (creazione di VM clonate e accese nel DR per test senza generare conflitti IP in rete) sia con Failover Pianificati, azzerando la perdita di dati e invertendo istantaneamente la rotta di replica dal DR al cluster primario al rientro dal disservizio.
