const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijkmnpqrstuvwxyz';
const NUMBERS = '23456789';
const SYMBOLS = '!@#$%&*';
const ALL_CHARS = UPPERCASE + LOWERCASE + NUMBERS + SYMBOLS;
const PASSWORD_LENGTH = 12;

function randomInt(max: number): number {
    const limit = Math.floor(0x100000000 / max) * max;
    const values = new Uint32Array(1);

    do {
        crypto.getRandomValues(values);
    } while (values[0] >= limit);

    return values[0] % max;
}

function pickCharacter(characters: string): string {
    return characters[randomInt(characters.length)];
}

export function generateTemporaryPassword(): string {
    const characters = [
        pickCharacter(UPPERCASE),
        pickCharacter(LOWERCASE),
        pickCharacter(NUMBERS),
        pickCharacter(SYMBOLS),
    ];

    while (characters.length < PASSWORD_LENGTH) {
        characters.push(pickCharacter(ALL_CHARS));
    }

    for (let i = characters.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [characters[i], characters[j]] = [characters[j], characters[i]];
    }

    return characters.join('');
}
