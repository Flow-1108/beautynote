# Sécurité BeautyNote - Checklist

## 1. Variables d'environnement ⚠️ CRITIQUE

### Développement local
- ✅ `.env.local` est dans `.gitignore`
- ⚠️ Ne JAMAIS commiter les clés API
- ⚠️ Ne JAMAIS partager `.env.local`

### Production (Vercel)
Variables à configurer dans le dashboard Vercel :
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (⚠️ TRÈS SENSIBLE)
SUMUP_API_KEY=sup_sk_xxx (⚠️ TRÈS SENSIBLE)
SUMUP_CHECKOUT_ID=xxx
```

**⚠️ RÈGLES D'OR :**
- Clés différentes pour dev/prod
- Ne jamais exposer `SERVICE_ROLE_KEY` côté client
- Régénérer les clés si compromises

---

## 2. Supabase - Configuration sécurité

### 2.1 Row Level Security (RLS)
✅ Activé sur toutes les tables
✅ Politique : accès si authentifié

### 2.2 Désactiver l'inscription publique
⚠️ **ACTION REQUISE** :
1. Allez sur dashboard Supabase
2. Authentication > Settings
3. **Décochez "Enable email signups"**
4. Seule vous pourrez créer des comptes

### 2.3 Authentification
- ✅ Middleware Next.js protège toutes les routes
- ✅ Session via cookies sécurisés (httpOnly)
- ✅ Refresh token automatique

---

## 3. RGPD - Données personnelles

### 3.1 Données collectées
- Nom, prénom, téléphone, email
- Adresse (prestations à domicile uniquement)
- Date d'anniversaire (réduction)
- Historique RDV et paiements

### 3.2 Obligations légales
⚠️ **ACTIONS REQUISES** :

1. **Mentions légales** (créer page `/mentions-legales`) :
   - Identité du responsable de traitement
   - Finalité de la collecte
   - Durée de conservation
   - Droits des clients (accès, rectification, suppression)

2. **Politique de confidentialité** (créer page `/confidentialite`) :
   - Détail des données collectées
   - Utilisation des données
   - Sécurité des données
   - Cookies utilisés

3. **Consentement** :
   - Informer les clients lors de la collecte
   - Possibilité de refuser (sauf données nécessaires au service)

4. **Droits des clients** :
   - Droit d'accès : client peut demander ses données
   - Droit de rectification : corriger les erreurs
   - Droit à l'effacement : supprimer les données (déjà implémenté)
   - Droit d'opposition : refuser certains traitements

### 3.3 Durée de conservation recommandée
- Clients actifs : illimitée
- Clients inactifs : 3 ans après dernier RDV
- Données comptables : 10 ans (obligation légale)

---

## 4. Paiements (SumUp)

### 4.1 Sécurité
✅ Clés API stockées côté serveur uniquement
✅ Pas de données bancaires stockées
✅ Transactions via API SumUp (PCI-DSS compliant)

### 4.2 Bonnes pratiques
- ⚠️ Ne jamais logger les clés API
- ⚠️ Vérifier les webhooks SumUp (si utilisés)
- ✅ Montants en centimes (pas de problème d'arrondi)

---

## 5. Sécurité réseau

### 5.1 HTTPS
✅ Vercel fournit HTTPS automatiquement
✅ Certificat SSL gratuit et renouvelé automatiquement

### 5.2 Headers de sécurité
Vercel configure automatiquement :
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Strict-Transport-Security (HSTS)

---

## 6. Sauvegardes

### 6.1 Base de données Supabase
- ✅ Sauvegardes automatiques quotidiennes (plan gratuit : 7 jours)
- ⚠️ Plan payant recommandé pour production (30 jours de rétention)

### 6.2 Code source
- ✅ Git + GitHub = historique complet
- ✅ Vercel garde l'historique des déploiements

---

## 7. Monitoring et logs

### 7.1 Erreurs
- ✅ Vercel logs (gratuit)
- Recommandé : Sentry pour tracking d'erreurs avancé

### 7.2 Activité suspecte
⚠️ À surveiller :
- Tentatives de connexion échouées
- Requêtes API inhabituelles
- Pics de trafic anormaux

---

## 8. Mises à jour

### 8.1 Dépendances
⚠️ **ACTION RÉGULIÈRE** :
```bash
npm audit
npm audit fix
```

### 8.2 Supabase
- Vérifier les mises à jour de sécurité
- Lire les changelogs

---

## 9. Checklist avant mise en production

- [ ] Variables d'environnement configurées sur Vercel
- [ ] Inscription publique désactivée sur Supabase
- [ ] HTTPS activé (automatique sur Vercel)
- [ ] Page mentions légales créée
- [ ] Page politique de confidentialité créée
- [ ] Sauvegardes Supabase vérifiées
- [ ] Test de connexion/déconnexion
- [ ] Test sur mobile (Android + iOS)
- [ ] Vérifier que `.env.local` n'est pas sur GitHub

---

## 10. En cas de problème de sécurité

### 10.1 Clé API compromise
1. Révoquer immédiatement sur Supabase/SumUp
2. Générer nouvelle clé
3. Mettre à jour sur Vercel
4. Redéployer l'application

### 10.2 Accès non autorisé
1. Changer mot de passe Supabase
2. Vérifier les logs d'accès
3. Révoquer toutes les sessions actives
4. Analyser les données accédées

### 10.3 Fuite de données
1. Identifier l'étendue de la fuite
2. Notifier les clients concernés (obligation RGPD)
3. Déclarer à la CNIL si > 72h (obligation légale)
4. Corriger la faille

---

## Contacts utiles

- **CNIL** (RGPD) : https://www.cnil.fr
- **Supabase Support** : support@supabase.io
- **SumUp Support** : https://sumup.fr/aide
- **Vercel Support** : https://vercel.com/support
