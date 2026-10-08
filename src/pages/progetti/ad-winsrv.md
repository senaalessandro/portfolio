---
layout: ../../layouts/ProjectLayout.astro
title: "Infrastruttura Windows Server"
status: "Completato"
techs: 
  - "/logos/win10.png"
  - "/logos/active-directory.png"
  - "/logos/dns.png"
---
## Panoramica del Progetto

Progettazione, implementazione e collaudo di un'infrastruttura di dominio **Microsoft Windows Server** completa. Il laboratorio è stato strutturato per simulare un ambiente Enterprise in alta affidabilità, affrontando al contempo una rigorosa sfida di *capacity planning*, essendo l'intera infrastruttura virtualizzata e ottimizzata (tramite dischi dinamici e bilanciamento puntuale di vCPU/RAM) su un singolo host fisico limitato a 16GB di memoria.

## Virtualizzazione e Sicurezza di Rete (Hyper-V & pfSense)

L'ambiente è ospitato su hypervisor **Hyper-V** ed è stato segmentato logicamente per replicare una reale architettura aziendale:

* **Isolamento di Rete:** Sono stati creati due virtual switch: uno esterno (mappato sulla scheda di rete fisica per l'accesso a Internet) e uno privato per la LAN interna aziendale.
* **Gateway e Firewall:** Il perimetro della rete è difeso da una macchina virtuale **pfSense** (`FW-PFSENSE`). Dotata di una doppia interfaccia, agisce da router e default gateway (`192.168.66.254`) per l'intera subnet privata `192.168.66.0/24`, all'interno della quale risiedono tutti i server e i client del dominio.
* **Gestione Snapshot (Checkpoints):** Per garantire la riproducibilità degli stress-test e testare in sicurezza le procedure di Disaster Recovery, l'intero ciclo di vita delle VM è stato protetto sfruttando i Checkpoint nativi di **Hyper-V**, permettendo ripristini istantanei dello stato di pre-disastro.

## Active Directory e Risoluzione DNS

Il cuore logico dell'infrastruttura è basato sul dominio `lab.local`, gestito da due server in ambito misto configurati per garantire ridondanza ai servizi di autenticazione e risoluzione nomi, e testare l'interoperabilità tra diverse versioni del sistema operativo:

* **Sincronia e Nomenclatura (Ambiente Misto):** È stata adottata una rigida convenzione di naming (l'hostname corrisponde esattamente al nome della VM). I ruoli **AD DS** e **DNS** sono stati installati su `SRV-DC-01` (basato su **Windows Server 2019**, `192.168.66.1`) e successivamente su `SRV-DC-02` (aggiornato a **Windows Server 2022**, `192.168.66.2`), gestendo con successo l'integrazione a dominio nella medesima foresta.

* **Cross-DNS Configuration:** Per garantire la massima resilienza e prevenire problemi di "isole di replica", la risoluzione DNS è stata configurata a incrocio. Il Server DNS primario del DC1 punta al DC2, e viceversa; come server secondario, ciascuno punta a sé stesso (`127.0.0.1`). 
* **Risoluzione Esterna:** Per le query esterne al dominio sono stati configurati dei Forwarders verso resolver pubblici (es. `8.8.8.8`, `1.1.1.1`), evitando l'uso di inoltri condizionali.

## Alta Affidabilità: DHCP Failover

L'assegnazione degli indirizzi IP per il perimetro client è gestita in alta affidabilità dai due Domain Controller:

* **Scope e Reservation:** È stato configurato l'ambito `192.168.66.0/24` escludendo strategicamente i primi 20 IP (riservati alle infrastrutture) e gli ultimi 5. I client (es. `DSK-W10-01`) ricevono configurazioni di rete complete di Gateway e suffissi DNS, con *Reservation* statiche basate su MAC Address per macchine specifiche.
* **Load Balancing:** Il servizio è distribuito tramite una relazione di **DHCP Failover** denominata `FAILOVER-DC1&2`, configurata in modalità Bilanciamento del Carico l 50%, garantendo che in caso di caduta di un nodo, il partner subentri nell'erogazione dei lease IP rispettando i parametri di MCLT (Maximum Client Lead Time).

## File Server, Deduplica e Automazione GPO

Oltre ai servizi core, è stata implementata la centralizzazione delle risorse e l'automazione lato utente:

* **Gestione Storage (`SRV-FS-01`):** È stato deployato un File Server dedicato (`192.168.66.5`) su cui è stata abilitata la funzionalità di **Data Deduplication**, ottimizzando lo spazio fisico occupato sul disco host.
* **Permessi e Condivisione:** Sono state create condivisioni di rete **SMB**, implementando la sovrapposizione tra le autorizzazioni di condivisione di base e le più restrittive autorizzazioni di sicurezza **NTFS**, validate tramite la creazione di specifiche OU (Organizational Unit) e gruppi di test in Active Directory.
* **Group Policy (GPO):** Per migliorare l'esperienza utente finale, è stata creata e distribuita una **GPO** che esegue automaticamente il mapping (Drive Mapping) delle condivisioni di rete SMB su tutti i client che effettuano l'accesso al dominio.

## Disaster Recovery e Gestione FSMO Roles

L'architettura è stata sottoposta a rigorosi stress-test per convalidare le procedure di Business Continuity:

* **Test DHCP:** Spegnendo forzatamente `SRV-DC-02`, è stato verificato che le macchine client mantenessero la connettività di rete e che `SRV-DC-01` subentrasse correttamente nella gestione del lease IP post-rinegoziazione.
* **Seize dei Ruoli FSMO (PowerShell):** Simulando la distruzione irreversibile del Primary Domain Controller (`SRV-DC-01`), è stata eseguita la procedura di "seize" (sequestro) dei 5 ruoli **FSMO** (Flexible Single Master Operations) a favore di `SRV-DC-02` tramite linea di comando **PowerShell**. Il successo della presa in carico dei ruoli Master (RID, PDC Emulator, Infrastructure, Schema, Domain Naming) è stato validato tramite il comando `netdom query fsmo`, garantendo la sopravvivenza della foresta `lab.local` prima di procedere al rollback tramite Checkpoint.
