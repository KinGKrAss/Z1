import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    );
  });

  it('renders the header correctly', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Z1 Imperial Command/i)).toBeInTheDocument();
    });
  });
});
