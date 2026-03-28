
import {
  Activity, Globe, Moon, Plus, Minus, Settings, Sun, Timer, Trash, User, Users, Power, Zap,
  ChevronDown, ChevronUp, Info, Code, Radio, BarChart, Database, Server, Tv, Share2,
  type IconNode
} from 'lucide';

const icons = {
  activity: Activity,
  'bar-chart': BarChart,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  code: Code,
  database: Database,
  globe: Globe,
  info: Info,
  minus: Minus,
  moon: Moon,
  plus: Plus,
  power: Power,
  radio: Radio,
  'share-2': Share2,
  server: Server,
  settings: Settings,
  sun: Sun,
  timer: Timer,
  trash: Trash,
  tv: Tv,
  user: User,
  users: Users,
  zap: Zap,
} as Record<string, IconNode>;

export const iconRegistry = {
  icons
};