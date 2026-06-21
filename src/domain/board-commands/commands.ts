import { getFenFromSnapshot, graphFromFen } from '@/domain/board-core/fenCodec';
import { generatePieceId, getPieceAtNode } from '@/domain/board-core/graph';
import type { RulesetId } from '@/domain/board-core/types';
import { listRulesets, getRuleset } from '@/domain/board-rules/registry';
import { buildBoardViewModel } from '@/domain/board-session/viewModel';
import { exportBoardConfig, applyBoardConfig } from '@/domain/board-config';
import type { BoardVariantConfig } from '@/domain/board-config/types';
import { parseJsonArg, parseMetaValue } from './parser';
import type { CommandDefinition, CommandHandler, CommandResult } from './types';

const ok = (lines: string[]): CommandResult => ({ ok: true, lines });
const fail = (lines: string[]): CommandResult => ({ ok: false, lines });

const helpHandler: CommandHandler = (_ctx, args) => {
  if (args.length === 0) {
    return ok([
      'Board command language — design variants, edit graph, drive play',
      '',
      'Core:     help | status | fen | reset | history',
      'Rules:    ruleset list | ruleset set <id>',
      'Play:     move <from> <to> [promo] | play <san>',
      'Load:     load fen <fen-string>',
      'Graph:    piece place|remove|list | node show|tag|attr',
      'Meta:     meta list | meta set <key> <value> | meta get <key>',
      'Config:   config export | config apply <json>',
      'Inspect:  legal [square] | graph summary',
      '',
      'Agents: use "config apply" with BoardVariantConfig JSON (see docs/plans/board-command-language.md)',
    ]);
  }
  return ok(['Try: help — topics: ruleset, piece, node, meta, config, play']);
};

const statusHandler: CommandHandler = (ctx) => {
  const state = ctx.getState();
  const vm = buildBoardViewModel(state);
  const fen = getFenFromSnapshot(state.snapshot) ?? '(no fen codec)';
  const pieceCount = Object.keys(state.snapshot.graph.pieces).length;
  return ok([
    `ruleset: ${state.rulesetId}`,
    `topology: ${state.snapshot.graph.topologyId}`,
    `revision: ${state.revision}`,
    `pieces: ${pieceCount}`,
    `turn: ${vm.activePlayer ?? '?'}`,
    `outcome: ${state.outcome.kind}`,
    `fen: ${fen}`,
  ]);
};

const fenHandler: CommandHandler = (ctx) => {
  const fen = getFenFromSnapshot(ctx.getState().snapshot);
  return fen ? ok([fen]) : fail(['No FEN codec for current topology/ruleset.']);
};

const rulesetListHandler: CommandHandler = () => {
  const lines = listRulesets().map((r) => `- ${r.id}: ${r.label}`);
  return ok(['Registered rulesets:', ...lines]);
};

const rulesetSetHandler: CommandHandler = (ctx, args) => {
  const id = args[0];
  if (!id) {
    return fail(['Usage: ruleset set <id>']);
  }
  if (!getRuleset(id)) {
    return fail([`Unknown ruleset: ${id}`]);
  }
  const fen = getFenFromSnapshot(ctx.getState().snapshot) ?? undefined;
  return {
    ok: true,
    lines: [`Ruleset → ${id}. Session reloaded.`],
    reloadConfig: { rulesetId: id, fen },
  };
};

const loadFenHandler: CommandHandler = (ctx, args) => {
  const fen = args.join(' ');
  if (!fen) {
    return fail(['Usage: load fen <fen-string>']);
  }
  const state = ctx.getState();
  const snapshot = graphFromFen(fen, state.rulesetId as RulesetId);
  const result = ctx.apply({ type: 'load', snapshot });
  return result.ok ? ok(['Loaded FEN position.']) : fail([result.error ?? 'Load failed']);
};

const moveHandler: CommandHandler = (ctx, args) => {
  const [from, to, promotion] = args;
  if (!from || !to) {
    return fail(['Usage: move <from> <to> [promotion]']);
  }
  const result = ctx.apply({ type: 'move', from: from.toLowerCase(), to: to.toLowerCase(), promotion });
  if (!result.ok) {
    return fail([result.error ?? 'Illegal move']);
  }
  const san = result.appliedMove?.san ?? `${from}-${to}`;
  return ok([`OK ${san}`]);
};

const playHandler: CommandHandler = (ctx, args) => {
  const notation = args.join(' ');
  if (!notation) {
    return fail(['Usage: play <san>']);
  }
  const result = ctx.apply({ type: 'notation', value: notation, codec: 'san' });
  if (!result.ok) {
    return fail([result.error ?? 'Illegal notation']);
  }
  return ok([`OK ${result.appliedMove?.san ?? notation}`]);
};

const metaListHandler: CommandHandler = (ctx) => {
  const meta = ctx.getState().snapshot.graph.meta;
  const entries = Object.entries(meta);
  if (entries.length === 0) {
    return ok(['(no meta keys)']);
  }
  return ok(entries.map(([k, v]) => `${k} = ${JSON.stringify(v)}`));
};

const metaGetHandler: CommandHandler = (ctx, args) => {
  const key = args[0];
  if (!key) {
    return fail(['Usage: meta get <key>']);
  }
  const value = ctx.getState().snapshot.graph.meta[key];
  return ok([`${key} = ${JSON.stringify(value)}`]);
};

const metaSetHandler: CommandHandler = (ctx, args) => {
  const key = args[0];
  const raw = args.slice(1).join(' ');
  if (!key || !raw) {
    return fail(['Usage: meta set <key> <value>']);
  }
  const result = ctx.apply({ type: 'set-meta', key, value: parseMetaValue(raw) });
  return result.ok ? ok([`meta.${key} updated`]) : fail([result.error ?? 'Failed']);
};

const piecePlaceHandler: CommandHandler = (ctx, args) => {
  const [square, owner, kind] = args;
  if (!square || !owner || !kind) {
    return fail(['Usage: piece place <square> <owner> <kind>']);
  }
  const nodeId = square.toLowerCase();
  const piece = {
    id: generatePieceId(),
    kind: kind.toLowerCase(),
    owner: owner.toLowerCase(),
    nodeId,
  };
  const result = ctx.apply({ type: 'patch', patches: [{ op: 'place-piece', piece }] });
  return result.ok ? ok([`Placed ${owner}/${kind} on ${nodeId}`]) : fail([result.error ?? 'Failed']);
};

const pieceRemoveHandler: CommandHandler = (ctx, args) => {
  const square = args[0]?.toLowerCase();
  if (!square) {
    return fail(['Usage: piece remove <square>']);
  }
  const piece = getPieceAtNode(ctx.getState().snapshot.graph, square);
  if (!piece) {
    return fail([`No piece on ${square}`]);
  }
  const result = ctx.apply({ type: 'patch', patches: [{ op: 'remove-piece', pieceId: piece.id }] });
  return result.ok ? ok([`Removed piece from ${square}`]) : fail([result.error ?? 'Failed']);
};

const pieceListHandler: CommandHandler = (ctx) => {
  const pieces = Object.values(ctx.getState().snapshot.graph.pieces);
  if (pieces.length === 0) {
    return ok(['(no pieces)']);
  }
  return ok(
    pieces
      .sort((a, b) => a.nodeId.localeCompare(b.nodeId))
      .map((p) => `${p.nodeId}: ${p.owner}/${p.kind}`),
  );
};

const nodeShowHandler: CommandHandler = (ctx, args) => {
  const square = args[0]?.toLowerCase();
  if (!square) {
    return fail(['Usage: node show <square>']);
  }
  const graph = ctx.getState().snapshot.graph;
  const node = graph.nodes[square];
  if (!node) {
    return fail([`Unknown node: ${square}`]);
  }
  const piece = getPieceAtNode(graph, square);
  return ok([
    `node: ${square}`,
    `tags: ${(node.tags ?? []).join(', ') || '(none)'}`,
    `attrs: ${JSON.stringify(node.attrs ?? {})}`,
    `piece: ${piece ? `${piece.owner}/${piece.kind}` : '(empty)'}`,
  ]);
};

const nodeTagHandler: CommandHandler = (ctx, args) => {
  const [square, action, tag] = args;
  if (!square || !action || !tag) {
    return fail(['Usage: node tag <square> add|remove <tag>']);
  }
  const nodeId = square.toLowerCase();
  const graph = ctx.getState().snapshot.graph;
  const node = graph.nodes[nodeId];
  if (!node) {
    return fail([`Unknown node: ${nodeId}`]);
  }
  const tags = new Set(node.tags ?? []);
  if (action === 'add') {
    tags.add(tag);
  } else if (action === 'remove') {
    tags.delete(tag);
  } else {
    return fail(['Action must be add or remove']);
  }
  const result = ctx.apply({
    type: 'patch',
    patches: [{ op: 'set-node', node: { ...node, tags: Array.from(tags) } }],
  });
  return result.ok ? ok([`tags on ${nodeId}: ${Array.from(tags).join(', ') || '(none)'}`]) : fail(['Failed']);
};

const nodeAttrHandler: CommandHandler = (ctx, args) => {
  const [square, action, key, ...rest] = args;
  if (action !== 'set' || !square || !key) {
    return fail(['Usage: node attr <square> set <key> <json-value>']);
  }
  const nodeId = square.toLowerCase();
  const graph = ctx.getState().snapshot.graph;
  const node = graph.nodes[nodeId];
  if (!node) {
    return fail([`Unknown node: ${nodeId}`]);
  }
  const value = parseMetaValue(rest.join(' '));
  const result = ctx.apply({
    type: 'patch',
    patches: [{ op: 'set-node', node: { ...node, attrs: { ...(node.attrs ?? {}), [key]: value } } }],
  });
  return result.ok ? ok([`${nodeId}.attrs.${key} = ${JSON.stringify(value)}`]) : fail(['Failed']);
};

const legalHandler: CommandHandler = (ctx, args) => {
  const ruleset = getRuleset(ctx.getState().rulesetId);
  if (!ruleset) {
    return fail(['No ruleset']);
  }
  const from = args[0]?.toLowerCase();
  const moves = ruleset.legalMoves(ctx.getState().snapshot.graph, from);
  if (moves.length === 0) {
    return ok([from ? `No legal moves from ${from}` : 'No legal moves']);
  }
  return ok(moves.map((m) => (m.san ? `${m.from}→${m.to} (${m.san})` : `${m.from}→${m.to}`)));
};

const graphSummaryHandler: CommandHandler = (ctx) => {
  const graph = ctx.getState().snapshot.graph;
  return ok([
    `nodes: ${Object.keys(graph.nodes).length}`,
    `edges: ${graph.edges.length}`,
    `pieces: ${Object.keys(graph.pieces).length}`,
    `meta keys: ${Object.keys(graph.meta).join(', ') || '(none)'}`,
  ]);
};

const historyHandler: CommandHandler = (ctx) => {
  const { history } = ctx.getState();
  if (history.length === 0) {
    return ok(['(no history)']);
  }
  return ok(
    history.map((entry, i) => {
      const label =
        entry.message.type === 'move'
          ? `move ${entry.message.from}→${entry.message.to}`
          : entry.message.type === 'notation'
            ? `play ${entry.message.value}`
            : entry.message.type;
      return `${i + 1}. ${label}${entry.san ? ` (${entry.san})` : ''}`;
    }),
  );
};

const configExportHandler: CommandHandler = (ctx) => {
  const config = exportBoardConfig(ctx.getState());
  return ok([JSON.stringify(config, null, 2)]);
};

const configApplyHandler: CommandHandler = (ctx, args) => {
  const raw = args.join(' ');
  if (!raw) {
    return fail(['Usage: config apply <json>']);
  }
  let config: BoardVariantConfig;
  try {
    config = parseJsonArg(raw) as BoardVariantConfig;
  } catch {
    return fail(['Invalid JSON']);
  }
  const messages = applyBoardConfig(config, ctx.getState().rulesetId);
  const lines: string[] = [];
  for (const message of messages) {
    const result = ctx.apply(message);
    if (!result.ok) {
      return fail([...lines, result.error ?? 'Config apply failed']);
    }
    lines.push(`applied: ${message.type}`);
  }
  if (config.rulesetId && config.rulesetId !== ctx.getState().rulesetId) {
    const fen = getFenFromSnapshot(ctx.getState().snapshot) ?? undefined;
    return {
      ok: true,
      lines: [...lines, `ruleset → ${config.rulesetId}`],
      reloadConfig: { rulesetId: config.rulesetId, fen },
    };
  }
  return ok([...lines, `Config "${config.label ?? 'variant'}" applied.`]);
};

const patchJsonHandler: CommandHandler = (ctx, args) => {
  const raw = args.join(' ');
  if (!raw) {
    return fail(['Usage: patch json <patch-array-json>']);
  }
  const patches = parseJsonArg(raw);
  if (!Array.isArray(patches)) {
    return fail(['Expected JSON array of BoardPatch objects']);
  }
  const result = ctx.apply({ type: 'patch', patches });
  return result.ok ? ok([`Applied ${patches.length} patch(es).`]) : fail([result.error ?? 'Failed']);
};

const resetHandler: CommandHandler = (ctx, args) => {
  const fen =
    args.join(' ') ||
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const state = ctx.getState();
  const snapshot = graphFromFen(fen, state.rulesetId as RulesetId);
  const result = ctx.apply({ type: 'load', snapshot });
  return result.ok ? ok(['Board reset.']) : fail([result.error ?? 'Reset failed']);
};

export const BOARD_COMMANDS: CommandDefinition[] = [
  { name: 'help', usage: 'help [topic]', description: 'Show commands', handler: helpHandler },
  { name: 'status', usage: 'status', description: 'Session summary', handler: statusHandler },
  { name: 'fen', usage: 'fen', description: 'Print FEN', handler: fenHandler },
  {
    name: 'ruleset',
    usage: 'ruleset list|set <id>',
    description: 'Ruleset management',
    handler: (ctx, args) => {
      if (args[0] === 'list') return rulesetListHandler(ctx, args.slice(1), {});
      if (args[0] === 'set') return rulesetSetHandler(ctx, args.slice(1), {});
      return fail(['Usage: ruleset list | ruleset set <id>']);
    },
  },
  {
    name: 'load',
    usage: 'load fen <fen>',
    description: 'Load position',
    handler: (ctx, args) => {
      if (args[0] === 'fen') return loadFenHandler(ctx, args.slice(1), {});
      return fail(['Usage: load fen <fen-string>']);
    },
  },
  { name: 'move', usage: 'move <from> <to> [promo]', description: 'Apply move', handler: moveHandler },
  { name: 'play', usage: 'play <san>', description: 'Apply SAN move', handler: playHandler },
  {
    name: 'meta',
    usage: 'meta list|get|set',
    description: 'Graph meta',
    handler: (ctx, args) => {
      if (args[0] === 'list') return metaListHandler(ctx, args.slice(1), {});
      if (args[0] === 'get') return metaGetHandler(ctx, args.slice(1), {});
      if (args[0] === 'set') return metaSetHandler(ctx, args.slice(1), {});
      return fail(['Usage: meta list | meta get <key> | meta set <key> <value>']);
    },
  },
  {
    name: 'piece',
    usage: 'piece place|remove|list',
    description: 'Piece editing',
    handler: (ctx, args) => {
      if (args[0] === 'place') return piecePlaceHandler(ctx, args.slice(1), {});
      if (args[0] === 'remove') return pieceRemoveHandler(ctx, args.slice(1), {});
      if (args[0] === 'list') return pieceListHandler(ctx, args.slice(1), {});
      return fail(['Usage: piece place|remove|list ...']);
    },
  },
  {
    name: 'node',
    usage: 'node show|tag|attr',
    description: 'Node editing',
    handler: (ctx, args) => {
      if (args[0] === 'show') return nodeShowHandler(ctx, args.slice(1), {});
      if (args[0] === 'tag') return nodeTagHandler(ctx, args.slice(1), {});
      if (args[0] === 'attr') return nodeAttrHandler(ctx, args, {});
      return fail(['Usage: node show|tag|attr ...']);
    },
  },
  { name: 'legal', usage: 'legal [square]', description: 'List legal moves', handler: legalHandler },
  {
    name: 'graph',
    usage: 'graph summary',
    description: 'Graph stats',
    handler: (ctx, args) => {
      if (args[0] === 'summary') return graphSummaryHandler(ctx, args.slice(1), {});
      return fail(['Usage: graph summary']);
    },
  },
  { name: 'history', usage: 'history', description: 'Move history', handler: historyHandler },
  {
    name: 'config',
    usage: 'config export|apply',
    description: 'Agent variant config',
    handler: (ctx, args) => {
      if (args[0] === 'export') return configExportHandler(ctx, args.slice(1), {});
      if (args[0] === 'apply') return configApplyHandler(ctx, args.slice(1), {});
      return fail(['Usage: config export | config apply <json>']);
    },
  },
  {
    name: 'patch',
    usage: 'patch json <array>',
    description: 'Raw patches',
    handler: (ctx, args) => {
      if (args[0] === 'json') return patchJsonHandler(ctx, args.slice(1), {});
      return fail(['Usage: patch json <json-array>']);
    },
  },
  { name: 'reset', usage: 'reset [fen]', description: 'Reset board', handler: resetHandler },
];

const commandMap = new Map<string, CommandDefinition>();
for (const command of BOARD_COMMANDS) {
  commandMap.set(command.name, command);
  for (const alias of command.aliases ?? []) {
    commandMap.set(alias, command);
  }
}

export const getBoardCommand = (name: string): CommandDefinition | undefined =>
  commandMap.get(name.toLowerCase());

export const listBoardCommands = (): CommandDefinition[] => BOARD_COMMANDS;
