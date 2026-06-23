import { Component, type ReactNode } from 'react';

interface Props {
  fallback: ReactNode;
  children: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Renders `fallback` if loading a GLB asset fails (e.g. the file hasn't been
 * added yet). Keeps the show running with the procedural / placeholder version.
 */
export class ModelErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.warn(
      `[${this.props.label ?? 'model'}] failed to load, using fallback.`,
      error
    );
  }

  render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
