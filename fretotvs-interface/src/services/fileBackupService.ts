import { promises as fs } from 'fs';
import path from 'path';

interface BackupData {
  cities: any[];
  lines: { [state: string]: any[] };
  lastUpdate: string;
  version: string;
}

class FileBackupService {
  private readonly BACKUP_DIR = path.join(process.cwd(), 'backup');
  private readonly BACKUP_FILE = path.join(this.BACKUP_DIR, 'schedule_backup.json');
  private readonly VERSION = '1.0.0';

  // Garantir que a pasta backup existe
  private async ensureBackupDir(): Promise<void> {
    try {
      await fs.access(this.BACKUP_DIR);
    } catch {
      // Pasta não existe, criar
      await fs.mkdir(this.BACKUP_DIR, { recursive: true });
      console.log('📁 Pasta backup criada:', this.BACKUP_DIR);
    }
  }

  // Salvar dados no arquivo JSON físico
  async saveToFile(cities: any[], lines: { [state: string]: any[] }): Promise<boolean> {
    try {
      await this.ensureBackupDir();

      const backupData: BackupData = {
        cities,
        lines,
        lastUpdate: new Date().toISOString(),
        version: this.VERSION
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      await fs.writeFile(this.BACKUP_FILE, jsonString, 'utf8');
      
      console.log('💾 Backup salvo em arquivo:', {
        file: this.BACKUP_FILE,
        cities: cities.length,
        linesStates: Object.keys(lines).length,
        totalLines: Object.values(lines).reduce((sum, stateLines) => sum + stateLines.length, 0),
        size: `${(jsonString.length / 1024).toFixed(2)} KB`
      });
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar backup em arquivo:', error);
      return false;
    }
  }

  // Carregar dados do arquivo JSON físico
  async loadFromFile(): Promise<BackupData | null> {
    try {
      await fs.access(this.BACKUP_FILE);
      const jsonString = await fs.readFile(this.BACKUP_FILE, 'utf8');
      const backupData: BackupData = JSON.parse(jsonString);
      
      // Verificar se é uma versão compatível
      if (!backupData.version || !backupData.lastUpdate) {
        console.warn('⚠️ Backup em formato antigo, ignorando');
        return null;
      }

      console.log('📁 Backup carregado do arquivo:', {
        file: this.BACKUP_FILE,
        version: backupData.version,
        lastUpdate: backupData.lastUpdate,
        cities: backupData.cities?.length || 0,
        linesStates: Object.keys(backupData.lines || {}).length,
        size: `${(jsonString.length / 1024).toFixed(2)} KB`
      });

      return backupData;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        console.log('📁 Nenhum arquivo de backup encontrado');
      } else {
        console.error('❌ Erro ao carregar backup do arquivo:', error);
      }
      return null;
    }
  }

  // Obter cidades do backup em arquivo
  async getCitiesFromFile(): Promise<any[] | null> {
    const backup = await this.loadFromFile();
    return backup?.cities || null;
  }

  // Obter linhas de um estado específico do backup em arquivo
  async getLinesFromFile(state: string): Promise<any[] | null> {
    const backup = await this.loadFromFile();
    return backup?.lines?.[state] || null;
  }

  // Verificar se backup em arquivo existe e é válido
  async hasValidBackup(): Promise<boolean> {
    try {
      const backup = await this.loadFromFile();
      return backup !== null && 
             backup.cities && 
             backup.cities.length > 0 && 
             backup.lines && 
             Object.keys(backup.lines).length > 0;
    } catch {
      return false;
    }
  }

  // Obter informações do backup em arquivo
  async getBackupInfo(): Promise<{ exists: boolean; lastUpdate: string | null; cities: number; states: number; filePath: string }> {
    const backup = await this.loadFromFile();
    
    if (!backup) {
      return {
        exists: false,
        lastUpdate: null,
        cities: 0,
        states: 0,
        filePath: this.BACKUP_FILE
      };
    }

    return {
      exists: true,
      lastUpdate: backup.lastUpdate,
      cities: backup.cities?.length || 0,
      states: Object.keys(backup.lines || {}).length,
      filePath: this.BACKUP_FILE
    };
  }

  // Exportar backup para download (copia do arquivo existente)
  async exportBackupFile(): Promise<string | null> {
    try {
      const jsonString = await fs.readFile(this.BACKUP_FILE, 'utf8');
      console.log('📥 Backup exportado para download');
      return jsonString;
    } catch (error) {
      console.error('❌ Erro ao exportar backup:', error);
      return null;
    }
  }

  // Importar backup de string JSON
  async importBackupFile(jsonString: string): Promise<boolean> {
    try {
      await this.ensureBackupDir();
      
      const backupData: BackupData = JSON.parse(jsonString);
      
      // Validar estrutura
      if (!backupData.cities || !backupData.lines) {
        throw new Error('Formato de backup inválido');
      }

      await fs.writeFile(this.BACKUP_FILE, JSON.stringify(backupData, null, 2), 'utf8');
      console.log('📥 Backup importado para arquivo com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao importar backup para arquivo:', error);
      return false;
    }
  }

  // Limpar backup em arquivo
  async clearBackup(): Promise<boolean> {
    try {
      await fs.unlink(this.BACKUP_FILE);
      console.log('🗑️ Arquivo de backup removido');
      return true;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        console.log('🗑️ Arquivo de backup já não existe');
        return true;
      }
      console.error('❌ Erro ao remover arquivo de backup:', error);
      return false;
    }
  }

  // Obter caminho do arquivo de backup
  getBackupFilePath(): string {
    return this.BACKUP_FILE;
  }

  // Obter tamanho do arquivo de backup
  async getBackupFileSize(): Promise<string> {
    try {
      const stats = await fs.stat(this.BACKUP_FILE);
      return `${(stats.size / 1024).toFixed(2)} KB`;
    } catch {
      return '0 KB';
    }
  }
}

export const fileBackupService = new FileBackupService();
