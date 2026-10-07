---
layout: ../../layouts/ProjectLayout.astro
title: "Proxmox VE & PBS"
status: "In corso"
techs: 
  - "/logos/proxmox.png"
  - "/logos/pfsense.png"
  - "/logos/wireguard.png"
  - "/logos/npm.png"
  - "/logos/rustdesk.png"
  - "/logos/immich.png"
  - "/logos/jellyfin.png"
  - "/logos/docker.png"
  - "/logos/prometheus.png"
  - "/logos/grafana.png"
  - "/logos/loki.png"
  - "/logos/fritz.png"
  - "/logos/duckdns.png"
---

## Panoramica del Progetto

Progettazione, configurazione e messa in produzione di un'infrastruttura server domestica (Homelab) avanzata basata su **Proxmox VE** e **Proxmox Backup Server**. L'architettura è stata studiata con un focus sulla sicurezza (Firewall pfSense, segmentazione di rete, VPN WireGuard), sulle performance (Docker in container LXC non privilegiati, GPU passthrough) e sull'affidabilità (filesystem ZFS e architettura ibrida per lo storage).

## Infrastruttura Hardware e Virtualizzazione

Il cluster si basa su un'architettura a due nodi per separare l'elaborazione dal backup:

* **Hypervisor Primario (Proxmox VE):** Ace Magician AM06PRO equipaggiato con AMD Ryzen 7 5700U (8 core / 16 thread), 32 GB di RAM DDR4 ottimizzata e NIC Intel 2.5 Gbps. Il BIOS è configurato per l'efficienza energetica (Sustained PPT a 15W), la gestione termica ottimizzata per il silenzio e il ripristino automatico post-blackout.


* **Nodo di Backup (Proxmox Backup Server):** Mini PC dedicato (BMAX con Intel Celeron N5095 e 8GB di RAM) isolato logicamente, che funge da sistema di Disaster Recovery on-premise.


* **Gestione Standardizzata:** L'intera infrastruttura segue una convenzione di naming e indirizzamento rigorosa, in cui l'ID della Macchina Virtuale o del Container corrisponde all'ultimo ottetto dell'IP (es. CT 122 = 10.10.0.22, VM 121 = 10.10.0.21).

## Architettura Storage (ZFS & LVM)

La gestione dei dati utilizza un approccio ibrido, sfruttando molteplici enclosure hardware connesse via USB 3.0:

* **Storage Interno:** NVMe da 256GB dedicato esclusivamente a Proxmox e, per motivi di sicurezza, al disco virtuale di sistema del firewall pfSense.


* **Storage per Servizi (`zfs-ssd-os`):** Box esterno MAIWO a 4 slot che ospita un SSD dedicato ai dischi di sistema delle VM e dei Container.


* **Storage Dati Sensibili (`zfs-hdd-data`):** Nello stesso MAIWO, un pool ZFS in configurazione Mirror (RAID 1) su due dischi Toshiba P300 da 2TB, utilizzato per lo storage persistente dei servizi (es. Immich).


* **Storage Multimediale (`zfs-hdd-media`):** Pool ZFS in modalità Stripe su due HDD da 4TB (enclosure hardware RAID CENMATE) dedicato al catalogo media di Jellyfin.


* **Storage di Backup (`zfs-hdd-bckp`):** Enclosure FANTEC hardware RAID a 2 slot connesso al nodo di backup, contenente due HDD Seagate da 4TB in configurazione ZFS Mirror.



## Networking, Sicurezza e Firewalling

La rete è orchestrata da un'istanza virtualizzata di **pfSense** che agisce da perimetro di sicurezza:

* **Segmentazione di Rete:** Separazione a livello L2 tra la rete di Management (`vmbr0`, 192.168.1.0/24) e la DMZ (`vmbr1`, 10.10.0.0/24) in cui risiedono i servizi.


* **Firewall Strict Isolation:** Regole top-down rigorose che isolano la DMZ dalla LAN, consentendo l'accesso unicamente tramite reverse proxy. È inoltre implementato **pfBlockerNG** con licenza MaxMind per il filtraggio GeoIP, bloccando il traffico da paesi non autorizzati.


* **Risoluzione DNS Unificata:** pfSense agisce da resolver DNS per tutte le reti (LAN, DMZ, VPN), garantendo coerenza sia internamente che esternamente.


* **Accesso Remoto (WireGuard):** L'amministrazione e l'accesso diretto ai servizi avvengono tramite VPN WireGuard (rete 10.10.10.0/24) con una logica di Split Tunneling configurata ad-hoc per bypassare i limiti del gateway ISP.


* **Reverse Proxy & Automazione SSL:** L'esposizione sicura su Internet è gestita dal router ISP (FritzBox) che si occupa dell'aggiornamento del DDNS e del port forwarding (8443 esterne ➔ 443 pfSense ➔ 443 Nginx Proxy Manager), permettendo a **NPM** di gestire il routing tramite sottodomini e di rinnovare automaticamente i certificati wildcard Let's Encrypt.

## Servizi Deployati e Architettura Applicativa

Tutti i servizi applicativi sono orchestrati tramite `docker-compose`, ma con approcci ottimizzati in base alle necessità del servizio:

* **Architettura Docker-in-LXC:** La maggior parte dei servizi è eseguita all'interno di container Docker ospitati su LXC non privilegiati (abilitando `keyctl=1` e `nesting=1`), garantendo prestazioni native e isolamento.
* **Gestione dei Volumi:** È stata implementata una rigorosa politica di mount point separati. Ogni servizio possiede un disco virtuale per l'OS, un disco isolato per le dipendenze (es. `/var/lib/docker`) e mount ZFS dedicati per i dati effettivi (es. `/srv/immich-data`). I file `docker-compose.yml` sono standardizzati sotto la directory `/opt/nome-servizio`.


* **Jellyfin (Media Server):** Ospitato in un container LXC, sfrutta la tecnologia di GPU Passthrough per demandare la transcodifica video all'acceleratore integrato del processore AMD, sgravando la CPU. I media risiedono su dischi meccanici separati ed esclusi dai backup incrementali, ma protetti da copie a freddo.


* **Immich (Gestione Foto/Video):** Per garantire il massimo isolamento, soprattutto per le operazioni di Machine Learning (riconoscimento facciale), è stato deployato all'interno di una Virtual Machine completa basata su architettura Q35.


* **Osservabilità (Stack PLG):** È in fase di implementazione una Virtual Machine dedicata al monitoraggio con Prometheus (metriche VM/CT), cAdvisor (metriche Docker) e Grafana (visualizzazione), con l'aggiunta di Loki prevista per la centralizzazione dei log.


* **RustDesk:** Soluzione di desktop remoto self-hosted. Per ragioni di sicurezza, non è esposto al pubblico ma è raggiungibile esclusivamente instaurando la connessione VPN WireGuard.

## Strategia di Disaster Recovery

Il ciclo di vita dei dati è gestito in modo automatizzato dal nodo isolato con **Proxmox Backup Server**, assicurando ridondanza tramite schedulazioni di retention precise:

* **Backup Job:** Esecuzione quotidiana (19:30).
* **Prune Job:** Pulizia dei vecchi snapshot ogni giorno (21:00).
* **Garbage Collection:** Liberazione dello spazio fisico settimanale (Sabato, 13:00).
* **Verification Job:** Verifica dell'integrità dei dati ogni Domenica (13:00), con un controllo approfondito a intervalli di 30 giorni. La telemetria di PBS e PVE e i log di backup sono integrati in un sistema di allarmistica via webhook Telegram.



---