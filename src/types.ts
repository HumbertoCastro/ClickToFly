import type { ReactNode } from 'react';

export type NavItem = {
  label: string;
  href: string;
};

export type Deal = {
  origin: string;
  destination: string;
  foundPrice: string;
  averagePrice: string;
  savings: string;
  period: string;
  status: string;
  image: string;
  imageAlt: string;
};

export type Destination = {
  name: string;
  description: string;
  badge: string;
  image: string;
  imageAlt: string;
  featured?: boolean;
};

export type IconCard = {
  icon: ReactNode;
  title: string;
  description: string;
};

export type BudgetFormValues = {
  name: string;
  phone: string;
  email: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults: string;
  children: string;
  checkedBag: string;
  flexibleDates: string;
  services: string[];
  notes: string;
};
