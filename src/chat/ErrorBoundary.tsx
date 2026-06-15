import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary — prevents full-window crashes from unhandled React errors.
 * Shows a minimal recovery UI instead of a white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[fumii:ErrorBoundary]', error, errorInfo.componentStack)
  }

  handleRecover = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          minHeight: 120,
          fontFamily: "'DM Sans', sans-serif",
          color: '#9E9A8E',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 14 }}>
            {this.props.fallbackMessage || 'something went wrong — fumii hit an error'}
          </div>
          {this.state.error && (
            <code style={{
              fontSize: 11,
              color: '#E53E3E',
              background: 'rgba(229,62,62,0.08)',
              padding: '4px 10px',
              borderRadius: 6,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {this.state.error.message}
            </code>
          )}
          <button
            onClick={this.handleRecover}
            style={{
              background: 'rgba(245,166,35,0.12)',
              border: '1px solid rgba(245,166,35,0.3)',
              borderRadius: 8,
              color: '#F5A623',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 16px',
              cursor: 'pointer'
            }}
          >
            try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
