import { NextRequest, NextResponse } from 'next/server';
import { fileBackupService } from '../../../services/fileBackupService';

export async function GET() {
  try {
    const backupData = await fileBackupService.loadFromFile();
    const backupInfo = await fileBackupService.getBackupInfo();
    
    return NextResponse.json({
      success: true,
      data: backupData,
      info: backupInfo
    });
  } catch (error) {
    console.error('Erro ao carregar backup:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar backup' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cities, lines } = await request.json();
    
    if (!cities || !lines) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    const success = await fileBackupService.saveToFile(cities, lines);
    
    if (success) {
      const backupInfo = await fileBackupService.getBackupInfo();
      return NextResponse.json({
        success: true,
        message: 'Backup salvo com sucesso',
        info: backupInfo
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar backup' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao salvar backup:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar backup' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const success = await fileBackupService.clearBackup();
    
    return NextResponse.json({
      success,
      message: success ? 'Backup removido com sucesso' : 'Erro ao remover backup'
    });
  } catch (error) {
    console.error('Erro ao remover backup:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao remover backup' },
      { status: 500 }
    );
  }
}
