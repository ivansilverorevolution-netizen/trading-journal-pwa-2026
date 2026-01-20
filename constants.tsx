
import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  PlusCircle,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Settings
} from 'lucide-react';

export const ROLES = [
  { value: 'analista_senior', label: 'Analista Senior' },
  { value: 'analista_junior', label: 'Analista Junior' },
  { value: 'alumno', label: 'Alumno' },
  { value: 'mentor', label: 'Mentor' },
];

export const SESSIONS = ['Asia', 'Londres', 'Nueva York', 'Nueva York PM'];
export const OP_TYPES = [
  { value: 'senal_equipo', label: 'Señal Equipo' },
  { value: 'operativa_propia', label: 'Operativa Propia' },
  { value: 'alumno', label: 'Alumno' },
];
export const INSTRUMENTS = ['FX', 'Indice', 'Cripto', 'Materia prima'];
export const DIRECTIONS = ['Largo', 'Corto'];
export const STATUSES = ['Ganadora', 'Perdedora', 'BE', 'Parcial'];
export const TIMEFRAMES = ['M1', 'M3', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'];
export const ERROR_TYPES = ['FOMO', 'SL_mal_colocado', 'Entrada_tardia', 'Sin_error', 'Otro'];
export const GESTION_TYPES = ['Plan_respetado', 'Salida_anticipada', 'Salida_tardia'];

export const NAVIGATION = [
  { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: 'dashboard' },
  { name: 'Registrar', icon: <PlusCircle size={20} />, path: 'registrar' },
  { name: 'Operaciones', icon: <ClipboardList size={20} />, path: 'operaciones' },
  { name: 'Traders', icon: <Users size={20} />, path: 'traders' },
];
