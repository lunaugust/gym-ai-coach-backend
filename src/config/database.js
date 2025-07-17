const { PrismaClient } = require('@prisma/client');

// It's recommended to instantiate a single instance of PrismaClient and reuse it across your application.
// https://www.prisma.io/docs/concepts/components/prisma-client/client-constructor-behavior
const prisma = new PrismaClient();

module.exports = prisma;