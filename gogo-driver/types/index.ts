export type RideStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Passenger {
    id: string;
    name: string;
    phone: string;
    rating: number;
    photo?: string;
}

export interface Location {
    address: string;
    latitude: number;
    longitude: number;
}

export interface Ride {
    id: string;
    passenger: Passenger;
    pickup: Location;
    dropoff: Location;
    status: RideStatus;
    fare: number;
    distance: number; // in km
    duration: number; // in minutes
    requestedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    rating?: number;
    tip?: number;
}

export interface Driver {
    id: string;
    name: string;
    phone: string;
    email: string;
    rating: number;
    totalRides: number;
    vehicleModel: string;
    vehiclePlate: string;
    photo?: string;
}

export interface Earnings {
    today: number;
    week: number;
    month: number;
    total: number;
    pending: number;
}

export type TransactionType = 'ride' | 'payout' | 'bonus' | 'adjustment';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    status: TransactionStatus;
    date: Date | string;
    description: string;
    rideId?: string;
}

export interface DailyEarnings {
    date: string;
    amount: number;
    rides: number;
}

export interface DriverStats {
    todayRides: number;
    todayEarnings: number;
    hoursOnline: number;
    acceptanceRate: number;
    averageRating: number;
    totalRides: number;
}
