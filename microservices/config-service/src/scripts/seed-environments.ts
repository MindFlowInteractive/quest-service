import { AppDataSource } from '../config/orm-config';
import { Environment } from '../entities';

async function seed() {
  try {
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(Environment);

    const envs = [
      { name: 'development', displayName: 'Development', description: 'Development environment' },
      { name: 'staging', displayName: 'Staging', description: 'Staging environment' },
      { name: 'production', displayName: 'Production', description: 'Production environment' },
    ];

    for (const e of envs) {
      const existing = await repo.findOne({ where: { name: e.name } });
      if (!existing) {
        const env = repo.create(e as Partial<Environment>);
        await repo.save(env);
        console.log(`Created environment: ${e.name}`);
      } else {
        console.log(`Environment already exists: ${e.name}`);
      }
    }

    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
