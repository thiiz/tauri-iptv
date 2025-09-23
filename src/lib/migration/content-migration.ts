import { indexedDBService } from '../indexeddb-service';
import { useProfileContentStore } from '../stores/ProfileContentStore';
import { useIPTVStore } from '../store';
import { useState } from 'react';

/**
 * Migração para mover conteúdo do sistema antigo para o novo sistema por perfil
 * Executar apenas uma vez durante a transição
 */
export class ContentMigration {
  private static instance: ContentMigration;

  static getInstance(): ContentMigration {
    if (!ContentMigration.instance) {
      ContentMigration.instance = new ContentMigration();
    }
    return ContentMigration.instance;
  }

  /**
   * Verifica se a migração é necessária
   */
  async isMigrationNeeded(): Promise<boolean> {
    try {
      // Verificar se há conteúdo no sistema antigo (sem perfil associado)
      const oldChannels = await indexedDBService.getChannels();
      const oldMovies = await indexedDBService.getMovies();
      const oldShows = await indexedDBService.getShows();

      return (
        oldChannels.length > 0 || oldMovies.length > 0 || oldShows.length > 0
      );
    } catch (error) {
      console.error('Erro ao verificar necessidade de migração:', error);
      return false;
    }
  }

  /**
   * Executa a migração do conteúdo
   */
  async migrateContent(): Promise<{ success: boolean; message: string }> {
    try {
      const store = useIPTVStore.getState();
      const { currentProfileId } = store;

      if (!currentProfileId) {
        return {
          success: false,
          message: 'Nenhum perfil ativo encontrado'
        };
      }

      console.log(
        'Iniciando migração de conteúdo para o perfil:',
        currentProfileId
      );

      // Obter conteúdo existente (sem filtro de perfil)
      const [channels, movies, shows] = await Promise.all([
        indexedDBService.getChannels(),
        indexedDBService.getMovies(),
        indexedDBService.getShows()
      ]);

      console.log(
        `Encontrado: ${channels.length} canais, ${movies.length} filmes, ${shows.length} séries`
      );

      // Se não houver conteúdo, não fazer nada
      if (channels.length === 0 && movies.length === 0 && shows.length === 0) {
        return {
          success: true,
          message: 'Nenhum conteúdo para migrar'
        };
      }

      // Salvar conteúdo com o perfil atual
      await Promise.all([
        channels.length > 0
          ? indexedDBService.saveChannels(channels, currentProfileId)
          : Promise.resolve(),
        movies.length > 0
          ? indexedDBService.saveMovies(movies, currentProfileId)
          : Promise.resolve(),
        shows.length > 0
          ? indexedDBService.saveShows(shows, currentProfileId)
          : Promise.resolve()
      ]);

      console.log(
        'Conteúdo migrado com sucesso para o perfil:',
        currentProfileId
      );

      // Atualizar o cache do ProfileContentStore
      const contentStore = useProfileContentStore.getState();
      await Promise.all([
        channels.length > 0
          ? contentStore.loadChannels(currentProfileId)
          : Promise.resolve(),
        movies.length > 0
          ? contentStore.loadMovies(currentProfileId)
          : Promise.resolve(),
        shows.length > 0
          ? contentStore.loadShows(currentProfileId)
          : Promise.resolve()
      ]);

      return {
        success: true,
        message: `Migração concluída: ${channels.length} canais, ${movies.length} filmes, ${shows.length} séries`
      };
    } catch (error) {
      console.error('Erro durante a migração:', error);
      return {
        success: false,
        message: `Erro durante a migração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Limpa o conteúdo antigo após a migração bem-sucedida
   * Use com cuidado - apenas após confirmar que a migração funcionou
   */
  async cleanupOldContent(): Promise<void> {
    try {
      console.log('Limpando conteúdo antigo...');

      // Obter todos os registros antigos (sem perfilId)
      const db = await indexedDBService.ensureDB();
      if (!db) return;

      // Limpar apenas registros que não têm profileId
      const stores = ['channels', 'movies', 'shows'] as const;

      for (const storeName of stores) {
        const tx = db.transaction(storeName, 'readwrite');
        const allRecords = await tx.store.getAll();

        // Deletar apenas registros sem profileId
        for (const record of allRecords) {
          if (!record.profileId) {
            await tx.store.delete(record.id);
          }
        }

        await tx.done;
      }

      console.log('Conteúdo antigo limpo com sucesso');
    } catch (error) {
      console.error('Erro ao limpar conteúdo antigo:', error);
      throw error;
    }
  }

  /**
   * Migração completa com verificação e limpeza
   */
  async performFullMigration(): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar se é necessário
      const needed = await this.isMigrationNeeded();
      if (!needed) {
        return {
          success: true,
          message: 'Migração não necessária'
        };
      }

      // Executar migração
      const result = await this.migrateContent();
      if (!result.success) {
        return result;
      }

      // Opcional: limpar conteúdo antigo
      // Descomente a linha abaixo se quiser limpar automaticamente
      // await this.cleanupOldContent();

      return {
        success: true,
        message:
          result.message + ' (contenção antiga preservada para segurança)'
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro na migração completa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
}

// Exportar instância singleton
export const contentMigration = ContentMigration.getInstance();

/**
 * Hook para facilitar o uso da migração
 */
export function useContentMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const performMigration = async () => {
    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const result = await contentMigration.performFullMigration();
      setMigrationResult(result);
    } catch (error) {
      setMigrationResult({
        success: false,
        message: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const checkIfNeeded = async () => {
    return await contentMigration.isMigrationNeeded();
  };

  return {
    isMigrating,
    migrationResult,
    performMigration,
    checkIfNeeded
  };
}
