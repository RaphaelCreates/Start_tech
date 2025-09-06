interface BackupData {
  cities: any[];
  lines: { [state: string]: any[] };
  lastUpdate: string;
  version: string;
}

class JsonBackupService {
  private readonly BACKUP_FILE_KEY = 'app_backup_data';
  private readonly VERSION = '1.0.0';

  // Salvar dados no localStorage como "arquivo JSON"
  saveToJson(cities: any[], lines: { [state: string]: any[] }): void {
    try {
      const backupData: BackupData = {
        cities,
        lines,
        lastUpdate: new Date().toISOString(),
        version: this.VERSION
      };

      // Salvar no localStorage (simula arquivo JSON)
      localStorage.setItem(this.BACKUP_FILE_KEY, JSON.stringify(backupData, null, 2));
      
      console.log('📁 Dados salvos no backup JSON:', {
        cities: cities.length,
        linesStates: Object.keys(lines).length,
        totalLines: Object.values(lines).reduce((sum, stateLines) => sum + stateLines.length, 0)
      });
    } catch (error) {
      console.error('❌ Erro ao salvar backup JSON:', error);
    }
  }

  // Carregar dados do localStorage (simula arquivo JSON)
  loadFromJson(): BackupData | null {
    try {
      const stored = localStorage.getItem(this.BACKUP_FILE_KEY);
      if (!stored) {
        console.log('📁 Nenhum backup JSON encontrado');
        return null;
      }

      const backupData: BackupData = JSON.parse(stored);
      
      // Verificar se é uma versão compatível
      if (!backupData.version || !backupData.lastUpdate) {
        console.warn('⚠️ Backup JSON em formato antigo, ignorando');
        return null;
      }

      console.log('📁 Backup JSON carregado:', {
        version: backupData.version,
        lastUpdate: backupData.lastUpdate,
        cities: backupData.cities?.length || 0,
        linesStates: Object.keys(backupData.lines || {}).length
      });

      return backupData;
    } catch (error) {
      console.error('❌ Erro ao carregar backup JSON:', error);
      return null;
    }
  }

  // Obter cidades do backup JSON
  getCitiesFromJson(): any[] | null {
    const backup = this.loadFromJson();
    return backup?.cities || null;
  }

  // Obter linhas de um estado específico do backup JSON
  getLinesFromJson(state: string): any[] | null {
    const backup = this.loadFromJson();
    return backup?.lines?.[state] || null;
  }

  // Verificar se backup JSON existe e é válido
  hasValidBackup(): boolean {
    const backup = this.loadFromJson();
    return backup !== null && 
           backup.cities && 
           backup.cities.length > 0 && 
           backup.lines && 
           Object.keys(backup.lines).length > 0;
  }

  // Obter informações do backup
  getBackupInfo(): { exists: boolean; lastUpdate: string | null; cities: number; states: number } {
    const backup = this.loadFromJson();
    
    if (!backup) {
      return {
        exists: false,
        lastUpdate: null,
        cities: 0,
        states: 0
      };
    }

    return {
      exists: true,
      lastUpdate: backup.lastUpdate,
      cities: backup.cities?.length || 0,
      states: Object.keys(backup.lines || {}).length
    };
  }

  // Exportar backup para download
  exportBackupFile(): void {
    const backup = this.loadFromJson();
    if (!backup) {
      console.error('❌ Nenhum backup para exportar');
      return;
    }

    const dataStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📥 Backup JSON exportado para download');
  }

  // Importar backup de arquivo
  importBackupFile(jsonString: string): boolean {
    try {
      const backupData: BackupData = JSON.parse(jsonString);
      
      // Validar estrutura
      if (!backupData.cities || !backupData.lines) {
        throw new Error('Formato de backup inválido');
      }

      localStorage.setItem(this.BACKUP_FILE_KEY, JSON.stringify(backupData, null, 2));
      console.log('📥 Backup JSON importado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao importar backup JSON:', error);
      return false;
    }
  }

  // Limpar backup JSON
  clearBackup(): void {
    localStorage.removeItem(this.BACKUP_FILE_KEY);
    console.log('🗑️ Backup JSON removido');
  }
}

export const jsonBackupService = new JsonBackupService();
