
import {
  Activity, Globe, Moon, Plus, Minus, Settings, Sun, Timer, Trash, User, Users, Power, Zap,
  ChevronDown, ChevronUp, Info, Code, Radio, BarChart, Database, Server, Tv, Share2, X, Rocket,
  CheckCircle, XCircle, AlertTriangle, Check, CircleQuestionMark, CircleX, Text,
  type IconNode,
} from 'lucide';

const icons = {
  activity: Activity,
  'bar-chart': BarChart,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  success: CheckCircle,
  check: Check,
  question: CircleQuestionMark,
  "circle-x": CircleX,
  error: XCircle,
  warning: AlertTriangle,
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
  text: Text,
  user: User,
  users: Users,
  x: X,
  zap: Zap,
  rocket: Rocket,
} as Record<string, IconNode>;

export const iconRegistry = {
  icons
};