import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDescriptionAndImageToMinigamePrizes1705770000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('minigame_prizes');
    
    // Add description column
    const descriptionColumnExists = table?.findColumnByName('description');
    if (!descriptionColumnExists) {
      await queryRunner.addColumn(
        'minigame_prizes',
        new TableColumn({
          name: 'description',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    // Add image column
    const imageColumnExists = table?.findColumnByName('image');
    if (!imageColumnExists) {
      await queryRunner.addColumn(
        'minigame_prizes',
        new TableColumn({
          name: 'image',
          type: 'varchar',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('minigame_prizes');
    
    // Remove image column
    const imageColumnExists = table?.findColumnByName('image');
    if (imageColumnExists) {
      await queryRunner.dropColumn('minigame_prizes', 'image');
    }

    // Remove description column
    const descriptionColumnExists = table?.findColumnByName('description');
    if (descriptionColumnExists) {
      await queryRunner.dropColumn('minigame_prizes', 'description');
    }
  }
}
