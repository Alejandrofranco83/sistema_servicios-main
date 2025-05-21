/**
 * Migración para crear la tabla wepa_gs_config
 */
exports.up = function(knex) {
  return knex.schema.createTable('wepa_gs_config', function(table) {
    table.increments('id').primary();
    table.integer('cuenta_bancaria_id').unsigned().notNullable();
    table.foreign('cuenta_bancaria_id').references('id').inTable('cuentas_bancarias');
    table.decimal('limite_credito', 15, 2).notNullable();
    table.date('fecha_inicio_vigencia').notNullable();
    table.date('fecha_fin_vigencia').notNullable();
    table.timestamp('fecha_creacion').defaultTo(knex.fn.now());
    table.string('nombre_archivo_contrato', 255);
    table.string('path_archivo_contrato', 512);
    table.integer('usuario_id').unsigned().notNullable();
    table.foreign('usuario_id').references('id').inTable('usuarios');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('wepa_gs_config');
}; 