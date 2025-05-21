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
        console.log('Iniciando datos de prueba para IPS...');
        // 1. Buscar personas de tipo Funcionario o VIP
        const personas = yield prisma.persona.findMany({
            where: {
                OR: [
                    { tipo: 'Funcionario' },
                    { tipo: 'Vip' },
                    { tipo: 'funcionario' },
                    { tipo: 'vip' }
                ]
            },
            take: 5
        });
        console.log(`Encontradas ${personas.length} personas para IPS.`);
        // 2. Crear algunas personas si no hay suficientes
        if (personas.length < 3) {
            console.log('Creando personas de ejemplo...');
            const personasEjemplo = [
                {
                    nombreCompleto: 'JUAN PEREZ',
                    documento: '1234567',
                    tipo: 'Funcionario',
                    telefono: '0981123456'
                },
                {
                    nombreCompleto: 'MARIA GONZALEZ',
                    documento: '2345678',
                    tipo: 'Funcionario',
                    telefono: '0981234567'
                },
                {
                    nombreCompleto: 'CARLOS RODRIGUEZ',
                    documento: '3456789',
                    tipo: 'Vip',
                    telefono: '0982345678'
                }
            ];
            for (const persona of personasEjemplo) {
                try {
                    // Verificar si la persona ya existe
                    const existente = yield prisma.persona.findUnique({
                        where: { documento: persona.documento }
                    });
                    if (!existente) {
                        const nuevaPersona = yield prisma.persona.create({
                            data: persona
                        });
                        console.log(`Persona creada: ${nuevaPersona.nombreCompleto} (ID: ${nuevaPersona.id})`);
                        personas.push(nuevaPersona);
                    }
                    else {
                        console.log(`Persona ya existe: ${existente.nombreCompleto} (ID: ${existente.id})`);
                        // Asegurarse de que esté en nuestra lista
                        if (!personas.some(p => p.id === existente.id)) {
                            personas.push(existente);
                        }
                    }
                }
                catch (error) {
                    console.error(`Error al crear persona:`, error);
                }
            }
        }
        // 3. Registrar personas en IPS
        console.log('Registrando personas en IPS...');
        for (const persona of personas) {
            try {
                // Verificar si ya está registrada
                const registroExistente = yield prisma.$queryRaw `
        SELECT id FROM "PersonaIPS" WHERE "personaId" = ${persona.id}
      `;
                if (Array.isArray(registroExistente) && registroExistente.length > 0) {
                    console.log(`Persona ${persona.nombreCompleto} ya está registrada en IPS`);
                    continue;
                }
                // Crear una fecha aleatoria de inicio
                const fechaInicio = new Date();
                fechaInicio.setMonth(fechaInicio.getMonth() - Math.floor(Math.random() * 12));
                // Registrar en IPS
                yield prisma.$executeRaw `
        INSERT INTO "PersonaIPS" ("personaId", "fechaInicio", estado, "createdAt", "updatedAt")
        VALUES (${persona.id}, ${fechaInicio}, 'ACTIVO', NOW(), NOW())
      `;
                console.log(`Persona ${persona.nombreCompleto} (ID: ${persona.id}) registrada en IPS`);
            }
            catch (error) {
                console.error(`Error al registrar persona en IPS:`, error);
            }
        }
        console.log('Datos de prueba para IPS completados');
    });
}
main()
    .catch(e => {
    console.error('Error en script de datos de prueba:', e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
//# sourceMappingURL=seed-ips-data.js.map