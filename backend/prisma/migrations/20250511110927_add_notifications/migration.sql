-- CreateTable
CREATE TABLE "notificaciones" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" VARCHAR(255),
    "modulo" VARCHAR(50),
    "es_global" BOOLEAN NOT NULL DEFAULT false,
    "entidad_tipo" VARCHAR(50),
    "entidad_id" VARCHAR(50),
    "accion" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones_usuarios" (
    "id" SERIAL NOT NULL,
    "notificacion_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "fecha_lectura" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificaciones_usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones_roles" (
    "id" SERIAL NOT NULL,
    "notificacion_id" INTEGER NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificaciones_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificaciones_usuarios_notificacion_id_idx" ON "notificaciones_usuarios"("notificacion_id");

-- CreateIndex
CREATE INDEX "notificaciones_usuarios_usuario_id_idx" ON "notificaciones_usuarios"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "notificaciones_usuarios_notificacion_id_usuario_id_key" ON "notificaciones_usuarios"("notificacion_id", "usuario_id");

-- CreateIndex
CREATE INDEX "notificaciones_roles_notificacion_id_idx" ON "notificaciones_roles"("notificacion_id");

-- CreateIndex
CREATE INDEX "notificaciones_roles_rol_id_idx" ON "notificaciones_roles"("rol_id");

-- CreateIndex
CREATE UNIQUE INDEX "notificaciones_roles_notificacion_id_rol_id_key" ON "notificaciones_roles"("notificacion_id", "rol_id");

-- AddForeignKey
ALTER TABLE "notificaciones_usuarios" ADD CONSTRAINT "notificaciones_usuarios_notificacion_id_fkey" FOREIGN KEY ("notificacion_id") REFERENCES "notificaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_usuarios" ADD CONSTRAINT "notificaciones_usuarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_roles" ADD CONSTRAINT "notificaciones_roles_notificacion_id_fkey" FOREIGN KEY ("notificacion_id") REFERENCES "notificaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_roles" ADD CONSTRAINT "notificaciones_roles_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
