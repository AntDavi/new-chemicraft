// Página principal. Monta o MoleculeEditor ocupando toda a viewport.

import MoleculeEditor from './components/MoleculeEditor';

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden">
      <MoleculeEditor />
    </main>
  );
}
