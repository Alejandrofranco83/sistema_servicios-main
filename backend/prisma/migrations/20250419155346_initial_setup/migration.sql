-- CreateTable
CREATE TABLE "Persona" (
    "id" SERIAL NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "tipo" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vale" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "monto_texto" TEXT,
    "fecha_emision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" TIMESTAMP(3) NOT NULL,
    "fecha_cobro" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "motivo" TEXT NOT NULL,
    "impreso" BOOLEAN NOT NULL DEFAULT false,
    "observaciones_internas" TEXT,
    "persona_id" INTEGER NOT NULL,
    "persona_nombre" TEXT NOT NULL,
    "usuario_creador_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rol" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permiso" (
    "id" SERIAL NOT NULL,
    "modulo" TEXT NOT NULL,
    "pantalla" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "personaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "password" TEXT NOT NULL DEFAULT '123',
    "nombre" TEXT NOT NULL,
    "rolId" INTEGER,
    "tipo" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valorDolar" DECIMAL(10,2) NOT NULL,
    "valorReal" DECIMAL(10,2) NOT NULL,
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CambioMoneda" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monedaOrigen" TEXT NOT NULL,
    "monedaDestino" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "cotizacion" DECIMAL(15,4) NOT NULL,
    "resultado" DECIMAL(15,2) NOT NULL,
    "observacion" TEXT NOT NULL,
    "usuarioId" INTEGER,
    "cajaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CambioMoneda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sucursal" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maletin" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "sucursalId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maletin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caja" (
    "id" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "fechaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMP(3),
    "sucursalId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "maletinId" INTEGER NOT NULL,
    "saldoInicialPYG" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "saldoInicialUSD" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "saldoInicialBRL" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "saldoFinalPYG" DECIMAL(15,2),
    "saldoFinalUSD" DECIMAL(15,2),
    "saldoFinalBRL" DECIMAL(15,2),
    "detallesDenominacion" JSONB,
    "servicios" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "detallesDenominacionFinal" JSONB,
    "serviciosFinal" JSONB,

    CONSTRAINT "Caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuentaBancaria" (
    "id" SERIAL NOT NULL,
    "banco" TEXT NOT NULL,
    "numeroCuenta" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bancoId" INTEGER,
    "tipo" TEXT NOT NULL DEFAULT 'Cuenta Corriente',

    CONSTRAINT "CuentaBancaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispositivoPos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigoBarras" TEXT NOT NULL,
    "cuentaBancariaId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispositivoPos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimientoCaja" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cajaId" TEXT NOT NULL,
    "operadora" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "rutaComprobante" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimientoCaja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimiento" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT NOT NULL,
    "tipoMovimiento" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "moneda" TEXT NOT NULL,
    "cajaId" TEXT,
    "nombrePersona" TEXT,
    "documentoPersona" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "estadoRecepcion" TEXT DEFAULT 'PENDIENTE',
    "fechaRecepcion" TIMESTAMP(3),
    "observacionRecepcion" TEXT,
    "sucursalId" TEXT,
    "sucursalNombre" TEXT,
    "usuarioRecepcion" TEXT,

    CONSTRAINT "Movimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperacionBancaria" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "montoACobrar" DECIMAL(15,2),
    "tipoServicio" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codigoBarrasPos" TEXT,
    "posDescripcion" TEXT,
    "numeroComprobante" TEXT,
    "cuentaBancariaId" INTEGER,
    "cajaId" TEXT NOT NULL,
    "rutaComprobante" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperacionBancaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operadora" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "moneda" TEXT NOT NULL,
    "observacion" TEXT,
    "cajaId" TEXT NOT NULL,
    "rutaComprobante" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uso_devolucion" (
    "id" SERIAL NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "persona_id" INTEGER NOT NULL,
    "persona_nombre" VARCHAR(255) NOT NULL,
    "guaranies" BIGINT NOT NULL DEFAULT 0,
    "dolares" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reales" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "motivo" TEXT NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anulado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "uso_devolucion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saldo_persona" (
    "persona_id" INTEGER NOT NULL,
    "guaranies" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dolares" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" SERIAL NOT NULL,

    CONSTRAINT "saldo_persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banco" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositoBancario" (
    "id" TEXT NOT NULL,
    "numeroBoleta" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacion" TEXT,
    "rutaComprobante" TEXT,
    "bancoId" INTEGER,
    "cuentaBancariaId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositoBancario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_servicios" (
    "id" SERIAL NOT NULL,
    "cajaId" TEXT NOT NULL,
    "operadora" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "moneda" TEXT NOT NULL,
    "observacion" TEXT,
    "rutaComprobante" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caja_mayor_movimientos" (
    "id" SERIAL NOT NULL,
    "fechaHora" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "operacionId" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "esIngreso" BOOLEAN NOT NULL,
    "saldoAnterior" DECIMAL(15,2) NOT NULL,
    "saldoActual" DECIMAL(15,2) NOT NULL,
    "concepto" TEXT,
    "usuarioId" INTEGER NOT NULL,
    "observaciones" TEXT,
    "valeId" TEXT,
    "cambioMonedaId" TEXT,
    "usoDevolucionId" INTEGER,
    "depositoId" TEXT,
    "pagoServicioId" INTEGER,
    "movimientoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caja_mayor_movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteos" (
    "id" SERIAL NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moneda" TEXT NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "saldo_sistema" DECIMAL(15,2) NOT NULL,
    "diferencia" DECIMAL(15,2) NOT NULL,
    "observaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'completado',
    "usuario_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conteos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conteo_detalles" (
    "id" SERIAL NOT NULL,
    "conteo_id" INTEGER NOT NULL,
    "denominacion" DECIMAL(15,2) NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "conteo_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PermisoToRol" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PermisoToRol_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Persona_documento_key" ON "Persona"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "Vale_numero_key" ON "Vale"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_personaId_key" ON "Usuario"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "Sucursal_codigo_key" ON "Sucursal"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Maletin_codigo_key" ON "Maletin"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "DispositivoPos_codigoBarras_key" ON "DispositivoPos"("codigoBarras");

-- CreateIndex
CREATE UNIQUE INDEX "saldo_persona_persona_id_key" ON "saldo_persona"("persona_id");

-- CreateIndex
CREATE UNIQUE INDEX "Banco_nombre_key" ON "Banco"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "DepositoBancario_numeroBoleta_key" ON "DepositoBancario"("numeroBoleta");

-- CreateIndex
CREATE INDEX "caja_mayor_movimientos_tipo_idx" ON "caja_mayor_movimientos"("tipo");

-- CreateIndex
CREATE INDEX "caja_mayor_movimientos_fechaHora_idx" ON "caja_mayor_movimientos"("fechaHora");

-- CreateIndex
CREATE INDEX "caja_mayor_movimientos_moneda_idx" ON "caja_mayor_movimientos"("moneda");

-- CreateIndex
CREATE INDEX "caja_mayor_movimientos_usuarioId_idx" ON "caja_mayor_movimientos"("usuarioId");

-- CreateIndex
CREATE INDEX "conteos_fecha_hora_idx" ON "conteos"("fecha_hora");

-- CreateIndex
CREATE INDEX "conteos_moneda_idx" ON "conteos"("moneda");

-- CreateIndex
CREATE INDEX "conteos_usuario_id_idx" ON "conteos"("usuario_id");

-- CreateIndex
CREATE INDEX "conteo_detalles_conteo_id_idx" ON "conteo_detalles"("conteo_id");

-- CreateIndex
CREATE INDEX "_PermisoToRol_B_index" ON "_PermisoToRol"("B");

-- AddForeignKey
ALTER TABLE "Vale" ADD CONSTRAINT "Vale_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vale" ADD CONSTRAINT "Vale_usuario_creador_id_fkey" FOREIGN KEY ("usuario_creador_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "Rol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CambioMoneda" ADD CONSTRAINT "CambioMoneda_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CambioMoneda" ADD CONSTRAINT "CambioMoneda_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maletin" ADD CONSTRAINT "Maletin_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_maletinId_fkey" FOREIGN KEY ("maletinId") REFERENCES "Maletin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Caja" ADD CONSTRAINT "Caja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuentaBancaria" ADD CONSTRAINT "CuentaBancaria_bancoId_fkey" FOREIGN KEY ("bancoId") REFERENCES "Banco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispositivoPos" ADD CONSTRAINT "DispositivoPos_cuentaBancariaId_fkey" FOREIGN KEY ("cuentaBancariaId") REFERENCES "CuentaBancaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimientoCaja" ADD CONSTRAINT "MovimientoCaja_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperacionBancaria" ADD CONSTRAINT "OperacionBancaria_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperacionBancaria" ADD CONSTRAINT "OperacionBancaria_cuentaBancariaId_fkey" FOREIGN KEY ("cuentaBancariaId") REFERENCES "CuentaBancaria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "Caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uso_devolucion" ADD CONSTRAINT "uso_devolucion_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uso_devolucion" ADD CONSTRAINT "uso_devolucion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saldo_persona" ADD CONSTRAINT "saldo_persona_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositoBancario" ADD CONSTRAINT "DepositoBancario_bancoId_fkey" FOREIGN KEY ("bancoId") REFERENCES "Banco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositoBancario" ADD CONSTRAINT "DepositoBancario_cuentaBancariaId_fkey" FOREIGN KEY ("cuentaBancariaId") REFERENCES "CuentaBancaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositoBancario" ADD CONSTRAINT "DepositoBancario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caja_mayor_movimientos" ADD CONSTRAINT "caja_mayor_movimientos_movimientoId_fkey" FOREIGN KEY ("movimientoId") REFERENCES "Movimiento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caja_mayor_movimientos" ADD CONSTRAINT "caja_mayor_movimientos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteos" ADD CONSTRAINT "conteos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conteo_detalles" ADD CONSTRAINT "conteo_detalles_conteo_id_fkey" FOREIGN KEY ("conteo_id") REFERENCES "conteos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermisoToRol" ADD CONSTRAINT "_PermisoToRol_A_fkey" FOREIGN KEY ("A") REFERENCES "Permiso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermisoToRol" ADD CONSTRAINT "_PermisoToRol_B_fkey" FOREIGN KEY ("B") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
