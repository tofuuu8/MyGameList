// What changed in each version, newest first.
// Add a new entry at the TOP before every update. People see it once, after they update.
// type: 'new' | 'improved' | 'fixed'
import features from './features';

export const releases = [
  {
    id: '1.1.0',
    date: 'October 2026',
    title: features.steamImport ? 'Steam import, backups, goals and a Dropped status' : 'Backups, goals and a Dropped status',
    changes: [
      ...(features.steamImport
        ? [
            { type: 'new', text: 'Import your Steam library. Open Profile, then Import from Steam (or use the card on the Add tab). Your Steam profile needs Game details set to Public. It adds your games with their covers and hours played, and importing again never makes duplicates.' },
          ]
        : []),
      { type: 'new', text: 'Back up your library. Open Profile, then Backup and restore. Save your games as a spreadsheet (CSV) or as a backup file (JSON), and restore from a backup file whenever you need to.' },
      { type: 'new', text: 'A Dropped status for games you stopped playing. It appears when you add or edit a game, in the Library filters, and in your Stats.' },
      { type: 'new', text: 'Play-time goals. Set a target number of hours on a game\'s page. Your progress shows on the game and on its card in the Library, and Stats counts the goals you reached.' },
      { type: 'new', text: 'This What\'s new page. After each update you will see what changed. You can read past updates any time in Profile, under What\'s new.' },
    ],
  },
  {
    id: '1.0.1',
    date: 'October 2026',
    title: 'Show password and a smarter My PC',
    changes: [
      { type: 'new', text: 'A Show / Hide button on every password box, so you can check what you typed.' },
      { type: 'improved', text: 'My PC now lets you pick your processor and graphics from lists instead of typing them.' },
      { type: 'improved', text: 'My PC understands laptops with integrated graphics. Integrated graphics are now rated against what a game asks for, so games that need a stronger graphics card no longer show "Can run".' },
      { type: 'improved', text: 'Results show Unknown when the app cannot read a game\'s graphics requirement, instead of guessing.' },
    ],
  },
  {
    id: '1.0.0',
    date: 'October 2026',
    title: 'The first version',
    changes: [
      { type: 'new', text: 'Your game library with play status, install status, ratings, hours and notes.' },
      { type: 'new', text: 'Discover, Add game, Stats, My PC and filters.' },
    ],
  },
];
