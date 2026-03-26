import {
  Activity, Globe, Moon, Plus, Minus, Settings, Sun, Timer, Trash, User, Users, Power, Zap,
  ChevronDown, ChevronUp, Info,
  type IconNode
} from 'lucide';

const icons = {
  info: Info,
  timer: Timer,
  settings: Settings,
  activity: Activity,
  globe: Globe,
  sun: Sun,
  moon: Moon,
  plus: Plus,
  minus: Minus,
  trash: Trash,
  user: User,
  users: Users,
  power: Power,
  zap: Zap,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp
} as Record<string, IconNode>;

export const iconRegistry = {
  icons
};