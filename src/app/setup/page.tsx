'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIPTVStore } from '@/lib/store';
import { tauriIPTVService } from '@/lib/tauri-iptv-service';
import type { XtreamConfig } from '@/types/iptv';
import { Loader2, Tv, Wifi, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SetupPage() {
  const router = useRouter();
  const { setConfig, setAuthenticated, config } = useIPTVStore();

  const [formData, setFormData] = useState<XtreamConfig>({
    url: config?.url || '',
    username: config?.username || '',
    password: config?.password || '',
    preferredFormat: config?.preferredFormat || 'm3u8',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (field: keyof XtreamConfig, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setConnectionStatus('idle');
  };

  const testConnection = async () => {
    if (!formData.url || !formData.username || !formData.password) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsTestingConnection(true);
    setError(null);

    try {
      await tauriIPTVService.initialize(formData);
      const isConnected = await tauriIPTVService.testConnection();

      if (isConnected) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setError('Falha na conexão. Verifique suas credenciais e URL do servidor.');
      }
    } catch (err) {
      setConnectionStatus('error');
      setError('Erro ao testar conexão: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.url || !formData.username || !formData.password) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await tauriIPTVService.initialize(formData);
      const isConnected = await tauriIPTVService.testConnection();

      if (!isConnected) {
        throw new Error('Falha na autenticação');
      }

      setConfig(formData);
      setAuthenticated(true);
      router.push('/dashboard');
    } catch (err) {
      setError('Erro ao configurar: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Tv className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">IPTV Desktop</CardTitle>
          <CardDescription>
            Configure sua conexão Xtream para começar
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL do Servidor *</Label>
              <Input
                id="url"
                type="url"
                placeholder="http://exemplo.com:8080"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Nome de Usuário *</Label>
              <Input
                id="username"
                type="text"
                placeholder="seu_usuario"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                placeholder="sua_senha"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Formato Preferido</Label>
              <Select
                value={formData.preferredFormat}
                onValueChange={(value) => handleInputChange('preferredFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m3u8">M3U8 (HLS)</SelectItem>
                  <SelectItem value="ts">TS (Transport Stream)</SelectItem>
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="mkv">MKV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {connectionStatus === 'success' && (
              <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                <Wifi className="h-4 w-4" />
                <AlertDescription>Conexão testada com sucesso!</AlertDescription>
              </Alert>
            )}

            {connectionStatus === 'error' && (
              <Alert variant="destructive">
                <WifiOff className="h-4 w-4" />
                <AlertDescription>Falha no teste de conexão</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={isTestingConnection || isLoading}
                className="flex-1"
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 h-4 w-4" />
                    Testar Conexão
                  </>
                )}
              </Button>

              <Button
                type="submit"
                disabled={isLoading || isTestingConnection}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}