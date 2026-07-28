export type ActionType =
  | 'send_whatsapp'
  | 'make_call'
  | 'send_sms'
  | 'set_reminder'
  | 'play_youtube'
  | 'play_spotify'
  | 'open_app'
  | 'search_web'
  | 'read_notifications'
  | 'dictate_note'
  | 'control_music'
  | 'janbot_query'
  | 'general_query'
  | 'take_photo'
  | 'open_camera'
  | 'toggle_flashlight'
  | 'toggle_wifi'
  | 'toggle_bluetooth'
  | 'airplane_mode'
  | 'set_brightness';

export interface ActionParams {
  contact?: string;
  phoneNumber?: string;
  message?: string;
  title?: string;
  content?: string;
  date?: string;
  time?: string;
  appName?: string;
  query?: string;
  level?: number;
  command?: 'play' | 'pause' | 'next' | 'prev' | 'volume_up' | 'volume_down';
  track?: string;
  queryType?: 'sales' | 'inventory' | 'leads' | 'ads';
  dateRange?: string;
}

export interface IntentResult {
  action: ActionType;
  params: ActionParams;
  confidence: number;
  explanation: string;
  feedbackText: string;
}

export interface Contact {
  id: string;
  name: string;
  nickname?: string;
  phone: string;
  avatar: string;
  hasWhatsapp: boolean;
}

export interface AppItem {
  id: string;
  name: string;
  packageName: string;
  iconName: string;
  category: 'social' | 'tools' | 'media' | 'business';
  color: string;
}

export interface SystemNotification {
  id: string;
  appName: string;
  appIcon: string;
  sender: string;
  text: string;
  time: string;
  read: boolean;
}

export interface CommandLog {
  id: string;
  timestamp: string;
  transcript: string;
  intent: IntentResult;
  providerUsed: 'NVIDIA NIM (LLaMA-3.3)' | 'OpenRouter (DeepSeek-R1)' | 'Gemini 3.6 Flash (Fallback)';
  latencyMs: number;
  status: 'executed' | 'failed' | 'pending';
}

export interface SalesData {
  todaySales: number;
  ordersCount: number;
  topProduct: string;
  conversionRate: string;
  adsSpent: number;
}
