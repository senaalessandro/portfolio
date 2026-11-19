import type { Lang } from '../i18n/ui';

export interface EducationItem {
  period: Record<Lang, string>;
  role: Record<Lang, string>;
  institution: Record<Lang, string>;
  institutionUrl?: string;
  logo?: string;
  description?: Record<Lang, string>;
  current?: boolean;
}

export const educationData: EducationItem[] = [
  {
    period: {
      it: '10/2025 - Attuale',
      en: '10/2025 - Present',
    },
    role: {
      it: 'ITS Network and Cloud Specialist',
      en: 'ITS Network and Cloud Specialist',
    },
    institution: {
      it: 'ITS Angelo Rizzoli, Milano',
      en: 'ITS Angelo Rizzoli, Milan',
    },
    institutionUrl: 'https://www.itsrizzoli.it/',
    logo: '/logos/itsar.png',
    description: {
      it: 'Percorso di alta specializzazione tecnica (5 EQF), focalizzato su Networking, Cloud, Virtualizzazione e Cyber Security.',
      en: 'Higher technical specialization program (EQF Level 5), focused on Networking, Cloud, Virtualization, and Cybersecurity.',
    },
    current: true,
  },
  {
    period: {
      it: '03/2024 - 03/2025',
      en: '03/2024 - 03/2025',
    },
    role: {
      it: 'Corso di Programmazione Python e AI',
      en: 'Python & AI Programming Course',
    },
    institution: {
      it: 'Volta Institute',
      en: 'Volta Institute',
    },
    institutionUrl: 'https://voltainstitute.it/',
    logo: '/logos/istituto-volta.png',
    description: {
      it: 'Percorso formativo specializzato sulla sintassi Python, OOP e Strutture Dati. Fondamenti Machine Learning e Deep Learning.',
      en: 'Specialized training program covering Python syntax, OOP, and Data Structures, along with Machine Learning and Deep Learning fundamentals.',
    },
  },
  {
    period: {
      it: '2018 - 2023',
      en: '2018 - 2023',
    },
    role: {
      it: 'Diploma di Maturità in Informatica',
      en: 'High School Diploma in Computer Science',
    },
    institution: {
      it: 'ITIS Stanislao Cannizzaro, Rho',
      en: 'ITIS Stanislao Cannizzaro, Rho',
    },
    institutionUrl: 'https://www.itiscannizzaro.edu.it/',
  },
];
