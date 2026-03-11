'use server';

import { createCheckout, processCheckout, getCheckoutStatus } from '@/lib/sumup';
import { redirect } from 'next/navigation';

export async function testSumUpConnection() {
  console.log('\n========================================');
  console.log('🧪 TEST DE CONNEXION SUMUP');
  console.log('========================================\n');

  try {
    console.log('📋 Étape 1/3 : Vérification des variables d\'environnement...');
    
    const apiKey = process.env.SUMUP_API_KEY;
    const merchantCode = process.env.SUMUP_MERCHANT_CODE;
    
    if (!apiKey) {
      console.error('❌ SUMUP_API_KEY manquante !');
      throw new Error('SUMUP_API_KEY non configurée');
    }
    console.log('✅ SUMUP_API_KEY trouvée:', apiKey.substring(0, 15) + '...');
    
    if (!merchantCode) {
      console.error('❌ SUMUP_MERCHANT_CODE manquant !');
      throw new Error('SUMUP_MERCHANT_CODE non configuré');
    }
    console.log('✅ SUMUP_MERCHANT_CODE trouvé:', merchantCode);

    console.log('\n📋 Étape 2/3 : Création d\'un checkout de test (0.01€)...');
    
    const testCheckout = await createCheckout(
      `TEST-${Date.now()}`,
      0.01,
      'Test de connexion BeautyNote'
    );
    
    console.log('✅ Checkout créé avec succès !');
    console.log('   ID:', testCheckout.id);
    console.log('   Référence:', testCheckout.checkout_reference);
    console.log('   Montant:', testCheckout.amount, testCheckout.currency);
    console.log('   Statut:', testCheckout.status);

    console.log('\n📋 Étape 3/3 : Envoi au terminal SumUp...');
    
    const processedCheckout = await processCheckout(testCheckout.id);
    
    console.log('✅ Checkout envoyé au terminal avec succès !');
    console.log('   Statut:', processedCheckout.status);
    
    if (processedCheckout.status === 'PENDING') {
      console.log('\n⏳ Le paiement est maintenant en attente sur le terminal.');
      console.log('   Vous pouvez annuler le paiement sur le terminal.');
    }

    console.log('\n========================================');
    console.log('✅ TEST RÉUSSI !');
    console.log('========================================\n');
    console.log('La connexion avec SumUp fonctionne correctement.');
    console.log('Le terminal devrait afficher le montant de 0.01€.');
    console.log('Vous pouvez annuler ce paiement de test sur le terminal.\n');

  } catch (error) {
    console.log('\n========================================');
    console.error('❌ TEST ÉCHOUÉ !');
    console.log('========================================\n');
    
    if (error instanceof Error) {
      console.error('Erreur:', error.message);
      console.error('Stack:', error.stack);
      
      if (error.message.includes('401')) {
        console.error('\n💡 Diagnostic: La clé API est invalide ou expirée.');
        console.error('   → Vérifiez votre clé API dans le dashboard SumUp');
        console.error('   → Générez une nouvelle clé si nécessaire');
      } else if (error.message.includes('403')) {
        console.error('\n💡 Diagnostic: Permissions insuffisantes.');
        console.error('   → Vérifiez que la clé API a les permissions nécessaires');
      } else if (error.message.includes('404')) {
        console.error('\n💡 Diagnostic: Code marchand introuvable.');
        console.error('   → Vérifiez que le code marchand MDT9VQDV est correct');
        console.error('   → Vérifiez qu\'un terminal est associé à ce compte');
      } else if (error.message.includes('500') || error.message.includes('502')) {
        console.error('\n💡 Diagnostic: Problème serveur SumUp.');
        console.error('   → Réessayez dans quelques minutes');
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        console.error('\n💡 Diagnostic: Problème de connexion réseau.');
        console.error('   → Vérifiez votre connexion Internet');
      }
    } else {
      console.error('Erreur inconnue:', error);
    }
    
    console.log('\n');
  }

  redirect('/test-sumup');
}
