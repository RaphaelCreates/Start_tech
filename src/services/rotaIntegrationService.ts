// Service para integrar chamadas da API de rota
import { rotaService } from './rotaService';
import { backendLineStatusService } from './backendLineStatusService'; // NOVO

interface IniciarRotaParams {
  motorista_id: string;
  linha: string;
  prefixo: string;
  capacidade: number;
}

class RotaIntegrationService {

  // Consulta se uma linha tem motorista ativo (usando backend real)
  async consultarStatusLinha(linha: string): Promise<boolean> {
    try {
      // Primeiro tenta consultar no backend
      const temMotorista = await backendLineStatusService.temMotorista(linha);
      console.log(`🎯 [RotaIntegrationService] Motorista na linha ${linha}:`, temMotorista);
      return temMotorista;
    } catch (error) {
      console.error('❌ [RotaIntegrationService] Erro ao consultar status da linha:', error);
      
      // Fallback para API local se backend não disponível
      try {
        console.log(`⚠️ [RotaIntegrationService] Backend indisponível, usando API local para ${linha}`);
        const resultado = await rotaService.consultarStatusLinha(linha);
        return resultado.data.isActive;
      } catch (localError) {
        console.error('❌ [RotaIntegrationService] Erro na API local também:', localError);
        return false;
      }
    }
  }

  // Consulta todas as linhas com motorista ativo (usando backend + local)
  async consultarLinhasAtivas(): Promise<string[]> {
    try {
      const linhasComMotorista: string[] = [];

      // Consultar backend para linhas conhecidas
      const linhasConhecidas = ['santana', 'barrafunda'];
      
      for (const linha of linhasConhecidas) {
        try {
          const temMotorista = await backendLineStatusService.temMotorista(linha);
          if (temMotorista) {
            linhasComMotorista.push(linha);
          }
        } catch (error) {
          console.warn(`⚠️ [RotaIntegrationService] Erro ao consultar ${linha} no backend:`, error);
        }
      }

      // Fallback: consultar API local
      try {
        const resultadoLocal = await rotaService.consultarTodasLinhas();
        const linhasLocais = resultadoLocal.data.linhas
          .filter(linha => linha.isActive)
          .map(linha => linha.linha);
        
        // Combinar resultados sem duplicatas
        linhasLocais.forEach(linha => {
          if (!linhasComMotorista.includes(linha)) {
            linhasComMotorista.push(linha);
          }
        });
      } catch (error) {
        console.warn('⚠️ [RotaIntegrationService] Erro ao consultar API local:', error);
      }

      return linhasComMotorista;
    } catch (error) {
      console.error('❌ [RotaIntegrationService] Erro ao consultar linhas ativas:', error);
      return [];
    }
  }

  // Inicia uma rota via API e integra com o sistema local
  async iniciarRota(params: IniciarRotaParams): Promise<boolean> {
    try {
      console.log('🚌 [RotaIntegrationService] Iniciando rota via API:', params);

      // 1. Chama a API local
      const resultado = await rotaService.iniciarRota(params);
      console.log('📡 [RotaIntegrationService] Resposta da API local:', resultado);

      if (resultado.success) {
        console.log('✅ [RotaIntegrationService] Rota iniciada na API local, integrando com backend...');
        
        // 2. Tentar iniciar rota no backend também
        try {
          const backendResult = await backendLineStatusService.iniciarRotaPorNome(params.linha);
          if (backendResult) {
            console.log('✅ [RotaIntegrationService] Rota iniciada no backend:', backendResult);
          } else {
            console.warn('⚠️ [RotaIntegrationService] Linha não encontrada no backend, continuando apenas local');
          }
        } catch (backendError) {
          console.warn('⚠️ [RotaIntegrationService] Erro no backend, continuando apenas local:', backendError);
        }

        // No MQTT notification needed

        return true;
      } else {
        throw new Error('Falha na resposta da API local');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ [RotaIntegrationService] Erro ao iniciar rota:', errorMessage);
      


      return false;
    }
  }

  // Método de conveniência para ativar Santana via API
  async ativarSantanaViaAPI(capacidade: number = 50): Promise<boolean> {
    return this.iniciarRota({
      motorista_id: 'API_001',
      linha: 'santana',
      prefixo: 'API_BUS',
      capacidade
    });
  }

  // NOVOS MÉTODOS PARA BACKEND

  // Iniciar rota no backend (motorista começa)
  async iniciarRotaBackend(linha: string): Promise<boolean> {
    try {
      const result = await backendLineStatusService.iniciarRotaPorNome(linha);
      return result !== null;
    } catch (error) {
      console.error(`❌ [RotaIntegrationService] Erro ao iniciar rota ${linha} no backend:`, error);
      return false;
    }
  }

  // Finalizar rota no backend (motorista termina)
  async finalizarRotaBackend(linha: string): Promise<boolean> {
    try {
      const result = await backendLineStatusService.finalizarRotaPorNome(linha);
      return result !== null;
    } catch (error) {
      console.error(`❌ [RotaIntegrationService] Erro ao finalizar rota ${linha} no backend:`, error);
      return false;
    }
  }

  // Sincronizar estado entre backend e local
  async sincronizarEstado(linha: string): Promise<void> {
    try {
      const temMotorista = await backendLineStatusService.temMotorista(linha);
      const localStatus = await rotaService.consultarStatusLinha(linha);

      console.log(`🔄 [RotaIntegrationService] Sincronizando ${linha}:`, {
        backend: temMotorista,
        local: localStatus.data.isActive
      });

      // Se backend tem motorista mas local não está ativo, ativar local
      if (temMotorista && !localStatus.data.isActive) {
        console.log(`🔄 [RotaIntegrationService] Ativando ${linha} localmente para sincronizar com backend`);
      }
    } catch (error) {
      console.error(`❌ [RotaIntegrationService] Erro ao sincronizar estado de ${linha}:`, error);
    }
  }
}

// Singleton instance
export const rotaIntegrationService = new RotaIntegrationService();
