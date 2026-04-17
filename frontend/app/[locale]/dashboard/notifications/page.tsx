'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Bell,
  Plus,
  Trash2,
  Send,
  Clock,
  Loader2,
  Settings2,
  Calendar,
  Mail,
  MessageSquare,
  Smartphone,
  Webhook,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useNotificationSettings,
  useCreateNotificationSetting,
  useUpdateNotificationSetting,
  useDeleteNotificationSetting,
  useTestNotificationSetting,
  useSchedules,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  NotificationSettings,
  Schedule,
} from '@/lib/hooks/use-notifications';
import { useUserProfile } from '@/lib/hooks/use-user';
import { OCCASIONS } from '@/lib/types';
import { useTranslations } from 'next-intl';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const DAYS = DAY_KEYS.map((key, i) => ({ value: i, key }));

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  ntfy: <Bell className="h-5 w-5" />,
  mattermost: <MessageSquare className="h-5 w-5" />,
  bark: <Smartphone className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
  webhook: <Webhook className="h-5 w-5" />,
};

const CHANNEL_LABEL_KEYS: Record<string, string> = {
  ntfy: 'channelLabels.ntfy',
  mattermost: 'channelLabels.mattermost',
  bark: 'channelLabels.bark',
  email: 'channelLabels.email',
  webhook: 'channelLabels.webhook',
};

const WEBHOOK_FORMATS = [
  'json',
  'discord',
  'slack',
  'telegram',
  'lark',
  'feishu',
  'dingtalk',
  'wecom',
  'teams',
] as const;
type WebhookFormat = (typeof WEBHOOK_FORMATS)[number];

function ChannelCard({
  setting,
  onTest,
  onToggle,
  onDelete,
  testing,
}: {
  setting: NotificationSettings;
  onTest: () => void;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  testing: boolean;
}) {
  const t = useTranslations('notifications');
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {CHANNEL_ICONS[setting.channel]}
            </div>
            <div>
              <p className="font-medium">{t(`channelLabels.${setting.channel}` as Parameters<typeof t>[0])}</p>
              <p className="text-sm text-muted-foreground">
                {setting.channel === 'ntfy' && String(setting.config.topic ?? '')}
                {setting.channel === 'mattermost' && t('channels.webhookConfigured')}
                {setting.channel === 'bark' &&
                  (setting.config.device_key &&
                  String(setting.config.device_key).length >= 4
                    ? `***${String(setting.config.device_key).slice(-4)}`
                    : t('channels.barkDeviceConfigured'))}
                {setting.channel === 'email' && String(setting.config.address ?? '')}
                {setting.channel === 'webhook' &&
                  `${String(setting.config.format ?? 'json')} → ${String(setting.config.url ?? '').slice(0, 60)}${
                    String(setting.config.url ?? '').length > 60 ? '…' : ''
                  }`}
              </p>
            </div>
          </div>
          <Switch checked={setting.enabled} onCheckedChange={onToggle} />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onTest}
            disabled={testing || !setting.enabled}
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            {t('channels.test')}
          </Button>
          <Badge variant="secondary">{t('channels.priority', { n: setting.priority })}</Badge>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type ChannelType = 'ntfy' | 'mattermost' | 'email' | 'bark' | 'webhook';

interface ChannelFormData {
  channel: ChannelType;
  enabled: boolean;
  priority: number;
  config: Record<string, unknown>;
}

function AddChannelDialog({
  onAdd,
  isLoading,
  onSuccess,
  userEmail,
}: {
  onAdd: (data: ChannelFormData) => Promise<void>;
  isLoading: boolean;
  onSuccess?: () => void;
  userEmail?: string;
}) {
  const t = useTranslations('notifications');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<ChannelType>('ntfy');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [webhookHeadersInput, setWebhookHeadersInput] = useState<string>('');
  const [webhookTemplateInput, setWebhookTemplateInput] = useState<string>('');
  const [ntfyDefaults, setNtfyDefaults] = useState<{ server: string; token: string } | null>(null);
  const [barkDefaults, setBarkDefaults] = useState<{ server: string } | null>(null);

  useEffect(() => {
    if (open && !ntfyDefaults) {
      fetch('/api/v1/notifications/defaults/ntfy')
        .then((res) => res.json())
        .then((data) => {
          setNtfyDefaults(data);
          if (channel === 'ntfy' && !config.server) {
            setConfig({ server: data.server, token: data.token || '' });
          }
        })
        .catch(() => {
          setNtfyDefaults({ server: 'https://ntfy.sh', token: '' });
        });
    }
  }, [open, ntfyDefaults, channel, config.server]);

  useEffect(() => {
    if (open && !barkDefaults) {
      fetch('/api/v1/notifications/defaults/bark')
        .then((res) => res.json())
        .then((data) => setBarkDefaults(data))
        .catch(() => setBarkDefaults({ server: 'https://api.day.app' }));
    }
  }, [open, barkDefaults]);

  useEffect(() => {
    if (channel === 'ntfy' && ntfyDefaults) {
      setConfig({ server: ntfyDefaults.server, token: ntfyDefaults.token || '' });
    } else if (channel === 'email') {
      setConfig(userEmail ? { address: userEmail } : {});
    } else if (channel === 'bark' && barkDefaults) {
      setConfig({
        server: barkDefaults.server,
        device_key: '',
        group: 'Wardrowbe',
      });
    } else if (channel === 'webhook') {
      setConfig({ url: '', method: 'POST', format: 'json' });
      setWebhookHeadersInput('');
      setWebhookTemplateInput('');
    } else {
      setConfig({});
    }
  }, [channel, ntfyDefaults, barkDefaults, userEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (channel === 'ntfy' && !config.topic?.trim()) {
      toast.error(t('validation.topicRequired'));
      return;
    }
    if (channel === 'mattermost' && !config.webhook_url?.trim()) {
      toast.error(t('validation.webhookRequired'));
      return;
    }
    if (channel === 'email' && !config.address?.trim()) {
      toast.error(t('validation.emailRequired'));
      return;
    }
    if (channel === 'bark' && !config.device_key?.trim()) {
      toast.error(t('validation.barkDeviceKeyRequired'));
      return;
    }

    let finalConfig: Record<string, unknown> = { ...config };
    if (channel === 'webhook') {
      if (!config.url?.trim()) {
        toast.error(t('validation.webhookUrlRequired'));
        return;
      }
      if (config.format === 'telegram' && !config.chat_id?.trim()) {
        toast.error(t('validation.webhookChatIdRequired'));
        return;
      }
      if (webhookHeadersInput.trim()) {
        try {
          const parsed = JSON.parse(webhookHeadersInput);
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            throw new Error('not an object');
          }
          finalConfig.headers = parsed;
        } catch {
          toast.error(t('validation.webhookHeadersInvalid'));
          return;
        }
      } else {
        delete finalConfig.headers;
      }
      if (webhookTemplateInput.trim()) {
        finalConfig.template = webhookTemplateInput.trim();
      } else {
        delete finalConfig.template;
      }
      if (!finalConfig.method) finalConfig.method = 'POST';
      if (!finalConfig.format) finalConfig.format = 'json';
    }

    try {
      await onAdd({
        channel,
        enabled: true,
        priority: 1,
        config: finalConfig,
      });
      setOpen(false);
      setConfig({});
      setWebhookHeadersInput('');
      setWebhookTemplateInput('');
      setChannel('ntfy');
      onSuccess?.();
    } catch {
      // Error handled by parent via toast
    }
  };

  const closeAndReset = () => {
    setOpen(false);
    setConfig({});
    setWebhookHeadersInput('');
    setWebhookTemplateInput('');
    setChannel('ntfy');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('channels.addChannel')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('addChannelDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('addChannelDialog.subtitle')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('addChannelDialog.channelType')}</Label>
              <Select
                value={channel}
                onValueChange={(v: ChannelType) => {
                  setChannel(v);
                  setConfig({});
                  setWebhookHeadersInput('');
                  setWebhookTemplateInput('');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ntfy">{t('addChannelDialog.ntfyPush')}</SelectItem>
                  <SelectItem value="mattermost">{t('addChannelDialog.mattermost')}</SelectItem>
                  <SelectItem value="bark">{t('addChannelDialog.bark')}</SelectItem>
                  <SelectItem value="email">{t('addChannelDialog.email')}</SelectItem>
                  <SelectItem value="webhook">{t('addChannelDialog.webhook')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {channel === 'ntfy' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="server">{t('addChannelDialog.serverUrl')}</Label>
                  <Input
                    id="server"
                    value={config.server || 'https://ntfy.sh'}
                    onChange={(e) => setConfig({ ...config, server: e.target.value })}
                    placeholder="https://ntfy.sh"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">{t('addChannelDialog.topic')} *</Label>
                  <Input
                    id="topic"
                    value={config.topic || ''}
                    onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                    placeholder="my-wardrobe-notifications"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('addChannelDialog.topicHint')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token">{t('addChannelDialog.accessToken')}</Label>
                  <Input
                    id="token"
                    type="password"
                    value={config.token || ''}
                    onChange={(e) => setConfig({ ...config, token: e.target.value })}
                    placeholder="tk_..."
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('addChannelDialog.tokenHint')}
                  </p>
                </div>
              </>
            )}

            {channel === 'mattermost' && (
              <div className="space-y-2">
                <Label htmlFor="webhook">{t('addChannelDialog.webhookUrl')} *</Label>
                <Input
                  id="webhook"
                  value={config.webhook_url || ''}
                  onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
                  placeholder="https://mattermost.example.com/hooks/xxx"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t('addChannelDialog.webhookHint')}
                </p>
              </div>
            )}

            {channel === 'bark' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bark-server">{t('addChannelDialog.serverUrl')}</Label>
                  <Input
                    id="bark-server"
                    value={config.server || 'https://api.day.app'}
                    onChange={(e) => setConfig({ ...config, server: e.target.value })}
                    placeholder="https://api.day.app"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bark-device">{t('addChannelDialog.barkDeviceKey')} *</Label>
                  <Input
                    id="bark-device"
                    type="password"
                    autoComplete="off"
                    value={config.device_key || ''}
                    onChange={(e) => setConfig({ ...config, device_key: e.target.value })}
                    placeholder="xxxxxxxx"
                    required
                  />
                  <p className="text-xs text-muted-foreground">{t('addChannelDialog.barkDeviceKeyHint')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bark-group">{t('addChannelDialog.barkGroup')}</Label>
                  <Input
                    id="bark-group"
                    value={config.group ?? 'Wardrowbe'}
                    onChange={(e) => setConfig({ ...config, group: e.target.value })}
                    placeholder="Wardrowbe"
                  />
                  <p className="text-xs text-muted-foreground">{t('addChannelDialog.barkGroupHint')}</p>
                </div>
              </>
            )}

            {channel === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="email">{t('addChannelDialog.emailAddress')} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={config.address || ''}
                  onChange={(e) => setConfig({ ...config, address: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>
            )}

            {channel === 'webhook' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">{t('addChannelDialog.webhookUrlLabel')} *</Label>
                  <Input
                    id="webhook-url"
                    value={config.url || ''}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    placeholder="https://example.com/hook"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('addChannelDialog.webhookUrlHint')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{t('addChannelDialog.webhookFormat')}</Label>
                  <Select
                    value={(config.format as WebhookFormat) || 'json'}
                    onValueChange={(v: WebhookFormat) =>
                      setConfig({ ...config, format: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEBHOOK_FORMATS.map((fmt) => (
                        <SelectItem key={fmt} value={fmt}>
                          {t(`addChannelDialog.webhookFormatLabels.${fmt}` as Parameters<typeof t>[0])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('addChannelDialog.webhookFormatHint')}
                  </p>
                </div>
                {config.format === 'telegram' && (
                  <div className="space-y-2">
                    <Label htmlFor="webhook-chat-id">
                      {t('addChannelDialog.webhookChatId')} *
                    </Label>
                    <Input
                      id="webhook-chat-id"
                      value={config.chat_id || ''}
                      onChange={(e) => setConfig({ ...config, chat_id: e.target.value })}
                      placeholder="123456789"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('addChannelDialog.webhookChatIdHint')}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>{t('addChannelDialog.webhookMethod')}</Label>
                  <Select
                    value={(config.method as string) || 'POST'}
                    onValueChange={(v: string) => setConfig({ ...config, method: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-headers">
                    {t('addChannelDialog.webhookHeaders')}
                  </Label>
                  <textarea
                    id="webhook-headers"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    value={webhookHeadersInput}
                    onChange={(e) => setWebhookHeadersInput(e.target.value)}
                    placeholder='{"Authorization": "Bearer xxx"}'
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('addChannelDialog.webhookHeadersHint')}
                  </p>
                </div>
                {config.format === 'json' && (
                  <div className="space-y-2">
                    <Label htmlFor="webhook-template">
                      {t('addChannelDialog.webhookTemplate')}
                    </Label>
                    <textarea
                      id="webhook-template"
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                      value={webhookTemplateInput}
                      onChange={(e) => setWebhookTemplateInput(e.target.value)}
                      placeholder='{"msg": "{title}", "text": "{summary}"}'
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('addChannelDialog.webhookTemplateHint')}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAndReset} disabled={isLoading}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('addChannelDialog.adding')}
                </>
              ) : (
                t('channels.addChannel')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleCard({
  schedule,
  onToggle,
  onToggleDayBefore,
  onDelete,
}: {
  schedule: Schedule;
  onToggle: (enabled: boolean) => void;
  onToggleDayBefore: (notify_day_before: boolean) => void;
  onDelete: () => void;
}) {
  const t = useTranslations('notifications');
  const td = useTranslations('dayNames');
  const to = useTranslations('settings.recommendations.occasions');
  const day = DAYS.find((d) => d.value === schedule.day_of_week);
  const occasion = OCCASIONS.find((o) => o.value === schedule.occasion);

  const notifyDay = schedule.notify_day_before
    ? DAYS[(schedule.day_of_week + 6) % 7]
    : day;

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium">{day ? td(day.key) : ''}</p>
            <p className="text-sm text-muted-foreground">
              {schedule.notification_time} - {occasion ? to(occasion.value as Parameters<typeof to>[0]) : schedule.occasion}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={schedule.enabled} onCheckedChange={onToggle} />
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          <Switch
            id={`daybefore-${schedule.id}`}
            checked={schedule.notify_day_before}
            onCheckedChange={onToggleDayBefore}
          />
          <Label htmlFor={`daybefore-${schedule.id}`} className="text-sm cursor-pointer">
            {t('schedules.notifyDayBefore')}
          </Label>
        </div>
        {schedule.notify_day_before && (
          <span className="text-xs text-muted-foreground">
            {t('schedules.evening', { day: notifyDay ? td(notifyDay.key) : '' })}
          </span>
        )}
      </div>
    </div>
  );
}

interface ScheduleFormData {
  day_of_week: number;
  notification_time: string;
  occasion: string;
  enabled: boolean;
  notify_day_before: boolean;
}

function AddScheduleDialog({
  onAdd,
  isLoading,
}: {
  onAdd: (data: ScheduleFormData) => Promise<void>;
  isLoading: boolean;
}) {
  const t = useTranslations('notifications');
  const tc = useTranslations('common');
  const td = useTranslations('dayNames');
  const to = useTranslations('settings.recommendations.occasions');
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState('07:00');
  const [occasion, setOccasion] = useState('casual');
  const [notifyDayBefore, setNotifyDayBefore] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);

  const notifyDayLabel = notifyDayBefore
    ? td(DAY_KEYS[(dayOfWeek + 6) % 7])
    : td(DAY_KEYS[dayOfWeek]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onAdd({
        day_of_week: dayOfWeek,
        notification_time: time,
        occasion,
        enabled: true,
        notify_day_before: notifyDayBefore,
      });
      setOpen(false);
      setTime('07:00');
      setOccasion('casual');
      setNotifyDayBefore(false);
    } catch {
      // Error handled by parent via toast
    }
  };

  const closeAndReset = () => {
    setOpen(false);
    setTime('07:00');
    setOccasion('casual');
    setNotifyDayBefore(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          {t('schedules.addSchedule')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('addScheduleDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('addScheduleDialog.subtitle')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('addScheduleDialog.day')}</Label>
              <Select
                value={String(dayOfWeek)}
                onValueChange={(v) => setDayOfWeek(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {td(day.key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">{t('addScheduleDialog.time')}</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('addScheduleDialog.occasion')}</Label>
              <Select value={occasion} onValueChange={setOccasion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OCCASIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {to(o.value as Parameters<typeof to>[0])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="notify-day-before">{t('addScheduleDialog.notifyDayBefore')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('addScheduleDialog.dayBeforeHint')}
                </p>
              </div>
              <Switch
                id="notify-day-before"
                checked={notifyDayBefore}
                onCheckedChange={setNotifyDayBefore}
              />
            </div>
            {notifyDayBefore && (
              <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                {t('addScheduleDialog.notifyMessage', {
                  notifyDay: notifyDayLabel,
                  time,
                  outfitDay: td(DAY_KEYS[dayOfWeek]),
                })}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAndReset} disabled={isLoading}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('addScheduleDialog.adding')}
                </>
              ) : (
                t('schedules.addSchedule')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const tc = useTranslations('common');
  const { data: settings, isLoading: loadingSettings } = useNotificationSettings();
  const { data: schedules, isLoading: loadingSchedules } = useSchedules();
  const { data: userProfile } = useUserProfile();

  const createSetting = useCreateNotificationSetting();
  const updateSetting = useUpdateNotificationSetting();
  const deleteSetting = useDeleteNotificationSetting();
  const testSetting = useTestNotificationSetting();

  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

  const [testingId, setTestingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'channel' | 'schedule'; id: string } | null>(null);

  const handleCreateChannel = async (data: ChannelFormData): Promise<void> => {
    try {
      await createSetting.mutateAsync(data);
      toast.success(t('channels.channelAdded'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('errors.addChannelFailed');
      toast.error(message);
      throw error;
    }
  };

  const handleCreateSchedule = async (data: ScheduleFormData): Promise<void> => {
    try {
      await createSchedule.mutateAsync(data);
      toast.success(t('schedules.scheduleAdded'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('errors.addScheduleFailed');
      toast.error(message);
      throw error;
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const result = await testSetting.mutateAsync(id);
      toast.success(result.message || t('errors.testSent'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('errors.testFailed');
      toast.error(message);
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleChannel = async (id: string, enabled: boolean) => {
    try {
      await updateSetting.mutateAsync({ id, data: { enabled } });
      toast.success(enabled ? t('channels.channelEnabled') : t('channels.channelDisabled'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('errors.updateFailed');
      toast.error(message);
    }
  };

  const handleToggleSchedule = async (id: string, enabled: boolean) => {
    try {
      await updateSchedule.mutateAsync({ id, data: { enabled } });
      toast.success(enabled ? t('schedules.scheduleEnabled') : t('schedules.scheduleDisabled'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('errors.updateFailed');
      toast.error(message);
    }
  };

  const handleToggleDayBefore = async (id: string, notify_day_before: boolean) => {
    try {
      await updateSchedule.mutateAsync({ id, data: { notify_day_before } });
      toast.success(notify_day_before ? t('schedules.willNotifyDayBefore') : t('schedules.willNotifySameDay'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('errors.updateFailed');
      toast.error(message);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;

    try {
      if (deleteConfirm.type === 'channel') {
        await deleteSetting.mutateAsync(deleteConfirm.id);
        toast.success(t('errors.channelDeleted'));
      } else {
        await deleteSchedule.mutateAsync(deleteConfirm.id);
        toast.success(t('errors.scheduleDeleted'));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('errors.deleteFailed');
      toast.error(message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                {t('channels.title')}
              </CardTitle>
              <CardDescription>
                {t('channels.subtitle')}
              </CardDescription>
            </div>
            <AddChannelDialog onAdd={handleCreateChannel} isLoading={createSetting.isPending} userEmail={userProfile?.email} />
          </div>
        </CardHeader>
        <CardContent>
          {loadingSettings ? (
            <div className="space-y-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : settings?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('channels.noChannels')}</p>
              <p className="text-sm">{t('channels.noChannelsHint')}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {settings?.map((setting) => (
                <ChannelCard
                  key={setting.id}
                  setting={setting}
                  testing={testingId === setting.id}
                  onTest={() => handleTest(setting.id)}
                  onToggle={(enabled) => handleToggleChannel(setting.id, enabled)}
                  onDelete={() => setDeleteConfirm({ type: 'channel', id: setting.id })}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedules */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('schedules.title')}
              </CardTitle>
              <CardDescription>
                {t('schedules.subtitle')}
              </CardDescription>
            </div>
            <AddScheduleDialog
              onAdd={handleCreateSchedule}
              isLoading={createSchedule.isPending}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingSchedules ? (
            <div className="space-y-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : schedules?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('schedules.noSchedules')}</p>
              <p className="text-sm">{t('schedules.noSchedulesHint')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {DAYS.map((day) => {
                const daySchedules = schedules?.filter((s) => s.day_of_week === day.value) || [];
                if (daySchedules.length === 0) return null;
                return daySchedules.map((schedule) => (
                  <ScheduleCard
                    key={schedule.id}
                    schedule={schedule}
                    onToggle={(enabled) => handleToggleSchedule(schedule.id, enabled)}
                    onToggleDayBefore={(notify_day_before) => handleToggleDayBefore(schedule.id, notify_day_before)}
                    onDelete={() => setDeleteConfirm({ type: 'schedule', id: schedule.id })}
                  />
                ));
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirm?.type === 'channel'
                ? t('deleteDialog.deleteChannel')
                : t('deleteDialog.deleteSchedule')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'channel'
                ? t('deleteDialog.channelWarning')
                : t('deleteDialog.scheduleWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSetting.isPending || deleteSchedule.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('deleteDialog.deleting')}
                </>
              ) : (
                tc('delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
