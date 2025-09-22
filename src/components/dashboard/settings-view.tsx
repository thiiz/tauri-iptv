'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useIPTVStore } from '@/lib/store';
import {
  LogOut,
  Monitor,
  RotateCcw,
  Save,
  Settings,
  Trash2,
  User,
  Volume2,
  Wifi
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import PageContainer from '../layout/page-container';

export function SettingsView() {
  const router = useRouter();
  const {
    settings,
    updateSettings,
    userProfile,
    serverInfo,
    clearData,
    config
  } = useIPTVStore();

  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalSettings(settings);
    setHasChanges(false);
  };

  const handleLogout = () => {
    clearData();
    router.push('/dashboard/profiles');
  };

  const handleClearCache = () => {
    // In a real app, this would clear cached data
    alert('Cache limpo com sucesso!');
  };

  return (
    <PageContainer scrollable>
      <div className='flex flex-1 flex-col'>
        <div className='border-b p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='flex items-center gap-2 text-3xl font-bold tracking-tight'>
                <Settings className='h-8 w-8' />
                Configurações
              </h1>
              <p className='text-muted-foreground'>
                Gerencie suas preferências e configurações do aplicativo
              </p>
            </div>

            {hasChanges && (
              <div className='flex gap-2'>
                <Button variant='outline' onClick={handleReset}>
                  <RotateCcw className='mr-2 h-4 w-4' />
                  Desfazer
                </Button>
                <Button onClick={handleSave}>
                  <Save className='mr-2 h-4 w-4' />
                  Salvar
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className='flex-1 space-y-6 overflow-auto p-6'>
          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5' />
                Informações da Conta
              </CardTitle>
              <CardDescription>Detalhes da sua conta IPTV</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {userProfile && (
                <div className='grid gap-4 md:grid-cols-2'>
                  <div>
                    <Label>Nome de Usuário</Label>
                    <Input value={userProfile.username} disabled />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      value={userProfile.email || 'Não informado'}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Data de Expiração</Label>
                    <Input
                      value={new Date(userProfile.expDate).toLocaleDateString(
                        'pt-BR'
                      )}
                      disabled
                    />
                  </div>
                  <div>
                    <Label>Conexões Máximas</Label>
                    <Input value={userProfile.maxConnections} disabled />
                  </div>
                </div>
              )}

              {config && (
                <div className='mt-4'>
                  <Label>Servidor</Label>
                  <Input value={config.url} disabled />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Monitor className='h-5 w-5' />
                Aparência
              </CardTitle>
              <CardDescription>
                Personalize a aparência do aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label>Tema</Label>
                  <p className='text-muted-foreground text-sm'>
                    Escolha entre claro, escuro ou automático
                  </p>
                </div>
                <Select
                  value={localSettings.theme}
                  onValueChange={(value: 'light' | 'dark' | 'system') =>
                    handleSettingChange('theme', value)
                  }
                >
                  <SelectTrigger className='w-32'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='light'>Claro</SelectItem>
                    <SelectItem value='dark'>Escuro</SelectItem>
                    <SelectItem value='system'>Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Playback */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Volume2 className='h-5 w-5' />
                Reprodução
              </CardTitle>
              <CardDescription>
                Configurações de reprodução de mídia
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label>Reprodução Automática</Label>
                  <p className='text-muted-foreground text-sm'>
                    Iniciar reprodução automaticamente ao selecionar conteúdo
                  </p>
                </div>
                <Switch
                  checked={localSettings.autoplay}
                  onCheckedChange={(checked) =>
                    handleSettingChange('autoplay', checked)
                  }
                />
              </div>

              <Separator />

              <div className='flex items-center justify-between'>
                <div>
                  <Label>Qualidade Padrão</Label>
                  <p className='text-muted-foreground text-sm'>
                    Formato de stream preferido
                  </p>
                </div>
                <Select
                  value={localSettings.defaultQuality}
                  onValueChange={(value) =>
                    handleSettingChange('defaultQuality', value)
                  }
                >
                  <SelectTrigger className='w-32'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='m3u8'>M3U8</SelectItem>
                    <SelectItem value='ts'>TS</SelectItem>
                    <SelectItem value='mp4'>MP4</SelectItem>
                    <SelectItem value='mkv'>MKV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* System */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Monitor className='h-5 w-5' />
                Sistema
              </CardTitle>
              <CardDescription>
                Configurações do sistema e comportamento da janela
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label>Sempre no Topo</Label>
                  <p className='text-muted-foreground text-sm'>
                    Manter janela sempre visível
                  </p>
                </div>
                <Switch
                  checked={localSettings.alwaysOnTop}
                  onCheckedChange={(checked) =>
                    handleSettingChange('alwaysOnTop', checked)
                  }
                />
              </div>

              <Separator />

              <div className='flex items-center justify-between'>
                <div>
                  <Label>Minimizar para Bandeja</Label>
                  <p className='text-muted-foreground text-sm'>
                    Minimizar para a bandeja do sistema ao fechar
                  </p>
                </div>
                <Switch
                  checked={localSettings.minimizeToTray}
                  onCheckedChange={(checked) =>
                    handleSettingChange('minimizeToTray', checked)
                  }
                />
              </div>

              <Separator />

              <div className='flex items-center justify-between'>
                <div>
                  <Label>Iniciar com o Sistema</Label>
                  <p className='text-muted-foreground text-sm'>
                    Abrir automaticamente ao iniciar o computador
                  </p>
                </div>
                <Switch
                  checked={localSettings.startWithSystem}
                  onCheckedChange={(checked) =>
                    handleSettingChange('startWithSystem', checked)
                  }
                />
              </div>

              <Separator />

              <div className='flex items-center justify-between'>
                <div>
                  <Label>Notificações</Label>
                  <p className='text-muted-foreground text-sm'>
                    Receber notificações do sistema
                  </p>
                </div>
                <Switch
                  checked={localSettings.enableNotifications}
                  onCheckedChange={(checked) =>
                    handleSettingChange('enableNotifications', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Storage */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Wifi className='h-5 w-5' />
                Armazenamento
              </CardTitle>
              <CardDescription>Gerenciar cache e dados locais</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label>Tamanho do Cache (MB)</Label>
                  <p className='text-muted-foreground text-sm'>
                    Limite de armazenamento para cache local
                  </p>
                </div>
                <Input
                  type='number'
                  value={localSettings.cacheSize}
                  onChange={(e) =>
                    handleSettingChange('cacheSize', parseInt(e.target.value))
                  }
                  className='w-24'
                  min='100'
                  max='2000'
                />
              </div>

              <Separator />

              <div className='flex items-center justify-between'>
                <div>
                  <Label>Limpar Cache</Label>
                  <p className='text-muted-foreground text-sm'>
                    Remove todos os dados em cache
                  </p>
                </div>
                <Button variant='outline' onClick={handleClearCache}>
                  <Trash2 className='mr-2 h-4 w-4' />
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className='border-red-200 dark:border-red-800'>
            <CardHeader>
              <CardTitle className='text-red-600 dark:text-red-400'>
                Zona de Perigo
              </CardTitle>
              <CardDescription>
                Ações irreversíveis que afetam sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className='mb-4'>
                <AlertDescription>
                  Fazer logout irá remover todas as configurações e dados
                  locais.
                </AlertDescription>
              </Alert>

              <Button variant='destructive' onClick={handleLogout}>
                <LogOut className='mr-2 h-4 w-4' />
                Fazer Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
