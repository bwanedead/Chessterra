import { GameImportRequest, GameSourceDescriptor, GameTimeline } from '@/domain/models/game';

export interface GameSource extends GameSourceDescriptor {
  canHandle(request: GameImportRequest): boolean;
  load(request: GameImportRequest): Promise<GameTimeline>;
}
