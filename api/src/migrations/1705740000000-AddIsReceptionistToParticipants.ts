import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsReceptionistToParticipants1705740000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column already exists
    const table = await queryRunner.getTable('participants');
    const columnExists = table?.findColumnByName('is_receptionist');

    if (!columnExists) {
      await queryRunner.addColumn(
        'participants',
        new TableColumn({
          name: 'is_receptionist',
          type: 'boolean',
          default: false,
          isNullable: false,
        }),
      );

      // Add comment
      await queryRunner.query(`
        COMMENT ON COLUMN participants.is_receptionist IS 'Người đón tiếp - true nếu cần đón tiếp, false nếu không'
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('participants');
    const columnExists = table?.findColumnByName('is_receptionist');

    if (columnExists) {
      await queryRunner.dropColumn('participants', 'is_receptionist');
    }
  }
}
