import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../app/page';

describe('Home Page', () => {
  it('should render without crashing', () => {
    render(<Home />);
    // Basic smoke test - just ensure the component renders
    expect(document.body).toBeTruthy();
  });

  it('should contain main content', () => {
    render(<Home />);
    // Look for any text content to verify the page renders
    const mainElement = document.querySelector('main');
    expect(mainElement).toBeTruthy();
  });
});