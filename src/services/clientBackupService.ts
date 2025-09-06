interface BackupInfo {
  exists: boolean;
  lastUpdate: string | null;
  cities: number;
  states: number;
  filePath: string;
}

interface BackupData {
  cities: any[];
  lines: { [state: string]: any[] };
  lastUpdate: string;
  version: string;
}

class ClientBackupService {
  private readonly API_BASE = '/api/backup';

  // Salvar dados no arquivo de backup (via API)
  async saveToFile(cities: any[], lines: { [state: string]: any[] }): Promise<boolean> {
    try {
      console.log('💾 Salvando backup no arquivo via API...');
      
      const response = await fetch(this.API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cities, lines }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Backup salvo no arquivo:', result.info);
        return true;
      } else {
        console.error('❌ Erro ao salvar backup:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na requisição de backup:', error);
      return false;
    }
  }

  // Carregar dados do arquivo de backup (via API)
  async loadFromFile(): Promise<BackupData | null> {
    try {
      console.log('📁 Carregando backup do arquivo via API...');
      
      const response = await fetch(this.API_BASE);
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('✅ Backup carregado do arquivo:', result.info);
        return result.data;
      } else {
        console.log('📁 Nenhum backup encontrado no arquivo');
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar backup:', error);
      return null;
    }
  }

  // Obter informações do backup
  async getBackupInfo(): Promise<BackupInfo> {
    try {
      const response = await fetch(this.API_BASE);
      const result = await response.json();
      
      if (result.success) {
        return result.info;
      } else {
        return {
          exists: false,
          lastUpdate: null,
          cities: 0,
          states: 0,
          filePath: 'N/A'
        };
      }
    } catch (error) {
      console.error('❌ Erro ao obter info do backup:', error);
      return {
        exists: false,
        lastUpdate: null,
        cities: 0,
        states: 0,
        filePath: 'N/A'
      };
    }
  }

  // Obter cidades do backup
  async getCitiesFromFile(): Promise<any[] | null> {
    const backup = await this.loadFromFile();
    return backup?.cities || null;
  }

  // Obter linhas de um estado específico do backup
  async getLinesFromFile(state: string): Promise<any[] | null> {
    const backup = await this.loadFromFile();
    return backup?.lines?.[state] || null;
  }

  // Verificar se backup existe e é válido
  async hasValidBackup(): Promise<boolean> {
    const info = await this.getBackupInfo();
    return info.exists && info.cities > 0 && info.states > 0;
  }

  // Download do arquivo de backup
  async downloadBackupFile(): Promise<void> {
    try {
      console.log('📥 Fazendo download do backup...');
      
      const response = await fetch(`${this.API_BASE}/download`);
      
      if (!response.ok) {
        throw new Error('Erro ao baixar backup');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Extrair nome do arquivo do header ou usar padrão
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'schedule_backup.json';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Backup baixado:', filename);
    } catch (error) {
      console.error('❌ Erro ao baixar backup:', error);
    }
  }

  // Limpar arquivo de backup
  async clearBackup(): Promise<boolean> {
    try {
      console.log('🗑️ Removendo arquivo de backup...');
      
      const response = await fetch(this.API_BASE, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Backup removido com sucesso');
        return true;
      } else {
        console.error('❌ Erro ao remover backup:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na requisição de remoção:', error);
      return false;
    }
  }
}

export const clientBackupService = new ClientBackupService();
