import { Crown, FlaskConical, Gem, GraduationCap, Paintbrush, ScanSearch, ShieldCheck, Timer, Trophy, Unlock } from 'lucide-react'

/** Maps achievement `icon` names (data/achievements.js) to components. */
const ICONS = { Crown, FlaskConical, Gem, GraduationCap, Paintbrush, ScanSearch, ShieldCheck, Timer, Unlock }

export const achievementIcon = (name) => ICONS[name] ?? Trophy
