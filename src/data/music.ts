// src/data/music.ts

export interface MusicItem {
    title: string;
    artist: string;
    cover: string;
    url: string;
    lrc?: string;      // 例如: "/lyrics/12345.lrc"
    duration?: string; // 例如: "03:50"
}

// 这里的 music.json 是由 scripts/fetch-music.mjs 自动生成的
// 如果报错找不到文件，请先运行一次脚本: node scripts/fetch-music.mjs
import musicData from './music.json';

export const musicList: MusicItem[] = musicData;