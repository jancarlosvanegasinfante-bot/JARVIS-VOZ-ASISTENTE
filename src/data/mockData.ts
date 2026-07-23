import { Contact, AppItem, SystemNotification, SalesData } from '../types';

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'c1',
    name: 'Juan Carlos',
    nickname: 'Juan',
    phone: '+57 300 456 7890',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    hasWhatsapp: true,
  },
  {
    id: 'c2',
    name: 'María Alejandra',
    nickname: 'María',
    phone: '+57 312 987 6543',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    hasWhatsapp: true,
  },
  {
    id: 'c3',
    name: 'Mamá (Elena)',
    nickname: 'Mamá',
    phone: '+57 315 222 3344',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
    hasWhatsapp: true,
  },
  {
    id: 'c4',
    name: 'Carlos Botero',
    nickname: 'Carlos',
    phone: '+57 318 555 1212',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    hasWhatsapp: true,
  },
  {
    id: 'c5',
    name: 'JanBot Soporte',
    nickname: 'Soporte',
    phone: '+57 320 000 1122',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80',
    hasWhatsapp: true,
  }
];

export const INSTALLED_APPS: AppItem[] = [
  { id: 'a1', name: 'WhatsApp', packageName: 'com.whatsapp', iconName: 'MessageCircle', category: 'social', color: 'bg-emerald-500' },
  { id: 'a2', name: 'Teléfono', packageName: 'com.android.dialer', iconName: 'Phone', category: 'tools', color: 'bg-blue-500' },
  { id: 'a3', name: 'Spotify', packageName: 'com.spotify.music', iconName: 'Music', category: 'media', color: 'bg-green-600' },
  { id: 'a4', name: 'JANBOT Analytics', packageName: 'com.janbot.shop', iconName: 'BarChart3', category: 'business', color: 'bg-indigo-600' },
  { id: 'a5', name: 'Reloj / Alarmas', packageName: 'com.android.deskclock', iconName: 'Clock', category: 'tools', color: 'bg-purple-600' },
  { id: 'a6', name: 'Mensajes SMS', packageName: 'com.android.mms', iconName: 'Send', category: 'social', color: 'bg-sky-500' },
  { id: 'a7', name: 'Navegador Web', packageName: 'com.android.chrome', iconName: 'Globe', category: 'tools', color: 'bg-amber-500' },
  { id: 'a8', name: 'Bloc de Notas', packageName: 'com.android.notes', iconName: 'FileText', category: 'tools', color: 'bg-rose-500' },
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'n1',
    appName: 'WhatsApp',
    appIcon: 'MessageCircle',
    sender: 'Juan Carlos',
    text: '¿A qué hora nos vemos hoy para revisar la arquitectura del bot?',
    time: 'Hace 5 min',
    read: false,
  },
  {
    id: 'n2',
    appName: 'JANBOT Shop',
    appIcon: 'BarChart3',
    sender: 'Notificación de Ventas',
    text: '🎉 ¡Nueva venta realizada! Pedido #8492 - $185.000 COP',
    time: 'Hace 12 min',
    read: false,
  },
  {
    id: 'n3',
    appName: 'Reloj',
    appIcon: 'Clock',
    sender: 'Recordatorio',
    text: 'Llamar a proveedor de insumos JanAds',
    time: 'Hace 45 min',
    read: true,
  },
];

export const INITIAL_SALES_DATA: SalesData = {
  todaySales: 2840000,
  ordersCount: 18,
  topProduct: 'Curso IA JanBot + Automatización',
  conversionRate: '4.8%',
  adsSpent: 320000,
};
