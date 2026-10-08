---
layout: ../../layouts/ProjectLayout.astro
title: "Nextcloud on Microsoft Azure"
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
## Panoramica del Progetto

Progettazione e messa in produzione di un ambiente Cloud Enterprise per l'hosting di **Nextcloud**, strutturato su un'architettura disaccoppiata (Compute, Database, Storage) per massimizzare la scalabilità. Il progetto è stato sviluppato integrando sicurezza perimetrale tramite Reverse Proxy e un'ottimizzazione avanzata delle performance.

## Infrastruttura Cloud (Microsoft Azure)

L'architettura sfrutta una combinazione di servizi IaaS e PaaS per separare lo stato delle applicazioni dal calcolo vero e proprio, garantendo maggiore flessibilità:

* **Compute e Networking (IaaS):** Il core applicativo risiede su una Macchina Virtuale **Debian 13** allocata nella region West Europe (IP privato `10.1.10.4` e IP pubblico associato a un record su **DuckDNS**). Questa istanza fa da host per il Web Server, il motore **PHP** e il container **Docker** dedicato al Reverse Proxy. La sicurezza di rete è garantita da un **Network Security Group (NSG)** su Azure e dal firewall interno **UFW**, configurati in sinergia per esporre solo le porte strettamente necessarie (`22`, `80`, `443`, `81`) e consentire il traffico interno verso l'applicativo sulla porta `8080/tcp`.
* **Database (PaaS):** Il backend relazionale è affidato ad **Azure Database for PostgreSQL**, ospitato nella region North Europe (`pgsql-nc-neu.postgres.database.azure.com`). Per garantire una comunicazione sicura e a bassa latenza con la VM principale scavalcando Internet pubblico, le due regioni sono connesse tramite **VNet Peering**.
* **Storage ad Alta Affidabilità:** I dati degli utenti sono archiviati su una **Azure File Share** da 500 GB con livello di ridondanza **GZRS** (Geo-Zone-Redundant Storage), garantendo la replica sincrona su tre zone di disponibilità e asincrona in una regione secondaria per la massima protezione contro i disastri. Lo storage è montato nativamente sul sistema operativo tramite protocollo **SMB** nel percorso `/mnt/ncdata/`.

## Configurazione Backend (Web Server & PHP)

Il livello applicativo è stato configurato custom per operare in modo efficiente dietro un reverse proxy e per gestire carichi di lavoro intensivi:

* **Apache Web Server:** Per evitare conflitti di porta con il proxy, **Apache** è stato riposizionato in ascolto unicamente sulla porta interna (direttiva `Listen 8080` in `/etc/apache2/ports.conf`). Tramite la direttiva `AllowOverride All` applicata alla directory `/var/www/html/`, **Nextcloud** è in grado di autogestire il routing avanzato e i reindirizzamenti necessari per servizi come CardDAV e CalDAV.
* **Motore PHP (8.4 NTS):** L'ambiente è stato potenziato con i moduli `php-apcu`, `php-redis` e `php-imagick`. Le configurazioni nei file `php.ini` prevedono un limite di memoria esteso a `512M`, la disattivazione dell'output buffering (come richiesto dalle best practice dell'applicativo) e l'abilitazione di **OPcache** per velocizzare drasticamente l'esecuzione degli script.

## Architettura Nextcloud (App & Caching)

L'istanza di **Nextcloud** è stata isolata e configurata per ridurre al minimo i colli di bottiglia e il carico sul database remoto:

* **Caching e File Locking:** Per evitare le latenze fisiologiche causate dalla comunicazione inter-regionale con **PostgreSQL**, le operazioni rapide e i lock sui file avvengono direttamente nella RAM della VM in West Europe. La Local Cache sfrutta **APCu**, mentre il Transactional File Locking è delegato a un demone **Redis** in ascolto locale sull'indirizzo `127.0.0.1:6379`.
* **Parametri di Sistema:** Il file `config.php` è stato personalizzato iniettando la `datadirectory` corretta per lo storage di rete, forzando la generazione di link sicuri (`overwriteprotocol => https`) e spostando le operazioni di manutenzione automatica e i cronjob più pesanti alle 02:00 UTC tramite il parametro `maintenance_window_start`.

## Sicurezza Perimetrale (Nginx Proxy Manager)

Tutto il traffico proveniente da Internet viene intercettato, criptato e filtrato da **Nginx Proxy Manager (NPM)** prima di raggiungere l'infrastruttura interna.

* **Isolamento Docker:** Il proxy è eseguito tramite **Docker CE** con network isolata. Per prevenire problemi di corruzione del database **SQLite** e conflitti di permessi sui certificati SSL, i volumi persistenti (`/srv/npm/`) risiedono sul disco managed locale della VM e non sulla share di rete **SMB**.
* **Reverse Proxy e SSL:** Il servizio intercetta le richieste sul dominio dinamico gestito da **DuckDNS** e inoltra il traffico verso l'IP interno `10.1.10.4:8080`. NPM garantisce un grado di sicurezza Enterprise forzando tutto il traffico su HTTPS, sfruttando il protocollo **HTTP/2**, abilitando il supporto ai **Websockets** e gestendo il rinnovo completamente automatizzato dei certificati **Let's Encrypt** tramite challenge HTTP-01.
