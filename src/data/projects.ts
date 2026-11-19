export interface ProjectTech {
  icon: string;
  label?: string;
}

export interface ProjectItem {
  title: string;
  description: string;
  slug: string;
  status: "Completato" | "In corso" | "Sospeso";
  featured: boolean;
  techs: ProjectTech[];
}

export const projects: ProjectItem[] = [
  {
    title: "Homelab Proxmox & PBS",
    description: "Progettazione e messa in produzione di un'infrastruttura Homelab avanzata basata su Proxmox VE e PBS. Architettura focalizzata su sicurezza (pfSense, WireGuard), performance (Docker in LXC) e affidabilità con storage ibrido ZFS e Disaster Recovery automatizzato.",
    slug: "homelab-pve",
    status: "In corso",
    featured: true,
    techs: [
      { icon: "/logos/proxmox.png" },
      { icon: "/logos/pfsense.png" },
      { icon: "/logos/docker.png" },
      { icon: "/logos/npm.png" },
      { icon: "/logos/immich.png" }
    ]
  },
  {
    title: "Cluster Hyper-V & DR",
    description: "Progettazione e implementazione di un cluster Microsoft Hyper-V in alta affidabilità (HA). Architettura completa con Windows Server 2022, Active Directory, SAN iSCSI centralizzata, networking SDN e Disaster Recovery basato su Hyper-V Replica.",
    slug: "cluster-hyperv",
    status: "Completato",
    featured: true,
    techs: [
      { icon: "/logos/win10.png" },
      { icon: "/logos/hyperv.png" }
    ]
  },
  {
    title: "Nextcloud su Azure",
    description: "Progettazione e deploy di un'infrastruttura Cloud su Microsoft Azure per l'hosting di Nextcloud. Architettura disaccoppiata (VM Debian, DB PostgreSQL in VNet Peering, Storage GZRS), sicurezza perimetrale (Nginx Proxy Manager, NSG) e caching ottimizzato (Redis/APCu).",
    slug: "nextcloud-azure",
    status: "Completato",
    featured: true,
    techs: [
      { icon: "/logos/azure.png" },
      { icon: "/logos/nextcloud.png" },
      { icon: "/logos/postgresql.png" }
    ]
  },
  {
    title: "Active Directory & HA",
    description: "Progettazione e implementazione di un'infrastruttura di dominio Microsoft. Configurazione di Active Directory in alta affidabilità (doppio Domain Controller), DHCP Failover, File Server con deduplica dati e automazione tramite Group Policy (GPO).",
    slug: "ad-winsrv",
    status: "Completato",
    featured: false,
    techs: [
      { icon: "/logos/win10.png" },
      { icon: "/logos/active-directory.png" },
      { icon: "/logos/dns.png" }
    ]
  },
  {
    title: "Machine Learning con Python",
    description: "Analisi dati IMDb su Jupyter Notebook, pulizia dati con Numpy/Pandas, sviluppo e test di algoritmi predittivi.",
    slug: "ml-python",
    status: "Completato",
    featured: false,
    techs: [
      { icon: "/logos/python.png" },
      { icon: "/logos/anaconda.png" },
      { icon: "/logos/jupyter.png" }
    ]
  },
  {
    title: "Backup centralizzato con UrBackup",
    description: "Gestione backup schedulati per ambienti Windows e Linux con limitazione della banda massima tramite UrBackup.",
    slug: "urbackup",
    status: "Sospeso",
    featured: false,
    techs: [
      { icon: "/logos/urbackup.png" },
      { icon: "/logos/win11.png" },
      { icon: "/logos/linux.png" }
    ]
  }
];

