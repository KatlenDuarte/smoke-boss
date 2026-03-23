const admin = require('firebase-admin');
const serviceAccount = require('./sua-chave.json'); // Baixe no console do Firebase
const produtos = require('./produtos.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seed() {
  const batch = db.batch();
  const collectionRef = db.collection('products');

  console.log("🔥 Iniciando carga Smoke Boss...");

  produtos.forEach((p) => {
    const docRef = collectionRef.doc(); // Gera ID automático
    batch.set(docRef, {
      nome: p.nome.toUpperCase(),
      categoria: p.categoria,
      estoque: p.estoque || 0,
      estoqueMinimo: 3,
      precoCusto: 0,
      precoVenda: 0
    });
  });

  await batch.commit();
  console.log("✅ Sistema alimentado! Agora é só precificar no App.");
}

seed();