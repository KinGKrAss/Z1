export type Status = 'online' | 'prepped' | 'offline';
export type EntryType = 'live' | 'stub';

export interface Goddess {
  id: string;
  name: string;
  domain: string;
  core_strength: string;
  prompt_prefix: string;
  role: string;
  access: string[];
  escalation: boolean;
  url: string;
  status: Status;
  type: EntryType;
  lastChecked?: string;
}
