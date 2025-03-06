import ChessGame from '@/components/ChessGame';

export default function Home() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-bold text-chess-blue mb-8 text-center">Chessterra</h1>
      <ChessGame />
    </div>
  );
}
