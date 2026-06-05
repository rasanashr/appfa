import { db } from '@/lib/db';

async function seed() {
  // Clean existing data
  await db.playlistTrack.deleteMany();
  await db.track.deleteMany();
  await db.album.deleteMany();
  await db.artist.deleteMany();
  await db.playlist.deleteMany();

  // Create Artists
  const homayoun = await db.artist.create({
    data: {
      name: 'همایون شجریان',
      imageUrl: '/covers/artist-1.svg',
      bio: 'خواننده و نوازنده برجسته موسیقی سنتی و پاپ ایرانی',
      monthlyListeners: 2500000,
    },
  });

  const ebi = await db.artist.create({
    data: {
      name: 'ابی',
      imageUrl: '/covers/artist-2.svg',
      bio: ' یکی از بزرگترین خوانندگان پاپ ایران با بیش از چهار دهه فعالیت',
      monthlyListeners: 3200000,
    },
  });

  const googoosh = await db.artist.create({
    data: {
      name: 'گوگوش',
      imageUrl: '/covers/artist-3.svg',
      bio: 'ملکه پاپ ایران و نماد موسیقی ایرانی',
      monthlyListeners: 4100000,
    },
  });

  const mohsen = await db.artist.create({
    data: {
      name: 'محسن چاوشی',
      imageUrl: '/covers/artist-4.svg',
      bio: 'خواننده و آهنگساز سبک پاپ و سنتی',
      monthlyListeners: 3800000,
    },
  });

  const reza = await db.artist.create({
    data: {
      name: 'رضا بهرام',
      imageUrl: '/covers/artist-5.svg',
      bio: 'خواننده محبوب سبک پاپ ایرانی',
      monthlyListeners: 2900000,
    },
  });

  const shervin = await db.artist.create({
    data: {
      name: 'شروین حاجی‌پور',
      imageUrl: '/covers/artist-6.svg',
      bio: 'خواننده جوان و محبوب سبک پاپ ایرانی',
      monthlyListeners: 4500000,
    },
  });

  const sirvan = await db.artist.create({
    data: {
      name: 'سیروان خسروی',
      imageUrl: '/covers/artist-7.svg',
      bio: 'خواننده و آهنگساز سبک پاپ راک',
      monthlyListeners: 2100000,
    },
  });

  const amin = await db.artist.create({
    data: {
      name: 'امین حبیبی',
      imageUrl: '/covers/artist-8.svg',
      bio: 'خواننده سبک پاپ و ترانه‌سرا',
      monthlyListeners: 1800000,
    },
  });

  // Create Albums
  const album1 = await db.album.create({
    data: {
      title: 'ناجور',
      coverUrl: '/covers/album-1.svg',
      releaseYear: 2023,
      artistId: mohsen.id,
    },
  });

  const album2 = await db.album.create({
    data: {
      title: 'خانه',
      coverUrl: '/covers/album-2.svg',
      releaseYear: 2024,
      artistId: shervin.id,
    },
  });

  const album3 = await db.album.create({
    data: {
      title: 'خاطره',
      coverUrl: '/covers/album-3.svg',
      releaseYear: 2022,
      artistId: ebi.id,
    },
  });

  const album4 = await db.album.create({
    data: {
      title: 'عطر تو',
      coverUrl: '/covers/album-4.svg',
      releaseYear: 2024,
      artistId: googoosh.id,
    },
  });

  const album5 = await db.album.create({
    data: {
      title: 'سایه‌ها',
      coverUrl: '/covers/album-5.svg',
      releaseYear: 2023,
      artistId: homayoun.id,
    },
  });

  const album6 = await db.album.create({
    data: {
      title: 'پرواز',
      coverUrl: '/covers/album-6.svg',
      releaseYear: 2024,
      artistId: reza.id,
    },
  });

  const album7 = await db.album.create({
    data: {
      title: 'شب‌های تهران',
      coverUrl: '/covers/album-7.svg',
      releaseYear: 2023,
      artistId: sirvan.id,
    },
  });

  const album8 = await db.album.create({
    data: {
      title: 'بهار',
      coverUrl: '/covers/album-8.svg',
      releaseYear: 2024,
      artistId: amin.id,
    },
  });

  // Create Tracks
  const tracks = [
    // Mohsen Chavoshi - Najor
    { title: 'ناجور', duration: 245, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-1.svg', albumId: album1.id, artistId: mohsen.id, playCount: 15200000, genre: 'پاپ' },
    { title: 'دل من', duration: 198, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-1.svg', albumId: album1.id, artistId: mohsen.id, playCount: 8900000, genre: 'پاپ' },
    { title: 'سکوت', duration: 312, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-1.svg', albumId: album1.id, artistId: mohsen.id, playCount: 6700000, genre: 'سنتی' },
    { title: 'باران', duration: 267, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-1.svg', albumId: album1.id, artistId: mohsen.id, playCount: 12400000, genre: 'پاپ' },

    // Shervin - Khaneh
    { title: 'خانه', duration: 203, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-2.svg', albumId: album2.id, artistId: shervin.id, playCount: 21000000, genre: 'پاپ' },
    { title: 'برای', duration: 178, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-2.svg', albumId: album2.id, artistId: shervin.id, playCount: 18500000, genre: 'پاپ' },
    { title: 'شب‌های مارلی', duration: 234, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-2.svg', albumId: album2.id, artistId: shervin.id, playCount: 22000000, genre: 'پاپ' },
    { title: 'دوری', duration: 256, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-2.svg', albumId: album2.id, artistId: shervin.id, playCount: 9800000, genre: 'پاپ' },

    // Ebi - Khatereh
    { title: 'خاطره', duration: 278, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-3.svg', albumId: album3.id, artistId: ebi.id, playCount: 31000000, genre: 'پاپ' },
    { title: 'گل نازم', duration: 234, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-3.svg', albumId: album3.id, artistId: ebi.id, playCount: 25000000, genre: 'پاپ' },
    { title: 'شب', duration: 198, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-3.svg', albumId: album3.id, artistId: ebi.id, playCount: 18000000, genre: 'پاپ کلاسیک' },
    { title: 'عشق من', duration: 312, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-3.svg', albumId: album3.id, artistId: ebi.id, playCount: 22000000, genre: 'پاپ' },

    // Googoosh - Atr-e To
    { title: 'عطر تو', duration: 245, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-4.svg', albumId: album4.id, artistId: googoosh.id, playCount: 19500000, genre: 'پاپ' },
    { title: 'بغضم', duration: 189, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-4.svg', albumId: album4.id, artistId: googoosh.id, playCount: 14000000, genre: 'پاپ' },
    { title: 'بی‌تو', duration: 267, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-4.svg', albumId: album4.id, artistId: googoosh.id, playCount: 16800000, genre: 'پاپ' },

    // Homayoun - Sayeha
    { title: 'سایه‌ها', duration: 356, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-5.svg', albumId: album5.id, artistId: homayoun.id, playCount: 11200000, genre: 'سنتی' },
    { title: 'آسمان', duration: 289, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-5.svg', albumId: album5.id, artistId: homayoun.id, playCount: 8900000, genre: 'سنتی' },
    { title: 'صلات', duration: 423, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-5.svg', albumId: album5.id, artistId: homayoun.id, playCount: 15000000, genre: 'سنتی' },

    // Reza Bahram - Parvaz
    { title: 'پرواز', duration: 212, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-6.svg', albumId: album6.id, artistId: reza.id, playCount: 17600000, genre: 'پاپ' },
    { title: 'آرامش', duration: 198, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-6.svg', albumId: album6.id, artistId: reza.id, playCount: 13400000, genre: 'پاپ' },
    { title: 'نگاهت', duration: 234, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-6.svg', albumId: album6.id, artistId: reza.id, playCount: 15800000, genre: 'پاپ' },

    // Sirvan - Shabhaye Tehran
    { title: 'شب‌های تهران', duration: 223, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-7.svg', albumId: album7.id, artistId: sirvan.id, playCount: 9800000, genre: 'پاپ راک' },
    { title: 'دیوونه', duration: 187, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-7.svg', albumId: album7.id, artistId: sirvan.id, playCount: 11200000, genre: 'پاپ راک' },
    { title: 'فرار', duration: 245, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-7.svg', albumId: album7.id, artistId: sirvan.id, playCount: 7600000, genre: 'راک' },

    // Amin - Bahar
    { title: 'بهار', duration: 198, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-8.svg', albumId: album8.id, artistId: amin.id, playCount: 6500000, genre: 'پاپ' },
    { title: 'دلبر', duration: 212, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-8.svg', albumId: album8.id, artistId: amin.id, playCount: 5400000, genre: 'پاپ' },
    { title: 'نجوا', duration: 267, audioUrl: '/audio/sample.mp3', coverUrl: '/covers/album-8.svg', albumId: album8.id, artistId: amin.id, playCount: 4800000, genre: 'پاپ' },
  ];

  const createdTracks = [];
  for (const track of tracks) {
    createdTracks.push(await db.track.create({ data: track }));
  }

  // Create Playlists
  const playlist1 = await db.playlist.create({
    data: {
      title: 'پاپ ایرانی روز',
      description: 'بهترین آهنگ‌های پاپ ایرانی هفته',
      coverUrl: '/covers/playlist-1.svg',
      isPublic: true,
    },
  });

  const playlist2 = await db.playlist.create({
    data: {
      title: 'سنتی و فولک',
      description: 'آهنگ‌های سنتی و فولکلوریک ایرانی',
      coverUrl: '/covers/playlist-2.svg',
      isPublic: true,
    },
  });

  const playlist3 = await db.playlist.create({
    data: {
      title: 'شب‌نشینی',
      description: 'آهنگ‌های مناسب شب‌نشینی و آرامش',
      coverUrl: '/covers/playlist-3.svg',
      isPublic: true,
    },
  });

  const playlist4 = await db.playlist.create({
    data: {
      title: 'ورزشی و پرانرژی',
      description: 'آهنگ‌های پرانرژی برای ورزش',
      coverUrl: '/covers/playlist-4.svg',
      isPublic: true,
    },
  });

  const playlist5 = await db.playlist.create({
    data: {
      title: 'عاشقانه',
      description: 'بهترین آهنگ‌های عاشقانه ایرانی',
      coverUrl: '/covers/playlist-5.svg',
      isPublic: true,
    },
  });

  // Add tracks to playlists
  const playlistTracks = [
    // Pop playlist
    { playlistId: playlist1.id, trackId: createdTracks[0].id, order: 1 },
    { playlistId: playlist1.id, trackId: createdTracks[4].id, order: 2 },
    { playlistId: playlist1.id, trackId: createdTracks[8].id, order: 3 },
    { playlistId: playlist1.id, trackId: createdTracks[13].id, order: 4 },
    { playlistId: playlist1.id, trackId: createdTracks[18].id, order: 5 },
    { playlistId: playlist1.id, trackId: createdTracks[21].id, order: 6 },

    // Traditional playlist
    { playlistId: playlist2.id, trackId: createdTracks[2].id, order: 1 },
    { playlistId: playlist2.id, trackId: createdTracks[14].id, order: 2 },
    { playlistId: playlist2.id, trackId: createdTracks[15].id, order: 3 },
    { playlistId: playlist2.id, trackId: createdTracks[16].id, order: 4 },

    // Night playlist
    { playlistId: playlist3.id, trackId: createdTracks[6].id, order: 1 },
    { playlistId: playlist3.id, trackId: createdTracks[10].id, order: 2 },
    { playlistId: playlist3.id, trackId: createdTracks[2].id, order: 3 },
    { playlistId: playlist3.id, trackId: createdTracks[15].id, order: 4 },
    { playlistId: playlist3.id, trackId: createdTracks[12].id, order: 5 },

    // Energetic playlist
    { playlistId: playlist4.id, trackId: createdTracks[5].id, order: 1 },
    { playlistId: playlist4.id, trackId: createdTracks[18].id, order: 2 },
    { playlistId: playlist4.id, trackId: createdTracks[22].id, order: 3 },
    { playlistId: playlist4.id, trackId: createdTracks[0].id, order: 4 },
    { playlistId: playlist4.id, trackId: createdTracks[24].id, order: 5 },

    // Romantic playlist
    { playlistId: playlist5.id, trackId: createdTracks[11].id, order: 1 },
    { playlistId: playlist5.id, trackId: createdTracks[13].id, order: 2 },
    { playlistId: playlist5.id, trackId: createdTracks[20].id, order: 3 },
    { playlistId: playlist5.id, trackId: createdTracks[1].id, order: 4 },
    { playlistId: playlist5.id, trackId: createdTracks[9].id, order: 5 },
  ];

  for (const pt of playlistTracks) {
    await db.playlistTrack.create({ data: pt });
  }

  console.log('✅ Seed completed successfully!');
  console.log(`  Artists: 8`);
  console.log(`  Albums: 8`);
  console.log(`  Tracks: ${createdTracks.length}`);
  console.log(`  Playlists: 5`);
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect());
