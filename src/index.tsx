import React from 'react';
import ReactDOM from 'react-dom/client';
import ToolPanel from './ToolPanel';

const PluginApp: React.FC = () => {
  return React.createElement(ToolPanel);
};

function renderStandalone() {
  const root = document.getElementById('root');
  if (!root) return;

  if (ReactDOM.createRoot) {
    ReactDOM.createRoot(root).render(React.createElement(PluginApp));
  } else {
    ReactDOM.render(React.createElement(PluginApp), root);
  }
}

function registerPlugin(api: any) {
  const { registerTool, registerSidebarButton, openPluginWindow } = api;

  registerTool({
    id: 'plugin-favorite',
    name: '网址收藏夹',
    iconName: 'Link',
    color: '#2563eb',
    textColor: '#FFFFFF',
    path: '/tools/plugin-favorite',
    component: ToolPanel,
  });

  registerSidebarButton({
    id: 'plugin-favorite-btn',
    icon: 'Link',
    label: '网址收藏夹',
    onClick: () => {
      openPluginWindow?.('plugin-favorite');
    },
  });
}

const pluginData = (window as any).__PLUGIN_DATA__;

if (pluginData) {
  renderStandalone();
}