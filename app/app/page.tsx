// Editor de moléculas — rota pública /app, acessível com ou sem login.

import MoleculeEditor from '../components/MoleculeEditor';

export default function AppPage() {
  return (
    <main className="w-screen h-screen overflow-hidden">
      <MoleculeEditor />
    </main>
  );
}
