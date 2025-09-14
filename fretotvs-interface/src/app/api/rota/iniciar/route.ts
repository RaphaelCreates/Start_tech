import { NextRequest, NextResponse } from 'next/server';

// Estado global das linhas ativas (em produção, usar um banco de dados)
let linhasAtivas: Record<string, {
  isActive: boolean;
  motorista_id: string;
  prefixo: string;
  capacidade: number;
  assentosOcupados: number;
  timestamp: string;
}> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🚌 POST /rota/iniciar recebido:', body);
    
    // Validação básica dos campos obrigatórios
    const { motorista_id, linha, prefixo, capacidade } = body;
    
    if (!motorista_id || !linha || !prefixo || !capacidade) {
      return NextResponse.json(
        { 
          error: 'Campos obrigatórios: motorista_id, linha, prefixo, capacidade',
          received: body 
        },
        { status: 400 }
      );
    }

    // Validação de capacidade
    if (typeof capacidade !== 'number' || capacidade <= 0 || capacidade > 100) {
      return NextResponse.json(
        { 
          error: 'Capacidade deve ser um número entre 1 e 100',
          received: capacidade 
        },
        { status: 400 }
      );
    }

    // Validação básica de linha
    const linhasValidas = ['l_santana', 'l_barrafunda', 'santana', 'barrafunda'];
    const linhaNormalizada = linha.toLowerCase().trim();
    
    if (!linhasValidas.some(l => linhaNormalizada.includes(l.toLowerCase()) || l.toLowerCase().includes(linhaNormalizada))) {
      console.warn(`⚠️ Linha não reconhecida: ${linha}, mas processando mesmo assim...`);
    }

    // Verificar se a linha já está ativa
    const linhaJaAtiva = linhasAtivas[linhaNormalizada]?.isActive || false;
    
    // Atualizar estado da linha
    linhasAtivas[linhaNormalizada] = {
      isActive: true,
      motorista_id,
      prefixo,
      capacidade,
      assentosOcupados: linhaJaAtiva ? linhasAtivas[linhaNormalizada].assentosOcupados : 1, // Se já ativa, mantém ocupação
      timestamp: new Date().toISOString()
    };

    // Simula o processamento e resposta
    const response = {
      success: true,
      message: linhaJaAtiva ? 'Rota atualizada com sucesso' : 'Rota iniciada com sucesso',
      data: {
        motorista_id,
        linha: linhaNormalizada,
        prefixo,
        capacidade,
        timestamp: new Date().toISOString(),
        status: 'ativa',
        wasAlreadyActive: linhaJaAtiva,
        assentosOcupados: linhasAtivas[linhaNormalizada].assentosOcupados,
        assentosDisponiveis: capacidade - linhasAtivas[linhaNormalizada].assentosOcupados
      }
    };

    console.log('✅ Rota processada:', response);

    // Retorna resposta de sucesso
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ Erro ao processar /rota/iniciar:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para consultar status das linhas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const linha = searchParams.get('linha');

    if (linha) {
      // Consulta de linha específica
      const linhaNormalizada = linha.toLowerCase().trim();
      const statusLinha = linhasAtivas[linhaNormalizada];

      if (statusLinha) {
        return NextResponse.json({
          success: true,
          data: {
            linha: linhaNormalizada,
            isActive: statusLinha.isActive,
            motorista_id: statusLinha.motorista_id,
            prefixo: statusLinha.prefixo,
            capacidade: statusLinha.capacidade,
            assentosOcupados: statusLinha.assentosOcupados,
            assentosDisponiveis: statusLinha.capacidade - statusLinha.assentosOcupados,
            timestamp: statusLinha.timestamp
          }
        });
      } else {
        return NextResponse.json({
          success: true,
          data: {
            linha: linhaNormalizada,
            isActive: false,
            message: 'Linha não encontrada ou inativa'
          }
        });
      }
    } else {
      // Consulta de todas as linhas
      const todasLinhas = Object.keys(linhasAtivas).map(linha => ({
        linha,
        isActive: linhasAtivas[linha].isActive,
        motorista_id: linhasAtivas[linha].motorista_id,
        prefixo: linhasAtivas[linha].prefixo,
        capacidade: linhasAtivas[linha].capacidade,
        assentosOcupados: linhasAtivas[linha].assentosOcupados,
        assentosDisponiveis: linhasAtivas[linha].capacidade - linhasAtivas[linha].assentosOcupados,
        timestamp: linhasAtivas[linha].timestamp
      }));

      return NextResponse.json({
        success: true,
        data: {
          totalLinhasAtivas: todasLinhas.filter(l => l.isActive).length,
          linhas: todasLinhas
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro ao consultar status das linhas:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
