---
layout: ../../layouts/ProjectLayout.astro
title: "Cluster Hyper-V"
status: "Completato"
techs: 
  - "/logos/win10.png"
  - "/logos/hyperv.png"
  - "/logos/active-directory.png"
  - "/logos/powershell.png"
---

## Panoramica del Progetto

Progettazione, configurazione e validazione di un'infrastruttura di virtualizzazione avanzata basata su **Microsoft Hyper-V**. Il progetto è stato sviluppato interamente su un singolo host fisico limitato a 16GB di RAM, affrontando la complessa sfida architetturale della **Nested Virtualization** (virtualizzazione annidata) per simulare un ambiente datacenter multi-nodo.

## Infrastruttura Core e Active Directory

La base logica dell'ambiente è stata strutturata creando un dominio dedicato per la gestione centralizzata degli host:

* **Domain Controller:** È stata deployata la macchina virtuale `SRV-DC1` (`192.168.77.1`) per ospitare i ruoli di **Active Directory Domain Services (AD DS)** e **DNS**.
* **Gestione Dominio:** È stata creata la foresta `lab.local`, configurando gli opportuni server di inoltro DNS e predisponendo i gruppi di sicurezza per l'amministrazione del cluster (es. `Domain Admins`).
* **Networking:** L'intero ecosistema è stato segregato nella rete `192.168.77.0/24`.

## Automazione e Provisioning (PowerShell)

Per velocizzare il deploy dei nodi Hyper-V e garantire l'assenza di conflitti SID/ID, la seconda istanza del cluster non è stata installata da zero, ma clonata utilizzando esclusivamente strumenti a riga di comando:

* **Export & Import:** La macchina `SRV-HV1` è stata esportata a freddo tramite il cmdlet **PowerShell** `Export-VM`. Successivamente, è stato effettuato il provisioning del nodo secondario (`SRV-HV1-CLONE`) sfruttando `Import-VM` con i parametri `-Copy` e `-GenerateNewId`, assicurando la corretta reinizializzazione degli identificativi univoci della macchina e ridirigendo i percorsi dei VHDX e degli Snapshot.

## Nested Virtualization (Hyper-V in Hyper-V)

Il cuore tecnico del progetto è consistito nell'abilitare i server membri (`SRV-HV1` e il suo clone) a ospitare a loro volta macchine virtuali:

* **Estensioni di Virtualizzazione:** È stato necessario esporre l'hardware virtuale dell'host fisico verso le VM guest tramite il comando PowerShell `Set-VMProcessor -ExposeVirtualizationExtensions $true`.
* **Traffico di Rete Annidato:** Per consentire alle macchine virtuali di "secondo livello" (come il client Windows 10 di test) di comunicare all'esterno, è stato abilitato il **MAC Address Spoofing** sulle schede di rete dei nodi Hyper-V virtualizzati (`Set-VMNetworkAdapter -MacAddressSpoofing On`).
* **Installazione e Tuning:** L'installazione del ruolo Hyper-V sui nodi guest è stata eseguita interamente in modalità headless tramite il comando `Install-WindowsFeature -Name Hyper-V -IncludeManagementTools -Restart`. Contestualmente la creazione del Virtual Switch esterno è stata automatizzata con `New-VMSwitch -Name "esterna" -NetAdapterName "Ethernet"` e i percorsi di archiviazione di default delle VM sono stati ottimizzati reindirizzandoli sulla directory radice `C:\HYPER-V\`.

## Business Continuity: Replica e Live Migration

L'ultima fase del progetto ha trasformato i due nodi isolati in un cluster capace di garantire Alta Affidabilità, validando lo spostamento a caldo e la replica asincrona delle Virtual Machine:

* **Delega Kerberos (Active Directory):** Affinché i nodi potessero autenticarsi reciprocamente e scambiarsi i workload in sicurezza, è stata configurata la delega in AD per i servizi `cifs` e `Microsoft Virtual System Migration Service` incrociata tra i due host di virtualizzazione.
* **Hyper-V Replica e Firewall:** È stata abilitata la replica di disaster recovery tra i nodi, utilizzando il protocollo HTTP (porta `80`) con autenticazione Kerberos e isolando i dati replicati nella directory dedicata `C:\HYPER-V\REPLICA\`. Per consentire il traffico di replica in ingresso, è stata sbloccata l'apposita eccezione nel firewall di Windows tramite il comando PowerShell `Enable-NetFirewallRule -DisplayName "Listener HTTP replica Hyper-V (TCP-In)"`.
* **Live Migration:** È stato configurato e testato lo spostamento "a caldo" della RAM e dello stato di esecuzione di una VM di test tra i due nodi annidati, senza alcuna interruzione di servizio, ottimizzando il traffico di migrazione sulla rete `192.168.77.0/24` tramite algoritmi di compressione.
