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
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Iniciando inserción de datos de prueba para IPS...');
            // 1. Obtener o crear personas
            console.log('Buscando personas...');
            let personas = yield prisma.persona.findMany({
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
            console.log(`Se encontraron ${personas.length} personas existentes`);
            // 2. Crear personas de ejemplo si no hay suficientes
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
                            console.log(`Creando persona: ${persona.nombreCompleto}`);
                            const nuevaPersona = yield prisma.persona.create({
                                data: persona
                            });
                            personas.push(nuevaPersona);
                        }
                        else {
                            console.log(`Persona ya existe: ${existente.nombreCompleto}`);
                            // Solo agregar si no está en la lista
                            if (!personas.some(p => p.id === existente.id)) {
                                personas.push(existente);
                            }
                        }
                    }
                    catch (error) {
                        console.error(`Error al crear persona ${persona.nombreCompleto}:`, error);
                    }
                }
            }
            // 3. Insertar directamente en la tabla PersonaIPS
            console.log(`Insertando registros en PersonaIPS para ${personas.length} personas...`);
            for (const persona of personas) {
                try {
                    // Verificar si ya está registrada
                    const existeRegistro = yield prisma.$queryRaw `
          SELECT id FROM "PersonaIPS" WHERE "personaId" = ${persona.id}
        `;
                    if (Array.isArray(existeRegistro) && existeRegistro.length > 0) {
                        console.log(`Persona ${persona.nombreCompleto} ya está registrada en IPS`);
                        continue;
                    }
                    // Crear fecha aleatoria en el último año
                    const fechaInicio = new Date();
                    fechaInicio.setMonth(fechaInicio.getMonth() - Math.floor(Math.random() * 12));
                    yield prisma.$executeRaw `
          INSERT INTO "PersonaIPS" ("personaId", "fechaInicio", estado, "createdAt", "updatedAt")
          VALUES (${persona.id}, ${fechaInicio}, 'ACTIVO', NOW(), NOW())
        `;
                    console.log(`✅ Persona ${persona.nombreCompleto} (ID: ${persona.id}) registrada en IPS`);
                }
                catch (error) {
                    console.error(`❌ Error al registrar persona en IPS:`, error);
                }
            }
            console.log('✅ Script completado con éxito');
        }
        catch (error) {
            console.error('❌ Error general:', error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
main();
//# sourceMappingURL=insert-ips-data.js.map