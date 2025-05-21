"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificacionModel = void 0;
const client_1 = require("@prisma/client");
// Crear un prisma client estándar
const prisma = new client_1.PrismaClient();
exports.NotificacionModel = {
    // Obtener todas las notificaciones
    findAll: () => __awaiter(void 0, void 0, void 0, function* () {
        return prisma.notificacion.findMany({
            orderBy: {
                fechaCreacion: 'desc'
            }
        });
    }),
    // Obtener una notificación por ID
    findById: (id) => __awaiter(void 0, void 0, void 0, function* () {
        const notificacion = yield prisma.notificacion.findUnique({
            where: { id }
        });
        if (!notificacion)
            return null;
        // Obtener usuarios asociados
        const notificacionUsuarios = yield prisma.notificacionUsuario.findMany({
            where: { notificacionId: id },
            include: { usuario: true }
        });
        // Obtener roles asociados
        const notificacionRoles = yield prisma.notificacionRol.findMany({
            where: { notificacionId: id },
            include: { rol: true }
        });
        return Object.assign(Object.assign({}, notificacion), { usuarios: notificacionUsuarios, roles: notificacionRoles });
    }),
    // Obtener notificaciones para un usuario específico
    findByUsuario: (usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Verificar si el usuario existe
            const usuario = yield prisma.usuario.findUnique({
                where: { id: usuarioId },
                include: { rol: true }
            });
            if (!usuario)
                return [];
            console.log(`Consultando notificaciones para usuario: ${usuarioId}`);
            // Para obtener notificaciones de usuario, de su rol y globales, 
            // necesitamos hacer consultas separadas y combinarlas
            // 1. Notificaciones directas para el usuario
            const notificacionesUsuario = yield prisma.notificacionUsuario.findMany({
                where: { usuarioId },
                include: {
                    notificacion: true
                }
            });
            // 2. Notificaciones para el rol del usuario
            const notificacionesRol = yield prisma.notificacionRol.findMany({
                where: { rolId: usuario.rolId },
                include: {
                    notificacion: true
                }
            });
            // 3. Notificaciones globales
            const notificacionesGlobales = yield prisma.notificacion.findMany({
                where: { esGlobal: true }
            });
            // Combinar todos los resultados evitando duplicados
            const idSet = new Set();
            const notificacionesCombinadas = [];
            // Procesar notificaciones de usuario
            for (const nu of notificacionesUsuario) {
                if (!idSet.has(nu.notificacionId)) {
                    idSet.add(nu.notificacionId);
                    notificacionesCombinadas.push(Object.assign(Object.assign({}, nu.notificacion), { leida: nu.leida || false, fechaLectura: nu.fechaLectura }));
                }
            }
            // Procesar notificaciones de rol
            for (const nr of notificacionesRol) {
                if (!idSet.has(nr.notificacionId)) {
                    idSet.add(nr.notificacionId);
                    // Verificar si el usuario ha leído esta notificación
                    const lecturaRegistro = yield prisma.notificacionUsuario.findUnique({
                        where: {
                            notificacionId_usuarioId: {
                                notificacionId: nr.notificacionId,
                                usuarioId
                            }
                        }
                    });
                    notificacionesCombinadas.push(Object.assign(Object.assign({}, nr.notificacion), { leida: (lecturaRegistro === null || lecturaRegistro === void 0 ? void 0 : lecturaRegistro.leida) || false, fechaLectura: lecturaRegistro === null || lecturaRegistro === void 0 ? void 0 : lecturaRegistro.fechaLectura }));
                }
            }
            // Procesar notificaciones globales
            for (const ng of notificacionesGlobales) {
                if (!idSet.has(ng.id)) {
                    idSet.add(ng.id);
                    // Verificar si el usuario ha leído esta notificación global
                    const lecturaRegistro = yield prisma.notificacionUsuario.findUnique({
                        where: {
                            notificacionId_usuarioId: {
                                notificacionId: ng.id,
                                usuarioId
                            }
                        }
                    });
                    notificacionesCombinadas.push(Object.assign(Object.assign({}, ng), { leida: (lecturaRegistro === null || lecturaRegistro === void 0 ? void 0 : lecturaRegistro.leida) || false, fechaLectura: lecturaRegistro === null || lecturaRegistro === void 0 ? void 0 : lecturaRegistro.fechaLectura }));
                }
            }
            // Ordenar por fecha de creación (más recientes primero)
            const notificacionesOrdenadas = notificacionesCombinadas.sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());
            console.log(`Encontradas ${notificacionesOrdenadas.length} notificaciones para el usuario ${usuarioId}`);
            if (notificacionesOrdenadas.length > 0) {
                console.log('Primera notificación después de formateo:', {
                    id: notificacionesOrdenadas[0].id,
                    tipo: notificacionesOrdenadas[0].tipo,
                    tipoValue: typeof notificacionesOrdenadas[0].tipo
                });
            }
            return notificacionesOrdenadas;
        }
        catch (error) {
            console.error('Error al obtener notificaciones por usuario:', error);
            return [];
        }
    }),
    // Obtener notificaciones no leídas para un usuario
    findNoLeidasByUsuario: (usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const todasLasNotificaciones = yield exports.NotificacionModel.findByUsuario(usuarioId);
            // Depuración para verificar
            console.log(`Total notificaciones para usuario ${usuarioId} antes de filtrar: ${todasLasNotificaciones.length}`);
            // Filtrar solo las no leídas de manera más estricta
            const noLeidas = todasLasNotificaciones.filter(n => n.leida === false);
            // Más logs para depuración
            console.log(`Notificaciones no leídas encontradas para usuario ${usuarioId}: ${noLeidas.length}`);
            if (noLeidas.length > 0) {
                console.log('Primera notificación no leída de la consulta:', {
                    id: noLeidas[0].id,
                    fechaCreacion: noLeidas[0].fechaCreacion,
                    tipo: noLeidas[0].tipo,
                    tipoDeValor: typeof noLeidas[0].tipo,
                    leida: noLeidas[0].leida
                });
            }
            else {
                console.log('No se encontraron notificaciones no leídas para el usuario', usuarioId);
            }
            return noLeidas;
        }
        catch (error) {
            console.error('Error al obtener notificaciones no leídas por usuario:', error);
            return [];
        }
    }),
    // Contar notificaciones no leídas para un usuario
    countNoLeidasByUsuario: (usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const notificaciones = yield exports.NotificacionModel.findNoLeidasByUsuario(usuarioId);
            const count = notificaciones.length;
            console.log(`Contador para usuario ${usuarioId}: ${count} notificaciones no leídas`);
            return count;
        }
        catch (error) {
            console.error('Error al contar notificaciones no leídas:', error);
            return 0;
        }
    }),
    // Crear una nueva notificación global
    create: (data) => __awaiter(void 0, void 0, void 0, function* () {
        // Validar el tipo de notificación antes de almacenarla
        const tipoValido = ['info', 'warning', 'error', 'success'].includes(data.tipo)
            ? data.tipo
            : 'info';
        try {
            // 1. Crear la notificación
            const notificacion = yield prisma.notificacion.create({
                data: {
                    titulo: data.titulo,
                    mensaje: data.mensaje,
                    tipo: tipoValido,
                    url: data.url,
                    modulo: data.modulo,
                    esGlobal: data.esGlobal || false,
                    entidadTipo: data.entidadTipo,
                    entidadId: data.entidadId,
                    accion: data.accion
                }
            });
            // 2. Si es global, crear registros para todos los usuarios activos
            if (data.esGlobal) {
                const usuariosActivos = yield prisma.usuario.findMany({
                    where: { activo: true },
                    select: { id: true }
                });
                // Crear registros en notificaciones_usuarios para cada usuario activo
                const createPromises = usuariosActivos.map(usuario => prisma.notificacionUsuario.create({
                    data: {
                        notificacionId: notificacion.id,
                        usuarioId: usuario.id,
                        leida: false
                    }
                }));
                yield Promise.all(createPromises);
                console.log(`Creados registros para notificación global ${notificacion.id} para ${usuariosActivos.length} usuarios activos`);
            }
            return notificacion;
        }
        catch (error) {
            console.error('Error al crear notificación:', error);
            throw error;
        }
    }),
    // Crear registros en la tabla notificaciones_usuarios para todos los usuarios
    crearRegistrosParaTodosLosUsuarios: (notificacionId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Obtener todos los usuarios activos
            const usuariosActivos = yield prisma.usuario.findMany({
                where: { activo: true },
                select: { id: true }
            });
            // Crear registros no leídos para cada usuario
            const createPromises = usuariosActivos.map(usuario => prisma.notificacionUsuario.upsert({
                where: {
                    notificacionId_usuarioId: {
                        notificacionId,
                        usuarioId: usuario.id
                    }
                },
                update: {}, // No actualizamos nada si ya existe
                create: {
                    notificacionId,
                    usuarioId: usuario.id,
                    leida: false
                }
            }));
            yield Promise.all(createPromises);
            console.log(`Creados registros para notificación ${notificacionId} para ${usuariosActivos.length} usuarios`);
        }
        catch (error) {
            console.error('Error al crear registros para todos los usuarios:', error);
        }
    }),
    // Crear una notificación y asignarla a un usuario específico
    createForUsuario: (data, usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
        // Validar el tipo de notificación
        const tipoValido = ['info', 'warning', 'error', 'success'].includes(data.tipo)
            ? data.tipo
            : 'info';
        try {
            // 1. Crear la notificación
            const notificacion = yield prisma.notificacion.create({
                data: {
                    titulo: data.titulo,
                    mensaje: data.mensaje,
                    tipo: tipoValido,
                    url: data.url,
                    modulo: data.modulo,
                    esGlobal: false,
                    entidadTipo: data.entidadTipo,
                    entidadId: data.entidadId,
                    accion: data.accion
                }
            });
            // 2. Asignarla al usuario destinatario (como no leída)
            yield prisma.notificacionUsuario.create({
                data: {
                    notificacionId: notificacion.id,
                    usuarioId: usuarioId,
                    leida: false
                }
            });
            // 3. También hacerla visible para el usuario actual (emisor) pero como leída
            // Obtener el ID del usuario actual (asumimos que es admin para simplificar)
            const usuarioAdmin = yield prisma.usuario.findFirst({
                where: { username: 'admin' }
            });
            if (usuarioAdmin && usuarioAdmin.id !== usuarioId) {
                yield prisma.notificacionUsuario.create({
                    data: {
                        notificacionId: notificacion.id,
                        usuarioId: usuarioAdmin.id,
                        leida: true,
                        fechaLectura: new Date()
                    }
                });
            }
            return notificacion;
        }
        catch (error) {
            console.error('Error al crear notificación para usuario:', error);
            throw error;
        }
    }),
    // Crear una notificación y asignarla a un rol específico
    createForRol: (data, rolId) => __awaiter(void 0, void 0, void 0, function* () {
        // Validar el tipo de notificación
        const tipoValido = ['info', 'warning', 'error', 'success'].includes(data.tipo)
            ? data.tipo
            : 'info';
        try {
            // 1. Crear la notificación
            const notificacion = yield prisma.notificacion.create({
                data: {
                    titulo: data.titulo,
                    mensaje: data.mensaje,
                    tipo: tipoValido,
                    url: data.url,
                    modulo: data.modulo,
                    esGlobal: false,
                    entidadTipo: data.entidadTipo,
                    entidadId: data.entidadId,
                    accion: data.accion
                }
            });
            // 2. Asignarla al rol
            yield prisma.notificacionRol.create({
                data: {
                    notificacionId: notificacion.id,
                    rolId: rolId
                }
            });
            // 3. Crear registros para todos los usuarios con ese rol
            const usuariosDelRol = yield prisma.usuario.findMany({
                where: {
                    rolId: rolId,
                    activo: true
                },
                select: { id: true }
            });
            // Crear registros en notificaciones_usuarios para cada usuario del rol
            for (const usuario of usuariosDelRol) {
                yield prisma.notificacionUsuario.create({
                    data: {
                        notificacionId: notificacion.id,
                        usuarioId: usuario.id,
                        leida: false
                    }
                });
            }
            console.log(`Creados registros para notificación ${notificacion.id} para ${usuariosDelRol.length} usuarios del rol ${rolId}`);
            // 4. También hacerla visible para el usuario que la crea (admin)
            const usuarioAdmin = yield prisma.usuario.findFirst({
                where: { username: 'admin' }
            });
            // Solo si el admin no está ya incluido entre los usuarios del rol
            if (usuarioAdmin && !usuariosDelRol.some(u => u.id === usuarioAdmin.id)) {
                yield prisma.notificacionUsuario.create({
                    data: {
                        notificacionId: notificacion.id,
                        usuarioId: usuarioAdmin.id,
                        leida: true,
                        fechaLectura: new Date()
                    }
                });
            }
            return notificacion;
        }
        catch (error) {
            console.error('Error al crear notificación para rol:', error);
            throw error;
        }
    }),
    // Marcar una notificación como leída para un usuario
    marcarComoLeida: (notificacionId, usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Usar upsert para crear o actualizar el registro
            yield prisma.notificacionUsuario.upsert({
                where: {
                    notificacionId_usuarioId: {
                        notificacionId,
                        usuarioId
                    }
                },
                update: {
                    leida: true,
                    fechaLectura: new Date()
                },
                create: {
                    notificacionId,
                    usuarioId,
                    leida: true,
                    fechaLectura: new Date()
                }
            });
            return { success: true };
        }
        catch (error) {
            console.error('Error al marcar notificación como leída:', error);
            throw error;
        }
    }),
    // Marcar todas las notificaciones como leídas para un usuario
    marcarTodasComoLeidas: (usuarioId) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Obtener todas las notificaciones del usuario (directas, por rol o globales)
            const notificaciones = yield exports.NotificacionModel.findByUsuario(usuarioId);
            // Para cada notificación, crear o actualizar un registro en notificaciones_usuarios
            for (const notif of notificaciones) {
                yield exports.NotificacionModel.marcarComoLeida(notif.id, usuarioId);
            }
            return { success: true };
        }
        catch (error) {
            console.error('Error al marcar todas las notificaciones como leídas:', error);
            throw error;
        }
    }),
    // Eliminar una notificación
    delete: (id) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Eliminar la notificación (Prisma se encargará de eliminar las relaciones por el onDelete: Cascade)
            yield prisma.notificacion.delete({
                where: { id }
            });
            return { success: true };
        }
        catch (error) {
            console.error('Error al eliminar notificación:', error);
            throw error;
        }
    }),
    // Actualizar una notificación
    update: (id, data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Validar el tipo si se está actualizando
            let tipoValidado = data.tipo;
            if (data.tipo && !['info', 'warning', 'error', 'success'].includes(data.tipo)) {
                tipoValidado = 'info';
            }
            // Actualizar la notificación
            const notificacionActualizada = yield prisma.notificacion.update({
                where: { id },
                data: {
                    titulo: data.titulo,
                    mensaje: data.mensaje,
                    tipo: tipoValidado,
                    url: data.url,
                    modulo: data.modulo,
                    esGlobal: data.esGlobal,
                    entidadTipo: data.entidadTipo,
                    entidadId: data.entidadId,
                    accion: data.accion
                }
            });
            // Si es global y se cambió a true, crear registros para todos los usuarios
            if (data.esGlobal === true) {
                yield exports.NotificacionModel.crearRegistrosParaTodosLosUsuarios(id);
            }
            return notificacionActualizada;
        }
        catch (error) {
            console.error('Error al actualizar notificación:', error);
            throw error;
        }
    })
};
//# sourceMappingURL=notificacion.model.js.map