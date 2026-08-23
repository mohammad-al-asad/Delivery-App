import { Ride, Transaction, DailyEarnings, DriverStats, Earnings } from '../types';

// Mock Rides Data
export const mockPendingRides: Ride[] = [
    {
        id: 'R001',
        passenger: {
            id: 'P001',
            name: 'Sarah Johnson',
            phone: '+1 (555) 123-4567',
            rating: 4.8,
        },
        pickup: {
            address: '123 Main St, Downtown',
            latitude: 40.7128,
            longitude: -74.0060,
        },
        dropoff: {
            address: '456 Park Ave, Midtown',
            latitude: 40.7589,
            longitude: -73.9851,
        },
        status: 'pending',
        fare: 15.50,
        distance: 3.2,
        duration: 12,
        requestedAt: new Date(Date.now() - 2 * 60000), // 2 minutes ago
    },
    {
        id: 'R002',
        passenger: {
            id: 'P002',
            name: 'Michael Chen',
            phone: '+1 (555) 234-5678',
            rating: 4.9,
        },
        pickup: {
            address: '789 Broadway, Theater District',
            latitude: 40.7580,
            longitude: -73.9855,
        },
        dropoff: {
            address: '321 5th Ave, Shopping District',
            latitude: 40.7614,
            longitude: -73.9776,
        },
        status: 'pending',
        fare: 12.00,
        distance: 2.1,
        duration: 8,
        requestedAt: new Date(Date.now() - 5 * 60000), // 5 minutes ago
    },
];

export const mockActiveRide: Ride = {
    id: 'R003',
    passenger: {
        id: 'P003',
        name: 'Emily Rodriguez',
        phone: '+1 (555) 345-6789',
        rating: 5.0,
    },
    pickup: {
        address: '555 Central Park West',
        latitude: 40.7829,
        longitude: -73.9654,
    },
    dropoff: {
        address: '888 Madison Ave, Upper East Side',
        latitude: 40.7736,
        longitude: -73.9566,
    },
    status: 'active',
    fare: 18.75,
    distance: 4.5,
    duration: 15,
    requestedAt: new Date(Date.now() - 10 * 60000),
    startedAt: new Date(Date.now() - 5 * 60000),
};

export const mockCompletedRides: Ride[] = [
    {
        id: 'R004',
        passenger: {
            id: 'P004',
            name: 'David Kim',
            phone: '+1 (555) 456-7890',
            rating: 4.7,
        },
        pickup: {
            address: '100 Wall St, Financial District',
            latitude: 40.7074,
            longitude: -74.0113,
        },
        dropoff: {
            address: '200 Liberty St, Battery Park',
            latitude: 40.7115,
            longitude: -74.0134,
        },
        status: 'completed',
        fare: 10.25,
        distance: 1.5,
        duration: 6,
        requestedAt: new Date(Date.now() - 120 * 60000),
        startedAt: new Date(Date.now() - 115 * 60000),
        completedAt: new Date(Date.now() - 109 * 60000),
        rating: 5,
        tip: 2.00,
    },
    {
        id: 'R005',
        passenger: {
            id: 'P005',
            name: 'Jessica Martinez',
            phone: '+1 (555) 567-8901',
            rating: 4.6,
        },
        pickup: {
            address: '300 Columbus Ave, Upper West Side',
            latitude: 40.7808,
            longitude: -73.9772,
        },
        dropoff: {
            address: '400 Amsterdam Ave, UWS',
            latitude: 40.7870,
            longitude: -73.9754,
        },
        status: 'completed',
        fare: 8.50,
        distance: 1.2,
        duration: 5,
        requestedAt: new Date(Date.now() - 180 * 60000),
        startedAt: new Date(Date.now() - 175 * 60000),
        completedAt: new Date(Date.now() - 170 * 60000),
        rating: 5,
    },
    {
        id: 'R006',
        passenger: {
            id: 'P006',
            name: 'Robert Taylor',
            phone: '+1 (555) 678-9012',
            rating: 4.9,
        },
        pickup: {
            address: '500 Lexington Ave, Midtown East',
            latitude: 40.7549,
            longitude: -73.9712,
        },
        dropoff: {
            address: '600 3rd Ave, Murray Hill',
            latitude: 40.7489,
            longitude: -73.9757,
        },
        status: 'completed',
        fare: 14.00,
        distance: 2.8,
        duration: 10,
        requestedAt: new Date(Date.now() - 240 * 60000),
        startedAt: new Date(Date.now() - 235 * 60000),
        completedAt: new Date(Date.now() - 225 * 60000),
        rating: 4,
        tip: 3.00,
    },
];

// Mock Transactions
export const mockTransactions: Transaction[] = [
    {
        id: 'T001',
        type: 'ride',
        amount: 12.25,
        status: 'completed',
        date: new Date(Date.now() - 109 * 60000),
        description: 'Ride to Battery Park',
        rideId: 'R004',
    },
    {
        id: 'T002',
        type: 'ride',
        amount: 8.50,
        status: 'completed',
        date: new Date(Date.now() - 170 * 60000),
        description: 'Ride to Amsterdam Ave',
        rideId: 'R005',
    },
    {
        id: 'T003',
        type: 'ride',
        amount: 17.00,
        status: 'completed',
        date: new Date(Date.now() - 225 * 60000),
        description: 'Ride to Murray Hill',
        rideId: 'R006',
    },
    {
        id: 'T004',
        type: 'bonus',
        amount: 25.00,
        status: 'completed',
        date: new Date(Date.now() - 24 * 60 * 60000),
        description: 'Weekend bonus',
    },
    {
        id: 'T005',
        type: 'payout',
        amount: -150.00,
        status: 'completed',
        date: new Date(Date.now() - 48 * 60 * 60000),
        description: 'Bank transfer',
    },
];

// Mock Daily Earnings (last 7 days)
export const mockDailyEarnings: DailyEarnings[] = [
    { date: '2026-02-05', amount: 145.50, rides: 12 },
    { date: '2026-02-06', amount: 178.25, rides: 15 },
    { date: '2026-02-07', amount: 132.00, rides: 10 },
    { date: '2026-02-08', amount: 198.75, rides: 18 },
    { date: '2026-02-09', amount: 165.50, rides: 14 },
    { date: '2026-02-10', amount: 189.00, rides: 16 },
    { date: '2026-02-11', amount: 37.75, rides: 3 },
];

// Mock Driver Stats
export const mockDriverStats: DriverStats = {
    todayRides: 3,
    todayEarnings: 37.75,
    hoursOnline: 2.5,
    acceptanceRate: 95,
    averageRating: 4.8,
    totalRides: 247,
};

// Mock Earnings
export const mockEarnings: Earnings = {
    today: 37.75,
    week: 1046.00,
    month: 4235.50,
    total: 4235.50,
    pending: 18.75,
};

// Helper function to format currency
export const formatCurrency = (amount: number): string => {
    return `AED ${Math.abs(amount).toFixed(0)}`;
};

// Helper function to format date
export const formatDate = (date: Date | string | number): string => {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!d || isNaN(d.getTime())) return '';
    
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Helper function to format time
export const formatTime = (date: Date | string | number): string => {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!d || isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};
