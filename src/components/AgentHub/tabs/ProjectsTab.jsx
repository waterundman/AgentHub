import React from 'react';
import ProjectManager from '../../ProjectManager/index';

export const ProjectsTab = React.memo(function ProjectsTab({
  agents,
  persistAgents,
  onSwitchToConfig
}) {
  return (
    <ProjectManager onLaunch={(agent) => {
      onSwitchToConfig();
      const existing = agents.find(a => a.name === agent.name);
      if (!existing) {
        const newAgent = {
          hash: `${agent.name}-${Date.now()}`,
          name: agent.name,
          subtitle: agent.subtitle,
          icon: agent.icon,
          colorKey: agent.colorKey,
          systemPrompt: agent.systemPrompt,
        };
        persistAgents([...agents, newAgent]);
      }
    }} />
  );
});