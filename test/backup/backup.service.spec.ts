import { BackupService } from '../../src/backup/backup.service';

describe('BackupService', () => {
  let service: BackupService;

  beforeEach(() => {
    service = new BackupService();
  });

  it('should run hourly backup', async () => {
    const spy = jest.spyOn(service as any, 'runBackup').mockResolvedValue(true);
    await service.hourlyBackup();
    expect(spy).toHaveBeenCalledWith('hourly');
  });

  it('should run daily backup', async () => {
    const spy = jest.spyOn(service as any, 'runBackup').mockResolvedValue(true);
    await service.dailyBackup();
    expect(spy).toHaveBeenCalledWith('daily');
  });
});
