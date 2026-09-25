import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '3rem auto', fontFamily: 'sans-serif', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <h2 style={{ color: '#0f172a', margin: '0 0 1rem 0' }}>频繁项集与关联分析实验室 - 渲染提示</h2>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>
            系统捕获到渲染异常：{this.state.error?.message || '未知错误'}
          </p>
          <pre style={{ background: '#f8fafc', padding: '1rem', borderRadius: '4px', fontSize: '12px', overflow: 'auto', maxHeight: '200px' }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            重新加载实验室
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function mountApp() {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    createRoot(rootEl).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
