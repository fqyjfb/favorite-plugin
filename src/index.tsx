import React from 'react';
import ReactDOM from 'react-dom/client';
import ToolPanel from './ToolPanel';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Plugin Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: {
          padding: '24px',
          color: '#dc2626',
          fontFamily: 'monospace',
          fontSize: '13px',
          background: '#fef2f2',
          height: '100%',
          overflow: 'auto',
          whiteSpace: 'pre-wrap'
        }
      }, [
        React.createElement('h2', { style: { margin: '0 0 12px', fontSize: '16px' } }, '插件运行时错误'),
        React.createElement('p', { style: { margin: '0 0 12px' } }, String(this.state.error?.message)),
        React.createElement('pre', { style: { margin: 0, fontSize: '12px', color: '#6b7280' } }, this.state.error?.stack || '')
      ]);
    }
    return this.props.children;
  }
}

const PluginApp: React.FC = () => {
  return React.createElement(
    ErrorBoundary,
    null,
    React.createElement(ToolPanel)
  );
};

function renderStandalone() {
  const root = document.getElementById('root');
  if (!root) {
    console.error('Root element not found');
    return;
  }

  try {
    if (ReactDOM.createRoot) {
      ReactDOM.createRoot(root).render(React.createElement(PluginApp));
    } else {
      ReactDOM.render(React.createElement(PluginApp), root);
    }
  } catch (e) {
    console.error('Render failed:', e);
    root.innerHTML = `<div style="padding:24px;color:#dc2626;font-family:monospace;">渲染失败: ${String(e)}</div>`;
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

renderStandalone();

if ((window as any).__PLUGIN_DATA__) {
  registerPlugin((window as any).__PLUGIN_DATA__);
}