import type {Locale} from './locale';

export const topicSlugs = ['bloggers', 'movies', 'books'] as const;
export type Topic = typeof topicSlugs[number];

type DiscoveryCopy = Record<Topic, string> & {
  intro: Record<Topic, string>;
  home: string;
  catalog: string;
  latest: string;
  play: string;
  privacy: string;
  watch: string;
  games: string;
  emptyGames: string;
  source: string;
  empty: string;
  unavailable: string;
  noVideo: string;
  stale: string;
  followers: string;
  next: string;
  previous: string;
  open: string;
  published: string;
  checked: string;
  disabled: string;
};

export const discoveryCopy: Record<Locale, DiscoveryCopy> = {
  be: {
    bloggers: 'Беларускамоўныя блогеры',
    movies: 'Кіно і мультфільмы па-беларуску',
    books: 'Кнігі па-беларуску',
    intro: {
      bloggers: 'Беларускамоўныя блогеры і аўтары пра культуру, гульні, гісторыю, навуку і штодзённае жыццё. Знаходзьце каналы на YouTube, Twitch, Instagram, TikTok і іншых пляцоўках і адкрывайце новы кантэнт на беларускай мове.',
      movies: 'Фільмы і мультфільмы па-беларуску ў адным каталогу. Знаходзьце беларускамоўную агучку, пераклады і арыгінальнае кіно ды пераходзьце да легальнай крыніцы прагляду.',
      books: 'Кнігі па-беларуску ў адным каталогу: мастацкая літаратура, нон-фікшн, пераклады і коміксы. Адкрывайце назвы і аўтараў, чытайце апісанні і пераходзьце да кнігарні або іншай крыніцы.',
    },
    home: 'На галоўную', catalog: 'Каталог', latest: 'Апошняе відэа',
    play: 'Загрузіць прайгравальнік YouTube', privacy: 'Пасля націскання ваш браўзер злучыцца з YouTube.',
    watch: 'Глядзець на YouTube', games: 'У якія гульні гуляе аўтар',
    emptyGames: 'Пацверджаны спіс гульняў яшчэ не запоўнены.', source: 'Відэа-пацвярджэнне',
    empty: 'У гэтай тэме пакуль няма апублікаваных матэрыялаў.',
    unavailable: 'Не ўдалося атрымаць апошняе відэа. Канал можна адкрыць на YouTube.',
    noVideo: 'Апублікаваных відэа пакуль не знойдзена.', stale: 'Паказваем апошнія захаваныя даныя.',
    followers: 'Падпісантаў', next: 'Далей', previous: 'Назад', open: 'Адкрыць крыніцу',
    published: 'Апублікавана', checked: 'Праверана',
    disabled: 'Аўтар не дазволіў убудаваны прагляд гэтага відэа.',
  },
  uk: {
    bloggers: 'Білоруськомовні блогери',
    movies: 'Кіно та мультфільми білоруською',
    books: 'Книжки білоруською',
    intro: {
      bloggers: 'Знаходьте білоруськомовних блогерів і авторів про культуру, ігри, історію, науку та повсякденне життя на YouTube, Twitch, Instagram, TikTok та інших платформах.',
      movies: 'Фільми та мультфільми білоруською в одному каталозі: озвучення, переклади й оригінальні роботи з посиланнями на легальні джерела перегляду.',
      books: 'Книжки білоруською в одному каталозі: художня література, нон-фікшн, переклади та комікси з описами й посиланнями на книгарні чи інші джерела.',
    },
    home: 'На головну', catalog: 'Каталог', latest: 'Останнє відео',
    play: 'Завантажити програвач YouTube', privacy: 'Після натискання ваш браузер з’єднається з YouTube.',
    watch: 'Дивитися на YouTube', games: 'В які ігри грає автор',
    emptyGames: 'Підтверджений список ігор ще не заповнено.', source: 'Відео-підтвердження',
    empty: 'У цій темі поки немає опублікованих матеріалів.',
    unavailable: 'Не вдалося отримати останнє відео. Канал можна відкрити на YouTube.',
    noVideo: 'Опублікованих відео поки не знайдено.', stale: 'Показуємо останні збережені дані.',
    followers: 'Підписників', next: 'Далі', previous: 'Назад', open: 'Відкрити джерело',
    published: 'Опубліковано', checked: 'Перевірено',
    disabled: 'Автор не дозволив вбудований перегляд цього відео.',
  },
  en: {
    bloggers: 'Belarusian-language creators',
    movies: 'Films and animation in Belarusian',
    books: 'Books in Belarusian',
    intro: {
      bloggers: 'Discover Belarusian-language bloggers and creators covering culture, gaming, history, science and everyday life on YouTube, Twitch, Instagram, TikTok and other platforms.',
      movies: 'Explore films and animation in Belarusian, including Belarusian voice-overs, translations and original productions, with links to legitimate viewing sources.',
      books: 'Explore books in Belarusian: fiction, non-fiction, translations and comics, with descriptions and links to bookstores or other sources.',
    },
    home: 'Back to home', catalog: 'Catalog', latest: 'Latest video',
    play: 'Load YouTube player', privacy: 'Clicking connects your browser to YouTube.',
    watch: 'Watch on YouTube', games: 'Games this creator has played',
    emptyGames: 'The confirmed games list has not been added yet.', source: 'Supporting video',
    empty: 'There are no published items in this topic yet.',
    unavailable: 'The latest video could not be retrieved. You can open the channel on YouTube.',
    noVideo: 'No published videos found yet.', stale: 'Showing the last saved data.',
    followers: 'Subscribers', next: 'Next', previous: 'Previous', open: 'Open source',
    published: 'Published', checked: 'Checked',
    disabled: 'The creator has disabled embedded playback for this video.',
  },
  ru: {
    bloggers: 'Белорусскоязычные блогеры',
    movies: 'Кино и мультфильмы на белорусском',
    books: 'Книги на белорусском',
    intro: {
      bloggers: 'Находите белорусскоязычных блогеров и авторов о культуре, играх, истории, науке и повседневной жизни на YouTube, Twitch, Instagram, TikTok и других платформах.',
      movies: 'Фильмы и мультфильмы на белорусском языке в одном каталоге: озвучка, переводы и оригинальные работы со ссылками на легальные источники просмотра.',
      books: 'Книги на белорусском языке в одном каталоге: художественная литература, нон-фикшн, переводы и комиксы с описаниями и ссылками на магазины или другие источники.',
    },
    home: 'На главную', catalog: 'Каталог', latest: 'Последнее видео',
    play: 'Загрузить проигрыватель YouTube', privacy: 'После нажатия ваш браузер соединится с YouTube.',
    watch: 'Смотреть на YouTube', games: 'В какие игры играет автор',
    emptyGames: 'Подтверждённый список игр ещё не заполнен.', source: 'Видео-подтверждение',
    empty: 'В этой теме пока нет опубликованных материалов.',
    unavailable: 'Не удалось получить последнее видео. Канал можно открыть на YouTube.',
    noVideo: 'Опубликованные видео пока не найдены.', stale: 'Показываем последние сохранённые данные.',
    followers: 'Подписчиков', next: 'Далее', previous: 'Назад', open: 'Открыть источник',
    published: 'Опубликовано', checked: 'Проверено',
    disabled: 'Автор не разрешил встроенный просмотр этого видео.',
  },
};
