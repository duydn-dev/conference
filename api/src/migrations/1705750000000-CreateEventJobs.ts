import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateEventJobs1705750000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('event_jobs');
    if (!hasTable) {
      await queryRunner.createTable(
        new Table({
          name: 'event_jobs',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              isNullable: false,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'event_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'type',
              type: 'varchar',
              isNullable: false,
            },
            {
              name: 'run_at',
              type: 'timestamptz',
              isNullable: false,
            },
            {
              name: 'callback_url',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'payload',
              type: 'jsonb',
              isNullable: true,
            },
            {
              name: 'status',
              type: 'varchar',
              isNullable: false,
              default: `'PENDING'`,
            },
            {
              name: 'executed_at',
              type: 'timestamptz',
              isNullable: true,
            },
            {
              name: 'last_error',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              isNullable: false,
              default: 'now()',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              isNullable: false,
              default: 'now()',
            },
          ],
        }),
      );

      // Chỉ tạo foreign key nếu bảng events đã tồn tại (trên DB mới có thể chưa có schema này)
      const hasEventsTable = await queryRunner.hasTable('events');
      if (hasEventsTable) {
        await queryRunner.createForeignKey(
          'event_jobs',
          new TableForeignKey({
            columnNames: ['event_id'],
            referencedTableName: 'events',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('event_jobs');
    if (hasTable) {
      await queryRunner.dropTable('event_jobs', true);
    }
  }
}

