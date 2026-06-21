import { asTimeControlId } from '@/platform/ids';
import { registerTimeControl } from './registry';

registerTimeControl({
  id: asTimeControlId('bullet_1_0'),
  label: '1+0 Bullet',
  kind: 'fischer',
  initialMs: 60_000,
  incrementMs: 0,
  order: 10,
});

registerTimeControl({
  id: asTimeControlId('blitz_3_2'),
  label: '3+2 Blitz',
  kind: 'fischer',
  initialMs: 180_000,
  incrementMs: 2_000,
  order: 20,
});

registerTimeControl({
  id: asTimeControlId('rapid_10_0'),
  label: '10+0 Rapid',
  kind: 'fischer',
  initialMs: 600_000,
  incrementMs: 0,
  order: 30,
});

registerTimeControl({
  id: asTimeControlId('unlimited'),
  label: 'Unlimited',
  kind: 'unlimited',
  initialMs: 0,
  incrementMs: 0,
  order: 100,
});
