/**
 * PersonaOS persona ids -> agent persona ids (agents/personas/<id>/).
 * The app predates the agents and uses short ids; the agents use full names.
 * One table, read by the state exporter and by the Heartbeat card.
 */
export const AGENT_IDS = { vane: "romy-vane", maya: "maya-voss", roam: "romy-roam" };

export const agentIdOf = (personaId) => AGENT_IDS[personaId] ?? null;
