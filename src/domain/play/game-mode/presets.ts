import { asGameModeId } from '@/platform/ids';
import { registerGameMode } from './registry';

registerGameMode({
  id: asGameModeId('endgame-standard'),
  label: 'Endgame',
  description: 'Rated play from a curated pool of balanced endgame positions.',
  category: 'endgame',
  ruleset: 'standard-fide',
  positionProvider: 'curated-pool',
  supportedTimeControlIds: ['blitz_3_2', 'rapid_10_0', 'bullet_1_0'],
  ratingNamespace: 'endgame-standard',
  rated: true,
  order: 10,
});

registerGameMode({
  id: asGameModeId('endgame-fixed'),
  label: 'Featured Position',
  description: 'Everyone starts from the same position — weekly hero lines.',
  category: 'endgame',
  ruleset: 'standard-fide',
  positionProvider: 'fixed-fen',
  supportedTimeControlIds: ['blitz_3_2', 'rapid_10_0'],
  ratingNamespace: 'endgame-fixed',
  rated: true,
  order: 20,
});

registerGameMode({
  id: asGameModeId('endgame-training'),
  label: 'Training',
  description: 'Unrated practice vs bot from a material-class position pool.',
  category: 'endgame',
  ruleset: 'standard-fide',
  positionProvider: 'curated-pool',
  supportedTimeControlIds: ['blitz_3_2', 'unlimited'],
  ratingNamespace: 'endgame-training',
  rated: false,
  order: 30,
});

registerGameMode({
  id: asGameModeId('endgame-draft'),
  label: 'Draft',
  description: 'Draft pieces and starting squares from an approved pool.',
  category: 'variant',
  ruleset: 'standard-fide',
  positionProvider: 'draft-pool',
  supportedTimeControlIds: ['blitz_3_2'],
  ratingNamespace: 'endgame-draft',
  rated: true,
  order: 40,
});
