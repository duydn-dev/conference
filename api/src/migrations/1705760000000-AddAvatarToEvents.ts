import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAvatarToEvents1705760000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Nếu bảng events chưa tồn tại thì bỏ qua migration này.
    const hasEventsTable = await queryRunner.hasTable('events');
    if (!hasEventsTable) {
      return;
    }

    // Check if column already exists
    const table = await queryRunner.getTable('events');
    const columnExists = table?.findColumnByName('avatar');

    if (!columnExists) {
      await queryRunner.addColumn(
        'events',
        new TableColumn({
          name: 'avatar',
          type: 'varchar',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('events');
    const columnExists = table?.findColumnByName('avatar');

    if (columnExists) {
      await queryRunner.dropColumn('events', 'avatar');
    }
  }
}
