import type { Lang } from '../i18n/ui';

export interface ProjectTech {
  icon: string;
  label?: string;
}

export type ProjectStatus = 'Completato' | 'In corso' | 'Sospeso';

export interface ProjectItem {
  title: Record<Lang, string>;
  description: Record<Lang, string>;
  slug: string;
  status: ProjectStatus;
  featured: boolean;
  techs: ProjectTech[];
}

export const projects: ProjectItem[] = [
  {
    title: {
      it: 'Homelab Proxmox & PBS',
      en: 'Proxmox & PBS Homelab',
    },
    description: {
      it: "Progettazione e messa in produzione di un'infrastruttura Homelab avanzata basata su Proxmox VE e PBS. Architettura focalizzata su sicurezza (pfSense, WireGuard), performance (Docker in LXC) e affidabilità con storage ibrido ZFS e Disaster Recovery automatizzato.",
      en: 'Design and production deployment of an advanced Homelab infrastructure based on Proxmox VE and PBS. Architecture focused on security (pfSense, WireGuard), performance (Docker in LXC), and reliability with hybrid ZFS storage and automated Disaster Recovery.',
    },
    slug: 'homelab-pve',
    status: 'In corso',
    featured: true,
    techs: [
      { icon: '/logos/proxmox.png' },
      { icon: '/logos/pfsense.png' },
      { icon: '/logos/docker.png' },
      { icon: '/logos/npm.png' },
      { icon: '/logos/immich.png' },
    ],
  },
  {
    title: {
      it: 'Cluster Hyper-V & DR',
      en: 'Hyper-V Cluster & DR',
    },
    description: {
      it: 'Progettazione e implementazione di un cluster Microsoft Hyper-V in alta affidabilità (HA). Architettura completa con Windows Server 2022, Active Directory, SAN iSCSI centralizzata, networking SDN e Disaster Recovery basato su Hyper-V Replica.',
      en: 'Design and implementation of a High Availability (HA) Microsoft Hyper-V cluster. Complete architecture featuring Windows Server 2022, Active Directory, centralized iSCSI SAN, SDN networking, and Disaster Recovery powered by Hyper-V Replica.',
    },
    slug: 'cluster-hyperv',
    status: 'Completato',
    featured: true,
    techs: [
      { icon: '/logos/win10.png' },
      { icon: '/logos/hyperv.png' },
    ],
  },
  {
    title: {
      it: 'Nextcloud su Azure',
      en: 'Nextcloud on Azure',
    },
    description: {
      it: "Progettazione e deploy di un'infrastruttura Cloud su Microsoft Azure per l'hosting di Nextcloud. Architettura disaccoppiata (VM Debian, DB PostgreSQL in VNet Peering, Storage GZRS), sicurezza perimetrale (Nginx Proxy Manager, NSG) e caching ottimizzato (Redis/APCu).",
      en: 'Design and deployment of a Cloud infrastructure on Microsoft Azure for hosting Nextcloud. Decoupled architecture (Debian VM, PostgreSQL DB over VNet Peering, GZRS Storage), perimeter security (Nginx Proxy Manager, NSG), and optimized caching (Redis/APCu).',
    },
    slug: 'nextcloud-azure',
    status: 'Completato',
    featured: true,
    techs: [
      { icon: '/logos/azure.png' },
      { icon: '/logos/nextcloud.png' },
      { icon: '/logos/postgresql.png' },
    ],
  },
  {
    title: {
      it: 'Active Directory & HA',
      en: 'Active Directory & HA',
    },
    description: {
      it: "Progettazione e implementazione di un'infrastruttura di dominio Microsoft. Configurazione di Active Directory in alta affidabilità (doppio Domain Controller), DHCP Failover, File Server con deduplica dati e automazione tramite Group Policy (GPO).",
      en: 'Design and implementation of a Microsoft domain infrastructure. High-availability Active Directory setup (dual Domain Controllers), DHCP Failover, File Server with Data Deduplication, and automation via Group Policy (GPO).',
    },
    slug: 'ad-winsrv',
    status: 'Completato',
    featured: false,
    techs: [
      { icon: '/logos/win10.png' },
      { icon: '/logos/active-directory.png' },
      { icon: '/logos/dns.png' },
    ],
  },
  {
    title: {
      it: 'Machine Learning con Python',
      en: 'Machine Learning with Python',
    },
    description: {
      it: 'Analisi dati IMDb su Jupyter Notebook, pulizia dati con Numpy/Pandas, sviluppo e test di algoritmi predittivi.',
      en: 'IMDb dataset analysis on Jupyter Notebook, data cleaning with NumPy/Pandas, and development and testing of predictive algorithms.',
    },
    slug: 'ml-python',
    status: 'Completato',
    featured: false,
    techs: [
      { icon: '/logos/python.png' },
      { icon: '/logos/anaconda.png' },
      { icon: '/logos/jupyter.png' },
    ],
  },
  {
    title: {
      it: 'Backup centralizzato con UrBackup',
      en: 'Centralized Backup with UrBackup',
    },
    description: {
      it: 'Gestione backup schedulati per ambienti Windows e Linux con limitazione della banda massima tramite UrBackup.',
      en: 'Scheduled backup management for Windows and Linux environments with maximum bandwidth throttling via UrBackup.',
    },
    slug: 'urbackup',
    status: 'Sospeso',
    featured: false,
    techs: [
      { icon: '/logos/urbackup.png' },
      { icon: '/logos/win11.png' },
      { icon: '/logos/linux.png' },
    ],
  },
];
