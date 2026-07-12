import React from 'react';

export default class ProductionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('UI subtree crashed', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="card">
          <p className="eyebrow">Ralat Paparan</p>
          <h2>Bahagian ini tidak dapat dipaparkan.</h2>
          <p>Kami masih boleh teruskan bahagian lain aplikasi.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
