const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
bcrypt.hash('Milkshake006', 10).then(hash => {
  return prisma.user.updateMany({ where: {}, data: { email: 'ndicuesthernjeri@gmail.com', password: hash } })
}).then(r => console.log('Updated', r)).catch(e => console.error('ERROR', e.message)).finally(() => prisma.disconnect());
