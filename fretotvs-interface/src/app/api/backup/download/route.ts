import { NextResponse } from 'next/server';
import { fileBackupService } from '../../../../services/fileBackupService';

export async function GET() {
  try {
    const backupData = await fileBackupService.exportBackupFile();
    
    if (!backupData) {
      return NextResponse.json(
        { success: false, error: 'Nenhum backup encontrado' },
        { status: 404 }
      );
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `schedule_backup_${timestamp}.json`;

    return new NextResponse(backupData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Erro ao exportar backup:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao exportar backup' },
      { status: 500 }
    );
  }
}
