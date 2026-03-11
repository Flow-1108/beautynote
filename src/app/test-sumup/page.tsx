import { testSumUpConnection } from '@/actions/test-sumup';

export default function TestSumUpPage() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold text-prune">Test de connexion SumUp</h1>
      <p className="mt-2 text-sm text-secondary">
        Cette page permet de diagnostiquer les problèmes de connexion avec l'API SumUp.
      </p>

      <form action={testSumUpConnection} className="mt-6">
        <button
          type="submit"
          className="rounded-md bg-prune px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-prune-light"
        >
          Tester la connexion SumUp
        </button>
      </form>

      <div className="mt-8 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-prune">Instructions</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-foreground">
          <li>Cliquez sur le bouton ci-dessus pour tester la connexion</li>
          <li>Ouvrez la console du navigateur (F12) pour voir les logs détaillés</li>
          <li>Vérifiez également les logs du serveur Next.js dans votre terminal</li>
        </ol>

        <div className="mt-4 rounded-md bg-yellow-50 p-3">
          <p className="text-sm text-yellow-800">
            <strong>Note :</strong> Les logs détaillés apparaîtront dans la console du serveur (terminal où Next.js tourne).
            Sur tablette, vous devrez vérifier ces logs sur votre ordinateur.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-lg font-semibold text-prune">Points de vérification</h2>
        <ul className="mt-3 space-y-2 text-sm text-foreground">
          <li>✓ Clé API SumUp configurée dans .env.local</li>
          <li>✓ Code marchand SumUp configuré dans .env.local</li>
          <li>? Terminal SumUp allumé et connecté</li>
          <li>? Terminal associé au compte marchand MDT9VQDV</li>
          <li>? Connexion Internet stable</li>
        </ul>
      </div>
    </div>
  );
}
