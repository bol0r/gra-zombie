export type MeleeWeaponId = 'katana' | 'hammer' | 'axe' | 'electric_machete';
export type RangedWeaponId = 'pistol' | 'shotgun' | 'rifle' | 'sawed_off';

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
  bladeLength: number;
  bladeWidth: number;
  bladeColor: number;
  emissiveColor: number;
  trailColor: number;
  chainLightning?: boolean;
  burnDamage?: boolean;
  stunDuration?: number;
  chargedSlamWave?: boolean;
}

export interface RangedWeaponSpec {
  id: RangedWeaponId;
  name: string;
  desc: string;
  icon: string;
  damage: number;
  cooldown: number;
  pellets: number;
  spread: number;
  range: number;
  knockback: number;
  ammoCost: number;
  color: number;
}

export const MELEE_WEAPONS: Record<MeleeWeaponId, MeleeWeaponSpec> = {
  katana: {
    id: 'katana',
    name: 'Katana',
    desc: 'Szybkie cięcie • Naładowane koło',
    icon: '⚔️',
    damage: 38,
    cooldown: 0.26,
    range: 2.55,
    arcAngle: Math.PI * 0.85,
    knockback: 9.5,
    bladeLength: 1.4,
    bladeWidth: 0.08,
    bladeColor: 0xd8dee9,
    emissiveColor: 0x991b1b,
    trailColor: 0xdc2626
  },
  hammer: {
    id: 'hammer',
    name: 'Młotek',
    desc: 'Krótki, ogłusza • Naładowana fala',
    icon: '🔨',
    damage: 54,
    cooldown: 0.48,
    range: 1.75,
    arcAngle: Math.PI * 0.65,
    knockback: 22.0,
    bladeLength: 0.88,
    bladeWidth: 0.22,
    bladeColor: 0x9ca3af,
    emissiveColor: 0xb45309,
    trailColor: 0xd97706,
    stunDuration: 1.35,
    chargedSlamWave: true
  },
  axe: {
    id: 'axe',
    name: 'Topór',
    desc: 'Wolniejszy od katany • Podpala',
    icon: '🪓',
    damage: 58,
    cooldown: 0.38,
    range: 2.45,
    arcAngle: Math.PI * 0.9,
    knockback: 14.0,
    bladeLength: 1.22,
    bladeWidth: 0.16,
    bladeColor: 0xeab308,
    emissiveColor: 0xea580c,
    trailColor: 0xf97316,
    burnDamage: true
  },
  electric_machete: {
    id: 'electric_machete',
    name: 'Maczeta elektryczna',
    desc: 'Łańcuchowy piorun (3 cele)',
    icon: '⚡',
    damage: 44,
    cooldown: 0.3,
    range: 2.4,
    arcAngle: Math.PI * 0.85,
    knockback: 10.5,
    bladeLength: 1.25,
    bladeWidth: 0.1,
    bladeColor: 0xbae6fd,
    emissiveColor: 0x0284c7,
    trailColor: 0x38bdf8,
    chainLightning: true
  }
};

export const RANGED_WEAPONS: Record<RangedWeaponId, RangedWeaponSpec> = {
  pistol: {
    id: 'pistol',
    name: 'Pistolet',
    desc: '1 pocisk • Szybki',
    icon: '🔫',
    damage: 34,
    cooldown: 0.22,
    pellets: 1,
    spread: 0.04,
    range: 12.5,
    knockback: 6.5,
    ammoCost: 1,
    color: 0xfbbf24
  },
  shotgun: {
    id: 'shotgun',
    name: 'Strzelba',
    desc: 'Śrut • Duży odrzut',
    icon: '💥',
    damage: 21,
    cooldown: 0.58,
    pellets: 6,
    spread: 0.34,
    range: 11.5,
    knockback: 16.5,
    ammoCost: 1,
    color: 0xf59e0b
  },
  rifle: {
    id: 'rifle',
    name: 'Karabin',
    desc: 'Seria 2 strzałów • Daleki zasięg',
    icon: '🎯',
    damage: 36,
    cooldown: 0.36,
    pellets: 2,
    spread: 0.06,
    range: 18.5,
    knockback: 9.5,
    ammoCost: 2,
    color: 0xfcd34d
  },
  sawed_off: {
    id: 'sawed_off',
    name: 'Obrzyn',
    desc: 'Blisko • Ogromny odrzut (2 nab.)',
    icon: '🔥',
    damage: 26,
    cooldown: 0.68,
    pellets: 8,
    spread: 0.56,
    range: 7.2,
    knockback: 26.0,
    ammoCost: 2,
    color: 0xea580c
  }
};
