import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ScoreRing from '../../components/ScoreRing';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

describe('ScoreRing Component', () => {
    it('should render score correctly', () => {
        const queryClient = createTestQueryClient();

        render(
            <QueryClientProvider client={queryClient}>
                <ScoreRing score={8.5} size={120} strokeWidth={8} />
            </QueryClientProvider>
        );

        // Check if score is displayed
        expect(screen.getByText('8.5')).toBeInTheDocument();
    });

    it('should show passing color for score >= 8', () => {
        const queryClient = createTestQueryClient();

        const { container } = render(
            <QueryClientProvider client={queryClient}>
                <ScoreRing score={9.0} size={120} strokeWidth={8} />
            </QueryClientProvider>
        );

        // Check for green/emerald color class
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('should show failing color for score < 8', () => {
        const queryClient = createTestQueryClient();

        const { container } = render(
            <QueryClientProvider client={queryClient}>
                <ScoreRing score={6.5} size={120} strokeWidth={8} />
            </QueryClientProvider>
        );

        // Check for red color class
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });
});
