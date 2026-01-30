/**
 * Arthur D. Little - Global Health Platform
 * Framework Layers Configuration
 * Shared data structure for Strategic Deep Dive topics
 */

import { Crown, Shield, Eye, Heart, type LucideIcon } from "lucide-react";

export interface FrameworkTopic {
  id: string;
  name: string;
  description: string;
}

export interface FrameworkLayer {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgClass: string;
  borderClass: string;
  iconBgClass: string;
  iconColorClass: string;
  topics: FrameworkTopic[];
}

// Comprehensive assessment topic (special)
export const COMPREHENSIVE_TOPIC = {
  id: "comprehensive",
  name: "Comprehensive Occupational Health Assessment",
  description: "Full analysis of all framework pillars",
};

// Framework layers with 3 topics each
export const FRAMEWORK_LAYERS: FrameworkLayer[] = [
  {
    id: "governance",
    name: "Governance Ecosystem",
    description: "Strategic capacity & policy foundations",
    icon: Crown,
    color: "purple",
    bgClass: "bg-purple-500/10",
    borderClass: "border-purple-500/30",
    iconBgClass: "bg-purple-500/20",
    iconColorClass: "text-purple-400",
    topics: [
      { id: "gov-policy", name: "Policy & Regulatory Framework", description: "National OH policies, legislation & ILO compliance" },
      { id: "gov-enforcement", name: "Inspection & Enforcement Capacity", description: "Inspector density, enforcement mechanisms & penalties" },
      { id: "gov-tripartite", name: "Tripartite Governance & Social Dialogue", description: "Employer-worker-government collaboration structures" },
    ],
  },
  {
    id: "hazard",
    name: "Hazard Prevention",
    description: "Pillar I — Prevention & Control",
    icon: Shield,
    color: "blue",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30",
    iconBgClass: "bg-blue-500/20",
    iconColorClass: "text-blue-400",
    topics: [
      { id: "haz-chemical", name: "Chemical & Carcinogen Exposure Control", description: "OEL compliance, hazardous substance management" },
      { id: "haz-physical", name: "Physical Hazards & Ergonomics", description: "Noise, vibration, ergonomic risk management" },
      { id: "haz-climate", name: "Heat Stress & Climate Adaptation", description: "Thermal regulations, outdoor worker protection" },
    ],
  },
  {
    id: "vigilance",
    name: "Surveillance & Detection",
    description: "Pillar II — Health Vigilance",
    icon: Eye,
    color: "teal",
    bgClass: "bg-teal-500/10",
    borderClass: "border-teal-500/30",
    iconBgClass: "bg-teal-500/20",
    iconColorClass: "text-teal-400",
    topics: [
      { id: "vig-disease", name: "Occupational Disease Surveillance", description: "Disease detection, reporting systems & registries" },
      { id: "vig-mental", name: "Workplace Mental Health Programs", description: "Psychosocial risk assessment, EAPs & support" },
      { id: "vig-screening", name: "Health Screening & Medical Surveillance", description: "Pre-employment & periodic health examinations" },
    ],
  },
  {
    id: "restoration",
    name: "Restoration & Compensation",
    description: "Pillar III — Recovery & Support",
    icon: Heart,
    color: "amber",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    iconBgClass: "bg-amber-500/20",
    iconColorClass: "text-amber-400",
    topics: [
      { id: "rest-compensation", name: "Workers' Compensation Systems", description: "Insurance coverage, claim processes & benefits" },
      { id: "rest-rtw", name: "Return-to-Work & Rehabilitation", description: "Vocational rehab, workplace accommodation programs" },
      { id: "rest-migrant", name: "Migrant & Informal Worker Protection", description: "Coverage gaps, portability & informal sector inclusion" },
    ],
  },
];

// Get all topic names as a flat array
export function getAllTopicNames(): string[] {
  const topics = [COMPREHENSIVE_TOPIC.name];
  FRAMEWORK_LAYERS.forEach(layer => {
    layer.topics.forEach(topic => {
      topics.push(topic.name);
    });
  });
  return topics;
}

// Find layer by topic name
export function getLayerByTopicName(topicName: string): FrameworkLayer | null {
  for (const layer of FRAMEWORK_LAYERS) {
    if (layer.topics.some(t => t.name === topicName)) {
      return layer;
    }
  }
  return null;
}
