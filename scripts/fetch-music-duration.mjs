import fs from 'node:fs/promises';
import path from 'node:path';

// ===================== 配置区域 =====================
const PLAYLIST_ID = '8754340379'; 

const REAL_COOKIE = process.env.NETEASE_COOKIE;
const MUSIC_JSON_PATH = path.resolve('src/data/music.json');
const LYRIC_DIR = path.resolve('public/lyrics');
const LYRIC_URL_PREFIX = '/lyrics';
// ===================================================

const formatDuration = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const ensureDir = async (dir) => {
  try { await fs.access(dir); } catch { await fs.mkdir(dir, { recursive: true }); }
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const HEADERS = {
    'Referer': 'https://music.163.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Cookie': REAL_COOKIE
};

const fetchLyrics = async (id) => {
  try {
    const res = await fetch(`https://music.163.com/api/song/lyric?id=${id}&lv=1&kv=1&tv=-1`, {
        headers: HEADERS
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.lrc?.lyric || null;
  } catch (e) {
    return null;
  }
};

async function main() {
  console.log(`🚀 开始同步网易云歌单: ${PLAYLIST_ID}`);
  await ensureDir(LYRIC_DIR);

  try {
    // 1. 获取歌单
    const res = await fetch(`https://music.163.com/api/playlist/detail?id=${PLAYLIST_ID}`, {
        headers: HEADERS
    });
    
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const data = await res.json();

    if (data.code !== 200) {
        console.error(`❌ API 依然拒绝访问，错误码: ${data.code}`);
        console.error(`👉 Cookie 可能已失效，请重新登录网页版网易云并提取 Cookie。`);
        return;
    }

    const tracks = data.result.tracks;
    console.log(`📊 成功获取权限！发现 ${tracks.length} 首歌曲...`);
    
    const musicList = [];

    for (const track of tracks) {
      // 强制 HTTPS
      const secureCover = track.album.picUrl.replace(/^http:\/\//i, 'https://');
      
      const item = {
        title: track.name,
        artist: track.artists.map(a => a.name).join(' / '),
        cover: secureCover,
        url: `https://music.163.com/song/media/outer/url?id=${track.id}.mp3`,
        duration: formatDuration(track.duration),
        lrc: undefined
      };

      // 下载歌词
      const lyricText = await fetchLyrics(track.id);
      if (lyricText) {
        const filename = `${track.id}.lrc`;
        await fs.writeFile(path.join(LYRIC_DIR, filename), lyricText);
        item.lrc = `${LYRIC_URL_PREFIX}/${filename}`;
        process.stdout.write('✅ ');
      } else {
        process.stdout.write('⚪ ');
      }

      musicList.push(item);
      await sleep(200); 
    }

    // 保存 JSON
    await fs.writeFile(MUSIC_JSON_PATH, JSON.stringify(musicList, null, 4));
    console.log(`\n\n🎉 同步成功！`);
    
  } catch (err) {
    console.error('\n❌ 运行出错:', err.message);
  }
}

main();