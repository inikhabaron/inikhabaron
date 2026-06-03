'use client';

import React from 'react';
import { AlertCircle, Home } from 'lucide-react';

export default class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isAdmin: true,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error });
    console.error('Admin Error Boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-red-900 mb-2">
                  Error in Admin Section
                </h2>
                <p className="text-sm text-red-700 mb-4">
                  An error occurred in this page. Try refreshing or go back to the dashboard.
                </p>

                {process.env.NODE_ENV === 'development' && (
                  <pre className="text-xs bg-red-100 p-2 rounded mb-4 overflow-auto max-h-24 text-red-900">
                    {this.state.error?.toString()}
                  </pre>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={this.handleReset}
                    className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                  >
                    Retry
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 px-3 py-2 bg-gray-300 text-gray-800 text-sm rounded hover:bg-gray-400 transition flex items-center justify-center gap-1"
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
