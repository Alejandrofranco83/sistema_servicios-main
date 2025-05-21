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
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Iniciando creación de usuario administrador...');
            // 1. Verificar si ya existe un rol de Administrador
            let adminRol = yield prisma.rol.findFirst({
                where: {
                    nombre: 'ADMINISTRADOR',
                },
            });
            // Si no existe el rol, crearlo
            if (!adminRol) {
                console.log('Creando rol de Administrador...');
                adminRol = yield prisma.rol.create({
                    data: {
                        nombre: 'ADMINISTRADOR',
                        descripcion: 'Rol con acceso completo al sistema',
                    },
                });
                // Crear permisos básicos para el administrador
                const modulos = [
                    'PRINCIPAL', 'CAJA_MAYOR', 'SALDOS_MONETARIOS', 'OPERACIONES',
                    'PDV', 'RECURSOS_HUMANOS', 'CONFIGURACION'
                ];
                const pantallas = [
                    'VER', 'BALANCE', 'USUARIOS', 'ROLES', 'COTIZACIONES',
                    'SUCURSALES', 'MALETINES', 'CAJAS', 'CONTROL_CAJAS', 'PERSONAS'
                ];
                // Crear permisos y asociarlos al rol
                for (const modulo of modulos) {
                    for (const pantalla of pantallas) {
                        const permiso = yield prisma.permiso.create({
                            data: {
                                modulo,
                                pantalla,
                                descripcion: `Permiso para ${modulo} - ${pantalla}`,
                                roles: {
                                    connect: {
                                        id: adminRol.id,
                                    },
                                },
                            },
                        });
                        console.log(`Permiso creado: ${modulo} - ${pantalla}`);
                    }
                }
            }
            // 2. Verificar si ya existe la persona administradora
            const existingPersona = yield prisma.persona.findFirst({
                where: {
                    documento: '0000000',
                },
            });
            // 3. Crear la persona si no existe
            let adminPersona;
            if (!existingPersona) {
                console.log('Creando persona para el administrador...');
                adminPersona = yield prisma.persona.create({
                    data: {
                        nombreCompleto: 'ADMINISTRADOR DEL SISTEMA',
                        documento: '0000000',
                        tipo: 'Funcionario',
                        telefono: '0000000',
                        direccion: 'Administración',
                    },
                });
            }
            else {
                adminPersona = existingPersona;
                console.log('La persona administradora ya existe.');
            }
            // 4. Verificar si ya existe el usuario administrador
            const existingUser = yield prisma.usuario.findFirst({
                where: {
                    username: 'ADMIN',
                },
            });
            // 5. Crear el usuario si no existe
            if (!existingUser) {
                console.log('Creando usuario administrador...');
                const adminUser = yield prisma.usuario.create({
                    data: {
                        nombre: 'ADMINISTRADOR',
                        username: 'ADMIN',
                        password: '123', // Password por defecto
                        rol: {
                            connect: {
                                id: adminRol.id
                            }
                        },
                        persona: {
                            connect: {
                                id: adminPersona.id
                            }
                        }
                    },
                });
                console.log('Usuario administrador creado correctamente:');
                console.log(`  Username: ${adminUser.username}`);
                console.log(`  Password: 123`);
            }
            else {
                console.log('El usuario administrador ya existe.');
                console.log(`  Username: ${existingUser.username}`);
                console.log(`  Password: 123 (por defecto)`);
            }
            console.log('Proceso completado exitosamente.');
        }
        catch (error) {
            console.error('Error durante la creación del usuario administrador:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=create-admin-user.js.map