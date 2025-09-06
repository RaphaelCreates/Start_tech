interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private memoryCache = new Map<string, CacheItem<any>>();
  private readonly STORAGE_PREFIX = 'app_cache_';
  private readonly BACKUP_KEY = 'cache_backup';

  // Salvar no localStorage
  private saveToStorage<T>(key: string, item: CacheItem<T>): void {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${key}`;
      localStorage.setItem(storageKey, JSON.stringify(item));
      console.log(`💾 Dados salvos no localStorage: ${key}`);
      
      // Também salvar um backup completo
      this.saveBackup();
    } catch (error) {
      console.warn('⚠️ Erro ao salvar no localStorage:', error);
    }
  }

  // Carregar do localStorage
  private loadFromStorage<T>(key: string): CacheItem<T> | null {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${key}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const item = JSON.parse(stored) as CacheItem<T>;
        console.log(`📖 Dados carregados do localStorage: ${key}`);
        return item;
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar do localStorage:', error);
    }
    return null;
  }

  // Salvar backup completo dos dados
  private saveBackup(): void {
    try {
      const backupData: Record<string, any> = {};
      
      // Incluir dados da memória
      this.memoryCache.forEach((value, key) => {
        backupData[key] = value;
      });
      
      // Incluir dados do localStorage que não estão na memória
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey && storageKey.startsWith(this.STORAGE_PREFIX)) {
          const key = storageKey.replace(this.STORAGE_PREFIX, '');
          if (!backupData[key]) {
            try {
              const stored = localStorage.getItem(storageKey);
              if (stored) {
                backupData[key] = JSON.parse(stored);
              }
            } catch (error) {
              console.warn(`Erro ao incluir ${key} no backup:`, error);
            }
          }
        }
      }
      
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backupData));
    } catch (error) {
      console.warn('⚠️ Erro ao salvar backup:', error);
    }
  }

  // Carregar backup completo
  private loadBackup(): void {
    try {
      const backup = localStorage.getItem(this.BACKUP_KEY);
      if (backup) {
        const backupData = JSON.parse(backup);
        Object.entries(backupData).forEach(([key, item]) => {
          const cacheItem = item as CacheItem<any>;
          this.memoryCache.set(key, cacheItem);
        });
        console.log('📥 Backup carregado na memória');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar backup:', error);
    }
  }

  // Inicializar cache (carregar dados persistidos)
  private initialize(): void {
    this.loadBackup();
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    // Salvar na memória
    this.memoryCache.set(key, item);
    
    // Persistir no localStorage
    this.saveToStorage(key, item);
    
    console.log(`✅ Cache definido para '${key}' com TTL de ${ttl}ms (persistido)`);
  }

  get<T>(key: string): T | null {
    // Se não inicializado, carregar dados persistidos
    if (this.memoryCache.size === 0) {
      this.initialize();
    }

    // Primeiro tentar memória
    let item = this.memoryCache.get(key) as CacheItem<T> | undefined;
    
    // Se não estiver na memória, tentar localStorage
    if (!item) {
      const loadedItem = this.loadFromStorage<T>(key);
      if (loadedItem) {
        item = loadedItem;
        // Restaurar na memória
        this.memoryCache.set(key, item);
      }
    }

    if (!item) {
      console.log(`❌ Cache miss para '${key}'`);
      return null;
    }

    const now = Date.now();
    const isExpired = now - item.timestamp > item.ttl;

    if (!isExpired) {
      console.log(`✅ Cache hit para '${key}' (válido, persistido)`);
      return item.data;
    }

    console.log(`⏰ Cache para '${key}' expirado, mas mantendo dados persistidos`);
    return null;
  }

  // Método para acessar dados expirados (stale) - ESSENCIAL para fallback quando API cai
  getStale<T>(key: string): T | null {
    // Se não inicializado, carregar dados persistidos
    if (this.memoryCache.size === 0) {
      this.initialize();
    }

    // Primeiro tentar memória
    let item = this.memoryCache.get(key) as CacheItem<T> | undefined;
    
    // Se não estiver na memória, tentar localStorage
    if (!item) {
      const loadedItem = this.loadFromStorage<T>(key);
      if (loadedItem) {
        item = loadedItem;
        // Restaurar na memória
        this.memoryCache.set(key, item);
      }
    }

    if (!item) {
      console.log(`❌ Nenhum dado (stale/persistido) encontrado para '${key}'`);
      return null;
    }

    const age = Date.now() - item.timestamp;
    console.log(`🔄 Retornando dados stale para '${key}' (idade: ${Math.round(age/1000)}s, persistidos)`);
    return item.data;
  }

  has(key: string): boolean {
    // Se não inicializado, carregar dados persistidos
    if (this.memoryCache.size === 0) {
      this.initialize();
    }

    // Verificar memória
    if (this.memoryCache.has(key)) {
      return true;
    }
    
    // Verificar localStorage
    const storageKey = `${this.STORAGE_PREFIX}${key}`;
    return localStorage.getItem(storageKey) !== null;
  }

  delete(key: string): void {
    // Remover da memória
    this.memoryCache.delete(key);
    
    // Remover do localStorage
    const storageKey = `${this.STORAGE_PREFIX}${key}`;
    localStorage.removeItem(storageKey);
    
    // Atualizar backup
    this.saveBackup();
    
    console.log(`🗑️ Cache removido para '${key}' (memória e storage)`);
  }

  clear(): void {
    // Limpar memória
    this.memoryCache.clear();
    
    // Limpar localStorage (apenas itens do cache)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(this.STORAGE_PREFIX) || key === this.BACKUP_KEY)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cache completamente limpo (memória e storage)`);
  }

  // Método para verificar status do cache
  getCacheStatus(): { [key: string]: { timestamp: number; ttl: number; timeLeft: number; isPersisted: boolean } } {
    // Se não inicializado, carregar dados persistidos
    if (this.memoryCache.size === 0) {
      this.initialize();
    }

    const status: { [key: string]: { timestamp: number; ttl: number; timeLeft: number; isPersisted: boolean } } = {};
    
    this.memoryCache.forEach((item, key) => {
      const now = Date.now();
      const timeLeft = Math.max(0, item.ttl - (now - item.timestamp));
      const storageKey = `${this.STORAGE_PREFIX}${key}`;
      const isPersisted = localStorage.getItem(storageKey) !== null;
      
      status[key] = {
        timestamp: item.timestamp,
        ttl: item.ttl,
        timeLeft,
        isPersisted
      };
    });
    
    return status;
  }

  // Método para exportar todos os dados como JSON (para download)
  exportToJson(): string {
    const exportData: Record<string, any> = {};
    
    // Se não inicializado, carregar dados persistidos
    if (this.memoryCache.size === 0) {
      this.initialize();
    }
    
    // Exportar dados da memória
    this.memoryCache.forEach((value, key) => {
      exportData[key] = {
        ...value,
        dataAge: Date.now() - value.timestamp,
        isExpired: Date.now() - value.timestamp > value.ttl
      };
    });
    
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      cacheData: exportData
    }, null, 2);
  }
}

export const cacheService = new CacheService();
