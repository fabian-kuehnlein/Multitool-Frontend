import { SettingsTab } from '../models/settings-tab.enum';

export interface SettingsTabDefinition {
    readonly key: SettingsTab;
    readonly adminOnly: boolean;
}

export const SETTINGS_TABS: readonly SettingsTabDefinition[] = [
    { key: SettingsTab.GENERAL, adminOnly: false },
    { key: SettingsTab.CATEGORIES, adminOnly: false },
    { key: SettingsTab.ADMIN, adminOnly: true },
];
