---
layout: ../../layouts/ProjectLayout.astro
title: "Homelab Proxmox & PBS"
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

## Panoramica del Progetto

Progettazione, configurazione e messa in produzione di un'infrastruttura server domestica avanzata basata su **Proxmox VE** e **Proxmox Backup Server**. L'architettura è stata studiata con un focus sulla sicurezza (Firewall **pfSense**, segmentazione di rete, VPN **WireGuard**), sulle performance (**Docker** in container LXC non privilegiati, GPU passthrough) e sull'affidabilità (filesystem **ZFS** e architettura ibrida per lo storage).

## Infrastruttura Hardware e Virtualizzazione

Il cluster si basa su un'architettura a due nodi per separare l'elaborazione dal backup:

* **Hypervisor Primario (Proxmox VE):** Ace Magician AM06PRO equipaggiato con AMD Ryzen 7 5700U (8 core / 16 thread) e 32 GB di RAM DDR4. Il BIOS è configurato per l'efficienza energetica (Sustained PPT a 15W), la gestione termica ottimizzata per il silenzio e il ripristino automatico post-blackout.

* **Nodo di Backup (Proxmox Backup Server):** Mini PC dedicato (BMAX con Intel Celeron N5095 e 8GB di RAM) isolato logicamente, che funge da sistema di **Disaster Recovery** on-premise.

* **Gestione Standardizzata:** L'intera infrastruttura adotta una rigorosa convenzione logica. L'ID assegnato alla VM o al Container LXC determina direttamente l'ultimo ottetto del suo indirizzo IP (es. la VM `121` corrisponde all'IP `10.10.0.21`; il CT `122` corrisponde a `10.10.0.22`). Di pari passo, il nome della risorsa sull'hypervisor corrisponde specularmente all'hostname interno del sistema guest (es. la VM nominata `immich` ha come hostname `immich`; il CT nominato `npm` ha come hostname `npm`), garantendo una mappa mentale dell'infrastruttura coerente e un'amministrazione estremamente intuitiva.

## Architettura Storage (ZFS & LVM)

La gestione dei dati utilizza un approccio ibrido, sfruttando molteplici enclosure hardware connesse via USB 3.0:

* **Storage Interno:** NVMe da 256GB dedicato esclusivamente a **Proxmox** e, per motivi di affidabilità e performance, al disco virtuale di sistema del firewall **pfSense**.

* **Storage per Servizi (`zfs-ssd-os`):** Box esterno MAIWO a 4 slot che ospita un SSD SanDisk Plus da 480GB dedicato ai dischi di sistema delle VM e dei Container LXC.

* **Storage Dati Sensibili (`zfs-hdd-data`):** Nello stesso MAIWO, un pool ZFS in configurazione **Mirror** (RAID 1) su due HDD Toshiba PC P300 da 2TB, utilizzato per lo storage persistente dei servizi (es. **Immich**).

* **Storage Multimediale (`zfs-hdd-media-01` e `02`):** Due pool ZFS distinti, ciascuno formattato in modalità **Stripe** su un singolo HDD Toshiba Surveillance S300 da 4TB. Entrambi i dischi sono alloggiati in un'enclosure hardware CENMATE a 2 slot e dedicati unicamente al catalogo media di **Jellyfin**.

* **Storage di Backup (`zfs-hdd-bckp`):** Enclosure FANTEC hardware RAID a 2 slot connesso al nodo di backup, contenente due HDD Seagate Barracuda (2,5") da 4TB in configurazione **ZFS Mirror**.

## Networking, Sicurezza e Firewalling

La rete è orchestrata da un'istanza virtualizzata di **pfSense** che agisce da perimetro di sicurezza per i servizi:

* **Segmentazione di Rete:** Separazione a livello L2 tra la LAN di casa (`vmbr0`, `192.168.1.0/24`) e la DMZ (`vmbr1`, `10.10.0.0/24`) in cui risiedono i servizi.

* **Firewall Strict Isolation:** Regole top-down rigorose che isolano la DMZ dalla LAN, consentendo l'accesso unicamente tramite reverse proxy. È inoltre implementato **pfBlockerNG** con licenza MaxMind per il filtraggio GeoIP, bloccando il traffico da paesi non autorizzati.

* **Risoluzione DNS Unificata:** **pfSense** agisce da resolver DNS solo per le reti interne isolate (DMZ e client VPN), garantendo la corretta risoluzione locale dei nomi a dominio per i servizi.

* **Accesso Remoto (WireGuard):** L'amministrazione e l'accesso diretto ai servizi avvengono tramite VPN **WireGuard** (rete `10.10.10.0/24`) con una logica di **Split Tunneling** configurata ad-hoc per bypassare i limiti del gateway ISP.

* **Reverse Proxy & Automazione SSL:** L'esposizione sicura su Internet sfrutta un provider Dynamic DNS (**DuckDNS**). Il router di casa (**FRITZ!Box 7590**) aggiorna automaticamente il record DDNS con l'IP pubblico e gestisce il port forwarding (porta 8443 esterna ➔ 443 **pfSense** ➔ 443 **Nginx Proxy Manager**). **NPM** si occupa poi del routing tramite sottodomini (es. `immich.nase03.duckdns.org`) e rinnova in automatico i certificati wildcard **Let's Encrypt**.

## Servizi Deployati e Architettura Applicativa

Tutti i servizi applicativi sono orchestrati tramite `docker-compose`, ma con approcci ottimizzati in base alle necessità del servizio:

* **Architettura Docker-in-LXC:** La maggior parte dei servizi è eseguita all'interno di container **Docker** ospitati su LXC non privilegiati (abilitando `keyctl=1` e `nesting=1`), garantendo prestazioni native e isolamento.

* **Gestione dei Volumi:** È stata implementata una politica di mount point differenziata in base al carico. Servizi "pesanti" come **Immich** e **Jellyfin** possiedono un disco virtuale per l'OS, un secondo disco isolato dedicato all'applicativo e alle dipendenze **Docker** (montato in `/var` per la VM di Immich e in `/var/lib/docker` per il CT di Jellyfin), e mount ZFS dedicati per i dati effettivi (es. `/srv/immich-data` o `/srv/jellyfin-media-01` e `02`). I file `docker-compose.yml` sono standardizzati sotto la directory `/opt/nome-servizio`.

* **Jellyfin (Media Server):** Ospitato in un container LXC, sfrutta la tecnologia di GPU Passthrough per demandare la transcodifica video all'acceleratore integrato del processore AMD, sgravando la CPU. I media risiedono sui due pool **ZFS Stripe** dedicati, esclusi dai backup incrementali ma protetti da copie a freddo.

* **Immich (Gestione Foto/Video):** Per garantire il massimo isolamento, soprattutto per le operazioni di Machine Learning (riconoscimento facciale), è stato deployato all'interno di una Virtual Machine completa basata su architettura Q35.

> **🚧 In fase di implementazione: Osservabilità (Stack PLG)**
> È in fase di implementazione una Virtual Machine dedicata al monitoraggio con **Prometheus** (metriche VM/CT), **cAdvisor** (metriche Docker) e **Grafana** (visualizzazione), con l'aggiunta di **Loki** prevista per la centralizzazione dei log.

* **RustDesk:** Soluzione di desktop remoto self-hosted. Per ragioni di sicurezza, non è esposto al pubblico ma è raggiungibile esclusivamente instaurando la connessione VPN **WireGuard**.

## Strategia di Disaster Recovery

Il ciclo di vita dei dati è gestito in modo automatizzato dal nodo isolato con **Proxmox Backup Server**, assicurando ridondanza tramite schedulazioni di retention precise:

* **Backup Job:** Esecuzione quotidiana (19:30). Vengono inclusi tutti gli OS e i dati critici, escludendo per scelta architetturale i dischi multimediali massivi.
* **Prune Job:** Pulizia dei vecchi snapshot ogni giorno (21:00).
* **Garbage Collection:** Liberazione dello spazio fisico settimanale (Sabato, 13:00).
* **Verification Job:** Verifica dell'integrità dei dati ogni Domenica (13:00), con un controllo approfondito a intervalli di 30 giorni. La telemetria di PBS e PVE e i log di backup sono integrati in un sistema di allarmistica via webhook **Telegram**.