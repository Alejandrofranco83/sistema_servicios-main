// Suponiendo que hay una sección de relationMappings, buscar 
// donde se relaciona con aquipagoConfigs y añadir la relación con wepaGsConfigs

aquipagoConfigs: {
  relation: Model.HasManyRelation,
  modelClass: path.join(__dirname, 'AquipagoConfig'),
  join: {
    from: 'usuarios.id',
    to: 'aquipago_config.usuario_id'
  }
},
wepaGsConfigs: {
  relation: Model.HasManyRelation,
  modelClass: path.join(__dirname, 'WepaGsConfig'),
  join: {
    from: 'usuarios.id',
    to: 'wepa_gs_config.usuario_id'
  }
} 