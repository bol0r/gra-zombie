export type MeleeWeaponId = 'katana' | 'electric_machete' | 'fire_axe';
export type RangedWeaponId = 'shotgun' | 'ricochet_rifle';

export interface MeleeWeaponSpec {
  id: MeleeWeaponId;
  name: string;
  desc: string;
  icon: string;
  damage: number;
  cooldown: number;
  range: number;
  arcAngle: number; // radians
  knockback: number;
  bladeColor: number;
  emissiveColor: number;
  trailColor: number;
  chainLightning?: boolean;
  burnDamage?: boolean;
}

export interface RangedWeaponSpec {
  id: RangedWeaponId;
  name: string;
  icon: string;
  damage: number;
  cooldown: number;
  pellets: number;
  spread: number;
  range: number;
  knockback: number;
  color: number;
}

export const MELEE_WEAPONS: Record<MeleeWeaponId, MeleeWeaponSpec> = {
  katana: {
    id: 'katana',
    name: 'Katana Rozpruwacza',
    desc: 'Szybkie szerokie cięcia',
    icon: '⚔️',
    damage: 38,
    cooldown: 0.28,
    range: 3.4,
    arcAngle: Math.PI * 0.85,
    knockback: 9.5,
    bladeColor: 0xe2e8f0,
    emissiveColor: 0x38bdf8,
    trailColor: 0x38bdf8
  },
  electric_machete: {
    id: 'electric_machete',
    name: 'Elektryczna Maczeta',
    desc: 'Łańcuchowe pioruny (3 cele)',
    icon: '⚡',
    damage: 46,
    cooldown: 0.26,
    range: 3.6,
    arcAngle: Math.PI * 0.9,
    knockback: 10.5,
    bladeColor: 0x90e0ef,
    emissiveColor: 0x00f5ff,
    trailColor: 0x00f5ff,
    chainLightning: true
  },
  fire_axe: {
    id: 'fire_axe',
    name: 'Płonący Topór Kata',
    desc: 'Potężne cięcie + Podpalenie',
    icon: '🔥',
    damage: 68,
    cooldown: 0.36,
    range: 3.8,
    arcAngle: Math.PI * 0.95,
    knockback: 14.5,
    bladeColor: 0xffbe0b,
    emissiveColor: 0xff4d00,
    trailColor: 0xff5400,
    burnDamage: true
  }
};

export const RANGED_WEAPONS: Record<RangedWeaponId, RangedWeaponSpec> = {
  shotgun: {
    id: 'shotgun',
    name: 'Strzelba Rozrzutowa',
    icon: '🔫',
    damage: 24,
    cooldown: 0.48,
    pellets: 6,
    spread: 0.34,
    range: 13,
    knockback: 15,
    color: 0xffaa00
  },
  ricochet_rifle: {
    id: 'ricochet_rifle',
    name: 'Karabin Plazmowy',
    icon: '💥',
    damage: 42,
    cooldown: 0.24,
    pellets: 2,
    spread: 0.1,
    range: 17,
    knockback: 9,
    color: 0x00f5ff
  }
};
