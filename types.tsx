// app/src/types.ts

// Type for a single chat message
export type Message = {
    id: string;
    from: 'user' | 'bot';
    text: string;
    ts: number;
};

// Type for the farmer's profile data
export type Profile = {
    crop?: string;
    language?: string;
};

// If you add more types in the future, you can put them here