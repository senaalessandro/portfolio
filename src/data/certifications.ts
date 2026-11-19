export interface CertificationItem {
  title: string;
  vendor: string;
  date: string;
  verifyUrl: string;
  badgeSrc: string;
  bgIconLight: string;
  bgIconDark: string;
  logoLight: string;
  logoDark: string;
}

export const certifications: CertificationItem[] = [
  {
    title: 'Microsoft Security, Compliance, and Identity Fundamentals (SC-900)',
    vendor: 'Microsoft',
    date: '07/2026',
    verifyUrl: 'https://learn.microsoft.com/it-it/users/senaalessandro/credentials/AC85492B6DEA0869',
    badgeSrc: '/badges/sc-900.png',
    bgIconLight: '/logos/azure.png',
    bgIconDark: '/logos/azure.png',
    logoLight: '/logos/microsoft.png',
    logoDark: '/logos/microsoft.png',
  },
  {
    title: 'AWS Certified Cloud Practitioner (CLF-C02)',
    vendor: 'Amazon Web Services',
    date: '05/2026 - 05/2029',
    verifyUrl: 'https://www.credly.com/badges/be4e8c32-7a0d-4b54-b329-42af81a9ff83/public_url',
    badgeSrc: '/badges/clf-c02.png',
    bgIconLight: '/logos/aws-dark.png',
    bgIconDark: '/logos/aws-white.png',
    logoLight: '/logos/aws-dark.png',
    logoDark: '/logos/aws-white.png',
  },
  {
    title: 'Microsoft Azure Fundamentals (AZ-900)',
    vendor: 'Microsoft',
    date: '04/2026',
    verifyUrl: 'https://learn.microsoft.com/it-it/users/senaalessandro/credentials/b8dbc5a95c8801f7',
    badgeSrc: '/badges/az-900.png',
    bgIconLight: '/logos/azure.png',
    bgIconDark: '/logos/azure.png',
    logoLight: '/logos/microsoft.png',
    logoDark: '/logos/microsoft.png',
  },
  {
    title: 'AWS Academy Graduate - Cloud Foundations - Training Badge',
    vendor: 'Amazon Web Services',
    date: '04/2026',
    verifyUrl: 'https://www.credly.com/badges/0cfe4c8d-71a8-4a9b-aee9-94e39b8c5c44/public_url',
    badgeSrc: '/badges/aws-academy.png',
    bgIconLight: '/logos/aws-dark.png',
    bgIconDark: '/logos/aws-white.png',
    logoLight: '/logos/aws-dark.png',
    logoDark: '/logos/aws-white.png',
  },
  {
    title: 'Microsoft Introduction to Datacenters - Course Graduate',
    vendor: 'Microsoft',
    date: '03/2026',
    verifyUrl: 'https://www.credly.com/badges/d83af9ea-dc36-497a-ae24-d66ec411558c/public_url',
    badgeSrc: '/badges/ms-datacenters.png',
    bgIconLight: '/logos/microsoft.png',
    bgIconDark: '/logos/microsoft.png',
    logoLight: '/logos/microsoft.png',
    logoDark: '/logos/microsoft.png',
  },
  {
    title: 'IT Specialist - Python',
    vendor: 'Certiport (Pearson VUE)',
    date: '03/2025',
    verifyUrl: 'https://www.credly.com/badges/19246cbc-2fc1-4ba1-8c4f-f1e92ca78deb/public_url',
    badgeSrc: '/badges/python-specialist.png',
    bgIconLight: '/logos/python.png',
    bgIconDark: '/logos/python.png',
    logoLight: '/logos/pearson-white.png',
    logoDark: '/logos/pearson-dark.png',
  },
];
