interface ClubConfig {
    name: string;
    displayName: string;
    assistantId: string;
    logo: string;
}

export const clubs: Record<string, ClubConfig> = {
    vasatorp: {
        name: 'vasatorp',
        displayName: 'Vasatorps GK',
        assistantId: 'asst_qZsHsAUoPZ0gH0HqBLLhCdeZ',
        logo: '/Vasatorp_logga.png'
    },
}; 