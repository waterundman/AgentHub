import React from 'react';
import * as LucideIcons from 'lucide-react';

export function Icon({ name, size = 16, color, className, ...props }) {
  const IconComponent = LucideIcons[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  return (
    <IconComponent 
      size={size} 
      color={color}
      className={className}
      {...props}
    />
  );
}

// 导出常用图标
export {
  Play, Settings, GitBranch, 
  Zap, Shield, FileText, Download,
  Upload, Trash, Copy, Check, X,
  ChevronDown, ChevronUp, Search,
  Moon, Sun, AlertCircle, Info,
  Loader, Circle, Hexagon, Coins,
  Clock, Wifi, WifiOff, RotateCcw,
  GitCommit, Folder, Wrench, Eye,
  StopCircle as Stop
} from 'lucide-react';