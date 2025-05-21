const { Model } = require('objection');

class WepaGsConfig extends Model {
  static get tableName() {
    return 'wepa_gs_config';
  }

  static get idColumn() {
    return 'id';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['cuenta_bancaria_id', 'limite_credito', 'fecha_inicio_vigencia', 'fecha_fin_vigencia', 'usuario_id'],
      properties: {
        id: { type: 'integer' },
        cuenta_bancaria_id: { type: 'integer' },
        limite_credito: { type: 'number' },
        fecha_inicio_vigencia: { type: 'string', format: 'date' },
        fecha_fin_vigencia: { type: 'string', format: 'date' },
        fecha_creacion: { type: 'string', format: 'date-time' },
        nombre_archivo_contrato: { type: ['string', 'null'], maxLength: 255 },
        path_archivo_contrato: { type: ['string', 'null'], maxLength: 512 },
        usuario_id: { type: 'integer' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    const CuentaBancaria = require('./CuentaBancaria');
    const Usuario = require('./Usuario');

    return {
      cuentaBancaria: {
        relation: Model.BelongsToOneRelation,
        modelClass: CuentaBancaria,
        join: {
          from: 'wepa_gs_config.cuenta_bancaria_id',
          to: 'cuentas_bancarias.id'
        }
      },
      usuario: {
        relation: Model.BelongsToOneRelation,
        modelClass: Usuario,
        join: {
          from: 'wepa_gs_config.usuario_id',
          to: 'usuarios.id'
        }
      }
    };
  }
}

module.exports = WepaGsConfig; 